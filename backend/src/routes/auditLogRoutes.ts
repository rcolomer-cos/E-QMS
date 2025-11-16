import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditTrail,
  getUserActivity,
  getFailedActions,
  getAuditStatistics,
} from '../controllers/auditLogController';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with optional filters
 * @access  Admin, Manager
 * @query   userId, action, actionCategory, entityType, entityId, success, startDate, endDate, limit, offset
 */
router.get('/', getAuditLogs);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get a specific audit log by ID
 * @access  Admin, Manager
 */
router.get('/:id', getAuditLogById);

/**
 * @route   GET /api/audit-logs/entity/:entityType/:entityId
 * @desc    Get audit trail for a specific entity
 * @access  Admin, Manager
 */
router.get(
  '/entity/:entityType/:entityId',
  [
    param('entityType').notEmpty().withMessage('Entity type is required'),
    param('entityId').isInt().withMessage('Entity ID must be an integer'),
  ],
  getEntityAuditTrail
);

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get activity logs for a specific user
 * @access  Admin, Manager (or user viewing their own logs)
 */
router.get('/user/:userId', getUserActivity);

/**
 * @route   GET /api/audit-logs/security/failed-actions
 * @desc    Get failed actions for security monitoring
 * @access  Admin, Superuser
 */
router.get('/security/failed-actions', getFailedActions);

/**
 * @route   GET /api/audit-logs/statistics/summary
 * @desc    Get audit statistics summary
 * @access  Admin, Manager
 */
router.get('/statistics/summary', getAuditStatistics);

export default router;
