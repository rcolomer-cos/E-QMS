import { Router } from 'express';
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  getTagUsage,
} from '../controllers/tagController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { flexibleAuth } from '../middleware/flexibleAuth';
import { enforceReadOnly, checkResourceScope, logAuditorAccess } from '../middleware/auditorAccessToken';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';
import { body } from 'express-validator';

const router = Router();

// Validation rules for tag creation and update
const validateTagCreation = [
  body('name')
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  body('backgroundColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Background color must be a valid hex color code (#RRGGBB)'),
  body('fontColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Font color must be a valid hex color code (#RRGGBB)'),
];

const validateTagUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Tag name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  body('backgroundColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Background color must be a valid hex color code (#RRGGBB)'),
  body('fontColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Font color must be a valid hex color code (#RRGGBB)'),
];

// Get all tags - all authenticated users can view
router.get('/', flexibleAuth, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), getTags);

// Get tag usage statistics - all authenticated users can view
router.get('/usage', flexibleAuth, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), getTagUsage);

// Get tag by ID - all authenticated users can view
router.get('/:id', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), getTagById);

// Create tag - ADMIN, MANAGER, SUPERUSER
router.post('/', authenticateToken, createLimiter, validateTagCreation, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), createTag);

// Update tag - ADMIN, MANAGER, SUPERUSER
router.put('/:id', authenticateToken, validateId, validateTagUpdate, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), updateTag);

// Delete tag - ADMIN, MANAGER, SUPERUSER
router.delete('/:id', authenticateToken, validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), deleteTag);

export default router;
