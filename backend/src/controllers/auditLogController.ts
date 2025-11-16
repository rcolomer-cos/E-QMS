import { Response } from 'express';
import { AuditLogModel, AuditLogFilters } from '../models/AuditLogModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

/**
 * Get all audit logs with filters
 * Admin/Manager only
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      userId,
      action,
      actionCategory,
      entityType,
      entityId,
      success,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
    } = req.query;

    const filters: AuditLogFilters = {
      userId: userId ? parseInt(userId as string, 10) : undefined,
      action: action as string | undefined,
      actionCategory: actionCategory as string | undefined,
      entityType: entityType as string | undefined,
      entityId: entityId ? parseInt(entityId as string, 10) : undefined,
      success: success !== undefined ? success === 'true' : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    const logs = await AuditLogModel.findAll(filters);

    res.json({
      data: logs,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: logs.length,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

/**
 * Get audit log by ID
 * Admin/Manager only
 */
export const getAuditLogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await AuditLogModel.findById(parseInt(id, 10));
    if (!log) {
      res.status(404).json({ error: 'Audit log not found' });
      return;
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
};

/**
 * Get audit trail for a specific entity
 * Admin/Manager only
 */
export const getEntityAuditTrail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { entityType, entityId } = req.params;
    const { limit = '50' } = req.query;

    const trail = await AuditLogModel.getEntityAuditTrail(
      entityType,
      parseInt(entityId, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      entityType,
      entityId: parseInt(entityId, 10),
      auditTrail: trail,
    });
  } catch (error) {
    console.error('Get entity audit trail error:', error);
    res.status(500).json({ error: 'Failed to get entity audit trail' });
  }
};

/**
 * Get user activity logs
 * Admin/Manager can view any user, users can view their own
 */
export const getUserActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { userId } = req.params;
    const targetUserId = parseInt(userId, 10);
    const { startDate, endDate, limit = '100' } = req.query;

    // Check permissions: users can only view their own activity unless admin/manager
    const isAdminOrManager = req.user.roles.some(
      (role) => role === 'admin' || role === 'manager' || role === 'superuser'
    );

    if (!isAdminOrManager && targetUserId !== req.user.id) {
      res.status(403).json({ error: 'You can only view your own activity logs' });
      return;
    }

    const activity = await AuditLogModel.getUserActivity(
      targetUserId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      parseInt(limit as string, 10)
    );

    res.json({
      userId: targetUserId,
      activity,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
};

/**
 * Get failed actions for security monitoring
 * Admin/Superuser only
 */
export const getFailedActions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit = '100' } = req.query;

    const failedActions = await AuditLogModel.getFailedActions(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      parseInt(limit as string, 10)
    );

    res.json({
      failedActions,
      count: failedActions.length,
    });
  } catch (error) {
    console.error('Get failed actions error:', error);
    res.status(500).json({ error: 'Failed to get failed actions' });
  }
};

/**
 * Get audit statistics
 * Admin/Manager only
 */
export const getAuditStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const statistics = await AuditLogModel.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      statistics,
    });
  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({ error: 'Failed to get audit statistics' });
  }
};
