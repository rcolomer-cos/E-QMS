import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import * as auditorAccessTokenController from '../controllers/auditorAccessTokenController';

const router = Router();

/**
 * @route   POST /api/auditor-access-tokens
 * @desc    Generate a new auditor access token
 * @access  Admin, Manager
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    body('auditorName')
      .trim()
      .notEmpty()
      .withMessage('Auditor name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Auditor name must be between 2 and 255 characters'),
    body('auditorEmail')
      .trim()
      .notEmpty()
      .withMessage('Auditor email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('auditorOrganization')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Auditor organization must be less than 255 characters'),
    body('expiresAt')
      .notEmpty()
      .withMessage('Expiration date is required')
      .isISO8601()
      .withMessage('Valid ISO 8601 date is required'),
    body('maxUses')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max uses must be a positive integer'),
    body('scopeType')
      .notEmpty()
      .withMessage('Scope type is required')
      .isIn(['full_read_only', 'specific_audit', 'specific_document', 'specific_ncr', 'specific_capa'])
      .withMessage('Invalid scope type'),
    body('scopeEntityId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Scope entity ID must be a positive integer'),
    body('allowedResources')
      .optional()
      .isArray()
      .withMessage('Allowed resources must be an array'),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('Purpose is required')
      .isLength({ min: 5, max: 500 })
      .withMessage('Purpose must be between 5 and 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be less than 2000 characters'),
  ],
  auditorAccessTokenController.generateToken
);

/**
 * @route   GET /api/auditor-access-tokens
 * @desc    Get all auditor access tokens
 * @access  Admin, Manager, Auditor
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  auditorAccessTokenController.getTokens
);

/**
 * @route   GET /api/auditor-access-tokens/options
 * @desc    Get available options for token generation
 * @access  Admin, Manager
 */
router.get(
  '/options',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  auditorAccessTokenController.getOptions
);

/**
 * @route   GET /api/auditor-access-tokens/:id
 * @desc    Get a specific auditor access token by ID
 * @access  Admin, Manager, Auditor
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  auditorAccessTokenController.getTokenById
);

/**
 * @route   PUT /api/auditor-access-tokens/:id/revoke
 * @desc    Revoke an auditor access token
 * @access  Admin, Manager
 */
router.put(
  '/:id/revoke',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Revocation reason is required')
      .isLength({ min: 5, max: 500 })
      .withMessage('Revocation reason must be between 5 and 500 characters'),
  ],
  auditorAccessTokenController.revokeToken
);

/**
 * @route   POST /api/auditor-access-tokens/cleanup
 * @desc    Cleanup expired tokens
 * @access  Admin
 */
router.post(
  '/cleanup',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  auditorAccessTokenController.cleanupExpiredTokens
);

export default router;
