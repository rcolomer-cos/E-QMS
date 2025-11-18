import express from 'express';
import { body } from 'express-validator';
import {
  checkInitialization,
  createFirstSuperUser,
  getSystemStatus,
  createBackup,
  listBackups,
  restoreBackup,
  verifyBackup,
  deleteBackup,
} from '../controllers/systemController';
import {
  getSystemSettings,
  getSystemSettingsByCategory,
  getSystemSettingByKey,
  updateSystemSetting,
  batchUpdateSystemSettings,
} from '../controllers/systemSettingsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @route   GET /api/system/init-status
 * @desc    Check if system needs initialization
 * @access  Public
 */
router.get('/init-status', checkInitialization);

/**
 * @route   POST /api/system/init
 * @desc    Create first superuser (only works if no superuser exists)
 * @access  Public (but fails if superuser already exists)
 */
router.post(
  '/init',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
  ],
  createFirstSuperUser
);

/**
 * @route   GET /api/system/status
 * @desc    Get system status and health
 * @access  Public
 */
router.get('/status', getSystemStatus);

/**
 * @route   POST /api/system/backup
 * @desc    Create a database backup
 * @access  Private (Admin only)
 */
router.post('/backup', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), createBackup);

/**
 * @route   GET /api/system/backups
 * @desc    List available backup files
 * @access  Private (Admin only)
 */
router.get('/backups', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), listBackups);

/**
 * @route   POST /api/system/backup/restore
 * @desc    Restore database from backup
 * @access  Private (Admin only)
 */
router.post(
  '/backup/restore',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('backupFile').trim().notEmpty().withMessage('Backup file path is required'),
    body('replaceExisting').optional().isBoolean().withMessage('Replace existing must be a boolean'),
  ],
  restoreBackup
);

/**
 * @route   POST /api/system/backup/verify
 * @desc    Verify a backup file
 * @access  Private (Admin only)
 */
router.post(
  '/backup/verify',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [body('backupFile').trim().notEmpty().withMessage('Backup file path is required')],
  verifyBackup
);

/**
 * @route   DELETE /api/system/backup
 * @desc    Delete a backup file
 * @access  Private (Admin only)
 */
router.delete(
  '/backup',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [body('fileName').trim().notEmpty().withMessage('File name is required')],
  deleteBackup
);

/**
 * @route   GET /api/system/settings
 * @desc    Get all system settings (optionally filtered by category)
 * @access  Private (Admin only)
 */
router.get('/settings', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getSystemSettings);

/**
 * @route   GET /api/system/settings/by-category
 * @desc    Get system settings grouped by category
 * @access  Private (Admin only)
 */
router.get('/settings/by-category', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getSystemSettingsByCategory);

/**
 * @route   GET /api/system/settings/:key
 * @desc    Get a specific setting by key
 * @access  Private (Admin only)
 */
router.get('/settings/:key', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getSystemSettingByKey);

/**
 * @route   PUT /api/system/settings/:key
 * @desc    Update a system setting
 * @access  Private (Admin only)
 */
router.put(
  '/settings/:key',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [body('value').notEmpty().withMessage('Value is required')],
  updateSystemSetting
);

/**
 * @route   POST /api/system/settings/batch
 * @desc    Batch update multiple settings
 * @access  Private (Admin only)
 */
router.post(
  '/settings/batch',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('settings').isArray().withMessage('Settings must be an array'),
    body('settings.*.key').trim().notEmpty().withMessage('Each setting must have a key'),
    body('settings.*.value').notEmpty().withMessage('Each setting must have a value'),
  ],
  batchUpdateSystemSettings
);

export default router;
