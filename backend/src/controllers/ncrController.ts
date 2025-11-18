import { Response } from 'express';
import { NCRModel, NCR } from '../models/NCRModel';
import { AuthRequest, NCRStatus } from '../types';
import { validationResult } from 'express-validator';
import { addImpactScores } from '../services/ncrService';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';
import { WebhookService } from '../services/webhookService';

export const createNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const ncr: NCR = req.body;

    const ncrId = await NCRModel.create(ncr);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: ncrId,
      entityIdentifier: ncr.ncrNumber,
      newValues: ncr,
    });

    // Trigger webhook for NCR created event
    WebhookService.triggerEvent('ncr.created', 'NCR', ncrId, {
      id: ncrId,
      ...ncr,
    }).catch(err => console.error('Webhook trigger error:', err));

    res.status(201).json({
      message: 'NCR created successfully',
      id: ncrId,
    });
  } catch (error) {
    console.error('Create NCR error:', error);
    res.status(500).json({ error: 'Failed to create NCR' });
  }
};

export const getNCRs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, severity, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      status: status as NCRStatus | undefined,
      severity: severity as string | undefined,
    };

    const allNCRs = await NCRModel.findAll(filters);

    // Add impact scores to NCRs
    const ncrsWithImpact = addImpactScores(allNCRs);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNCRs = ncrsWithImpact.slice(startIndex, endIndex);

    res.json({
      data: paginatedNCRs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allNCRs.length,
        pages: Math.ceil(allNCRs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get NCRs error:', error);
    res.status(500).json({ error: 'Failed to get NCRs' });
  }
};

export const getNCRById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    // Add impact score
    const ncrService = await import('../services/ncrService');
    const ncrWithImpact = ncrService.addImpactScore(ncr);

    res.json(ncrWithImpact);
  } catch (error) {
    console.error('Get NCR error:', error);
    res.status(500).json({ error: 'Failed to get NCR' });
  }
};

export const updateNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: parseInt(id, 10),
      entityIdentifier: ncr.ncrNumber,
      oldValues: ncr,
      newValues: updates,
    });

    // Trigger webhook for NCR updated event
    const updatedNcr = await NCRModel.findById(parseInt(id, 10));
    if (updatedNcr) {
      WebhookService.triggerEvent('ncr.updated', 'NCR', parseInt(id, 10), updatedNcr as unknown as Record<string, unknown>)
        .catch(err => console.error('Webhook trigger error:', err));
    }

    res.json({ message: 'NCR updated successfully' });
  } catch (error) {
    console.error('Update NCR error:', error);
    res.status(500).json({ error: 'Failed to update NCR' });
  }
};

export const updateNCRStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    // Additional check: Only Admin and Manager can close NCRs
    if (status === 'closed') {
      const hasClosePermission = req.user.roles.some(role => 
        role === 'admin' || role === 'manager' || role === 'superuser'
      );
      if (!hasClosePermission) {
        res.status(403).json({ error: 'Only Admin and Manager can close NCRs' });
        return;
      }
    }

    await NCRModel.update(parseInt(id, 10), { status });

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: parseInt(id, 10),
      entityIdentifier: ncr.ncrNumber,
      oldValues: { status: ncr.status },
      newValues: { status },
      actionDescription: `NCR status changed from ${ncr.status} to ${status}`,
    });

    // Trigger webhook for NCR closed event
    if (status === 'closed') {
      const updatedNcr = await NCRModel.findById(parseInt(id, 10));
      if (updatedNcr) {
        WebhookService.triggerEvent('ncr.closed', 'NCR', parseInt(id, 10), updatedNcr as unknown as Record<string, unknown>)
          .catch(err => console.error('Webhook trigger error:', err));
      }
    }

    res.json({ 
      message: 'NCR status updated successfully',
      status 
    });
  } catch (error) {
    console.error('Update NCR status error:', error);
    res.status(500).json({ error: 'Failed to update NCR status' });
  }
};

export const assignNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { assignedTo } = req.body;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.update(parseInt(id, 10), { assignedTo });

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: parseInt(id, 10),
      entityIdentifier: ncr.ncrNumber,
      oldValues: { assignedTo: ncr.assignedTo },
      newValues: { assignedTo },
      actionDescription: `NCR assigned to user ${assignedTo}`,
    });

    res.json({ 
      message: 'NCR assigned successfully',
      assignedTo 
    });
  } catch (error) {
    console.error('Assign NCR error:', error);
    res.status(500).json({ error: 'Failed to assign NCR' });
  }
};

export const deleteNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: parseInt(id, 10),
      entityIdentifier: ncr.ncrNumber,
      oldValues: ncr,
    });

    res.json({ message: 'NCR deleted successfully' });
  } catch (error) {
    console.error('Delete NCR error:', error);
    res.status(500).json({ error: 'Failed to delete NCR' });
  }
};

export const getNCRClassificationOptions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ncrClassification = await import('../constants/ncrClassification');

    res.json({
      severities: ncrClassification.getAllSeverities(),
      sources: ncrClassification.getAllSources(),
      types: ncrClassification.getAllTypes(),
      severityDescriptions: ncrClassification.SEVERITY_DESCRIPTIONS,
      sourceDescriptions: ncrClassification.SOURCE_DESCRIPTIONS,
      typeDescriptions: ncrClassification.TYPE_DESCRIPTIONS,
      impactScores: ncrClassification.IMPACT_SCORES,
    });
  } catch (error) {
    console.error('Get NCR classification options error:', error);
    res.status(500).json({ error: 'Failed to get NCR classification options' });
  }
};

export const getNCRsByInspectionRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const ncrs = await NCRModel.findByInspectionRecordId(parseInt(inspectionRecordId, 10));

    // Add impact scores to NCRs
    const ncrsWithImpact = addImpactScores(ncrs);

    res.json({
      data: ncrsWithImpact,
      count: ncrsWithImpact.length,
    });
  } catch (error) {
    console.error('Get NCRs by inspection record error:', error);
    res.status(500).json({ error: 'Failed to get NCRs for inspection record' });
  }
};

export const getNCRMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const filters: { startDate?: Date; endDate?: Date } = {};

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const metrics = await NCRModel.getMetrics(filters);

    res.json(metrics);
  } catch (error) {
    console.error('Get NCR metrics error:', error);
    res.status(500).json({ error: 'Failed to get NCR metrics' });
  }
};
