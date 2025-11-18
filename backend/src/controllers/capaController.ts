import { Response } from 'express';
import { CAPAModel, CAPA } from '../models/CAPAModel';
import { AuthRequest, CAPAStatus } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const capa: CAPA = req.body;

    const capaId = await CAPAModel.create(capa);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: capaId,
      entityIdentifier: capa.capaNumber,
      newValues: capa,
    });

    res.status(201).json({
      message: 'CAPA created successfully',
      id: capaId,
    });
  } catch (error) {
    console.error('Create CAPA error:', error);
    res.status(500).json({ error: 'Failed to create CAPA' });
  }
};

export const getCAPAs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      status: status as CAPAStatus | undefined,
      priority: priority as string | undefined,
    };

    const allCAPAs = await CAPAModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCAPAs = allCAPAs.slice(startIndex, endIndex);

    res.json({
      data: paginatedCAPAs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allCAPAs.length,
        pages: Math.ceil(allCAPAs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get CAPAs error:', error);
    res.status(500).json({ error: 'Failed to get CAPAs' });
  }
};

export const getCAPAById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    res.json(capa);
  } catch (error) {
    console.error('Get CAPA error:', error);
    res.status(500).json({ error: 'Failed to get CAPA' });
  }
};

export const updateCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if CAPA exists
    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    await CAPAModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: capa,
      newValues: updates,
    });

    res.json({ message: 'CAPA updated successfully' });
  } catch (error) {
    console.error('Update CAPA error:', error);
    res.status(500).json({ error: 'Failed to update CAPA' });
  }
};

export const deleteCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if CAPA exists
    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    await CAPAModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: capa,
    });

    res.json({ message: 'CAPA deleted successfully' });
  } catch (error) {
    console.error('Delete CAPA error:', error);
    res.status(500).json({ error: 'Failed to delete CAPA' });
  }
};

// Workflow-specific endpoints

export const assignCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { actionOwner, targetDate } = req.body;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    // Update the CAPA with new assignment
    const updates = {
      actionOwner,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status: CAPAStatus.OPEN,
    };
    await CAPAModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: { actionOwner: capa.actionOwner, targetDate: capa.targetDate },
      newValues: updates,
      actionDescription: `CAPA assigned to user ${actionOwner}`,
    });

    res.json({ message: 'CAPA assigned successfully' });
  } catch (error) {
    console.error('Assign CAPA error:', error);
    res.status(500).json({ error: 'Failed to assign CAPA' });
  }
};

export const updateCAPAStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { status } = req.body;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    // Workflow validation
    const validTransitions: Record<CAPAStatus, CAPAStatus[]> = {
      [CAPAStatus.OPEN]: [CAPAStatus.IN_PROGRESS, CAPAStatus.CLOSED],
      [CAPAStatus.IN_PROGRESS]: [CAPAStatus.COMPLETED, CAPAStatus.OPEN],
      [CAPAStatus.COMPLETED]: [CAPAStatus.VERIFIED, CAPAStatus.IN_PROGRESS],
      [CAPAStatus.VERIFIED]: [CAPAStatus.CLOSED, CAPAStatus.IN_PROGRESS],
      [CAPAStatus.CLOSED]: [],
    };

    const currentStatus = capa.status as CAPAStatus;
    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(status as CAPAStatus)) {
      res.status(400).json({
        error: `Invalid status transition from ${currentStatus} to ${status}`,
        allowedStatuses,
      });
      return;
    }

    const updates: Partial<CAPA> = { status };
    
    // Set closedDate when transitioning to closed
    if (status === CAPAStatus.CLOSED) {
      updates.closedDate = new Date();
    }

    await CAPAModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: { status: currentStatus },
      newValues: { status },
      actionDescription: `CAPA status changed from ${currentStatus} to ${status}`,
    });

    res.json({ message: 'CAPA status updated successfully' });
  } catch (error) {
    console.error('Update CAPA status error:', error);
    res.status(500).json({ error: 'Failed to update CAPA status' });
  }
};

export const completeCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { rootCause, proposedAction } = req.body;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    if (capa.status !== CAPAStatus.IN_PROGRESS) {
      res.status(400).json({ error: 'CAPA must be in progress to be completed' });
      return;
    }

    // Verify that the user completing is the action owner
    if (capa.actionOwner !== req.user.id) {
      res.status(403).json({ error: 'Only the action owner can complete this CAPA' });
      return;
    }

    const updates = {
      rootCause,
      proposedAction,
      status: CAPAStatus.COMPLETED,
      completedDate: new Date(),
    };
    await CAPAModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: { status: capa.status },
      newValues: updates,
      actionDescription: `CAPA completed by ${req.user?.firstName} ${req.user?.lastName}`,
    });

    res.json({ message: 'CAPA completed successfully' });
  } catch (error) {
    console.error('Complete CAPA error:', error);
    res.status(500).json({ error: 'Failed to complete CAPA' });
  }
};

export const verifyCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { effectiveness } = req.body;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    if (capa.status !== CAPAStatus.COMPLETED) {
      res.status(400).json({ error: 'CAPA must be completed before verification' });
      return;
    }

    // Verify that the verifier is not the action owner (separation of duties)
    if (capa.actionOwner === req.user.id) {
      res.status(403).json({ error: 'Action owner cannot verify their own CAPA' });
      return;
    }

    const updates = {
      effectiveness,
      verifiedBy: req.user.id,
      verifiedDate: new Date(),
      status: CAPAStatus.VERIFIED,
    };
    await CAPAModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CAPA,
      entityType: 'CAPA',
      entityId: parseInt(id, 10),
      entityIdentifier: capa.capaNumber,
      oldValues: { status: capa.status },
      newValues: updates,
      actionDescription: `CAPA verified by ${req.user.firstName} ${req.user.lastName}`,
    });

    res.json({ message: 'CAPA verified successfully' });
  } catch (error) {
    console.error('Verify CAPA error:', error);
    res.status(500).json({ error: 'Failed to verify CAPA' });
  }
};

export const getCAPAsAssignedToMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const capas = await CAPAModel.findByActionOwner(req.user.id);

    res.json({ data: capas });
  } catch (error) {
    console.error('Get assigned CAPAs error:', error);
    res.status(500).json({ error: 'Failed to get assigned CAPAs' });
  }
};

export const getOverdueCAPAs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const capas = await CAPAModel.findOverdue();

    res.json({ data: capas });
  } catch (error) {
    console.error('Get overdue CAPAs error:', error);
    res.status(500).json({ error: 'Failed to get overdue CAPAs' });
  }
};

export const getCAPADashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const filters: { startDate?: Date; endDate?: Date } = {};

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const stats = await CAPAModel.getDashboardStats(filters);

    res.json(stats);
  } catch (error) {
    console.error('Get CAPA dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get CAPA dashboard statistics' });
  }
};
