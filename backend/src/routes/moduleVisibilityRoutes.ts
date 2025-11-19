import express from 'express';
import { body } from 'express-validator';
import {
  getAllModules,
  getEnabledModules,
  getModuleByKey,
  updateModuleVisibility,
  batchUpdateModules,
} from '../controllers/moduleVisibilityController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @route   GET /api/modules
 * @desc    Get all module visibility settings (Admin only)
 * @access  Private (Admin/Superuser only)
 */
router.get('/', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getAllModules);

/**
 * @route   GET /api/modules/enabled
 * @desc    Get enabled modules (admins get all, others get enabled only)
 * @access  Private
 */
router.get('/enabled', authenticateToken, getEnabledModules);

/**
 * @route   GET /api/modules/:key
 * @desc    Get a specific module by key
 * @access  Private (Admin/Superuser only)
 */
router.get('/:key', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getModuleByKey);

/**
 * @route   PUT /api/modules/:key
 * @desc    Update module visibility
 * @access  Private (Admin/Superuser only)
 */
router.put(
  '/:key',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [body('isEnabled').isBoolean().withMessage('isEnabled must be a boolean')],
  updateModuleVisibility
);

/**
 * @route   POST /api/modules/batch
 * @desc    Batch update module visibility
 * @access  Private (Admin/Superuser only)
 */
router.post(
  '/batch',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('modules').isArray().withMessage('Modules must be an array'),
    body('modules.*.key').trim().notEmpty().withMessage('Each module must have a key'),
    body('modules.*.isEnabled').isBoolean().withMessage('Each module must have an isEnabled boolean'),
  ],
  batchUpdateModules
);

export default router;
