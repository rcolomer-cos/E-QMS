import { Router } from 'express';
import {
  createApiKey,
  getAllApiKeys,
  getApiKeyById,
  revokeApiKey,
  deleteApiKey,
  updateApiKey,
} from '../controllers/apiKeyController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication and admin/superuser role
router.use(authenticateToken);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER));

// Validation middleware
const validateApiKey = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date format'),
  body('scopes')
    .optional()
    .isArray()
    .withMessage('Scopes must be an array'),
  body('allowedIPs')
    .optional()
    .isArray()
    .withMessage('Allowed IPs must be an array'),
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
];

// Routes
router.post('/', validateApiKey, createApiKey);
router.get('/', getAllApiKeys);
router.get('/:id', validateId, getApiKeyById);
router.put('/:id', [...validateId, ...validateApiKey], updateApiKey);
router.post('/:id/revoke', validateId, revokeApiKey);
router.delete('/:id', validateId, deleteApiKey);

export default router;
