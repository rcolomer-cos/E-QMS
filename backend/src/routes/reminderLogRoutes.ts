import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getReminderLogs,
  getReminderLogById,
  getLatestLog,
  getReminderStatistics,
  triggerReminders,
  getSchedulerStatus,
  cleanupOldLogs,
} from '../controllers/reminderLogController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/reminder-logs
 * @desc    Get all reminder logs with pagination and filtering
 * @access  Admin, Manager
 */
router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), getReminderLogs);

/**
 * @route   GET /api/reminder-logs/statistics
 * @desc    Get reminder execution statistics
 * @access  Admin, Manager
 */
router.get('/statistics', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), getReminderStatistics);

/**
 * @route   GET /api/reminder-logs/scheduler/status
 * @desc    Get scheduler status
 * @access  Admin
 */
router.get('/scheduler/status', authorizeRoles(UserRole.ADMIN), getSchedulerStatus);

/**
 * @route   POST /api/reminder-logs/trigger
 * @desc    Manually trigger reminder tasks
 * @access  Admin
 */
router.post('/trigger', authorizeRoles(UserRole.ADMIN), triggerReminders);

/**
 * @route   DELETE /api/reminder-logs/cleanup
 * @desc    Delete old reminder logs
 * @access  Admin
 */
router.delete('/cleanup', authorizeRoles(UserRole.ADMIN), cleanupOldLogs);

/**
 * @route   GET /api/reminder-logs/latest/:type
 * @desc    Get latest log for a specific reminder type
 * @access  Admin, Manager
 */
router.get('/latest/:type', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), getLatestLog);

/**
 * @route   GET /api/reminder-logs/:id
 * @desc    Get a specific reminder log by ID
 * @access  Admin, Manager
 */
router.get('/:id', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), getReminderLogById);

export default router;
