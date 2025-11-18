import { Response } from 'express';
import { AuditFindingModel, AuditFinding } from '../models/AuditFindingModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export const createAuditFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const finding: AuditFinding = {
      ...req.body,
      createdBy: req.user.id,
      identifiedBy: req.body.identifiedBy || req.user.id,
    };

    const findingId = await AuditFindingModel.create(finding);

    res.status(201).json({
      message: 'Audit finding created successfully',
      findingId,
    });
  } catch (error) {
    console.error('Create audit finding error:', error);
    res.status(500).json({ error: 'Failed to create audit finding' });
  }
};

export const getAuditFindings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, severity, auditId, assignedTo, category } = req.query;

    const findings = await AuditFindingModel.findAll({
      status: status as string,
      severity: severity as string,
      auditId: auditId ? parseInt(auditId as string, 10) : undefined,
      assignedTo: assignedTo ? parseInt(assignedTo as string, 10) : undefined,
      category: category as string,
    });

    res.json(findings);
  } catch (error) {
    console.error('Get audit findings error:', error);
    res.status(500).json({ error: 'Failed to get audit findings' });
  }
};

export const getAuditFindingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const finding = await AuditFindingModel.findById(parseInt(id, 10));
    if (!finding) {
      res.status(404).json({ error: 'Audit finding not found' });
      return;
    }

    res.json(finding);
  } catch (error) {
    console.error('Get audit finding error:', error);
    res.status(500).json({ error: 'Failed to get audit finding' });
  }
};

export const getAuditFindingsByAuditId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    const findings = await AuditFindingModel.findByAuditId(parseInt(auditId, 10));

    res.json(findings);
  } catch (error) {
    console.error('Get audit findings by audit error:', error);
    res.status(500).json({ error: 'Failed to get audit findings' });
  }
};

export const updateAuditFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    await AuditFindingModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Audit finding updated successfully' });
  } catch (error) {
    console.error('Update audit finding error:', error);
    res.status(500).json({ error: 'Failed to update audit finding' });
  }
};

export const deleteAuditFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await AuditFindingModel.delete(parseInt(id, 10));

    res.json({ message: 'Audit finding deleted successfully' });
  } catch (error) {
    console.error('Delete audit finding error:', error);
    res.status(500).json({ error: 'Failed to delete audit finding' });
  }
};

export const linkFindingToNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ncrId } = req.body;

    if (!ncrId) {
      res.status(400).json({ error: 'NCR ID is required' });
      return;
    }

    await AuditFindingModel.linkToNCR(parseInt(id, 10), ncrId);

    res.json({ message: 'Audit finding linked to NCR successfully' });
  } catch (error) {
    console.error('Link finding to NCR error:', error);
    res.status(500).json({ error: 'Failed to link finding to NCR' });
  }
};

export const getAuditFindingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    const stats = await AuditFindingModel.getFindingStatsByAudit(parseInt(auditId, 10));

    res.json(stats);
  } catch (error) {
    console.error('Get audit finding stats error:', error);
    res.status(500).json({ error: 'Failed to get audit finding statistics' });
  }
};

export const getAuditFindingsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, processId } = req.query;

    const filters: {
      startDate?: Date;
      endDate?: Date;
      processId?: number;
    } = {};

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }
    if (processId) {
      filters.processId = parseInt(processId as string, 10);
    }

    const summary = await AuditFindingModel.getFindingsSummary(filters);

    res.json(summary);
  } catch (error) {
    console.error('Get audit findings summary error:', error);
    res.status(500).json({ error: 'Failed to get audit findings summary' });
  }
};
