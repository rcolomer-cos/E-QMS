import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import * as webhookController from '../controllers/webhookController';

const router = express.Router();

// Validation middleware
const validateWebhookSubscription = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 200 }).withMessage('Name must not exceed 200 characters'),
  body('url')
    .notEmpty().withMessage('URL is required')
    .isURL().withMessage('Invalid URL format')
    .isLength({ max: 2000 }).withMessage('URL must not exceed 2000 characters'),
  body('events')
    .notEmpty().withMessage('Events are required')
    .custom((value) => {
      const events = Array.isArray(value) ? value : [value];
      const validEvents = [
        'ncr.created',
        'ncr.updated',
        'ncr.closed',
        'capa.created',
        'capa.updated',
        'capa.closed',
      ];
      
      const invalidEvents = events.filter((event: string) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
      }
      
      return true;
    }),
  body('retryEnabled').optional().isBoolean().withMessage('retryEnabled must be a boolean'),
  body('maxRetries')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('maxRetries must be between 0 and 10'),
  body('retryDelaySeconds')
    .optional()
    .isInt({ min: 10, max: 3600 }).withMessage('retryDelaySeconds must be between 10 and 3600'),
  body('customHeaders')
    .optional()
    .isObject().withMessage('customHeaders must be an object'),
];

const validateWebhookUpdate = [
  body('name')
    .optional()
    .isLength({ max: 200 }).withMessage('Name must not exceed 200 characters'),
  body('url')
    .optional()
    .isURL().withMessage('Invalid URL format')
    .isLength({ max: 2000 }).withMessage('URL must not exceed 2000 characters'),
  body('events')
    .optional()
    .custom((value) => {
      const events = Array.isArray(value) ? value : [value];
      const validEvents = [
        'ncr.created',
        'ncr.updated',
        'ncr.closed',
        'capa.created',
        'capa.updated',
        'capa.closed',
      ];
      
      const invalidEvents = events.filter((event: string) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
      }
      
      return true;
    }),
  body('active').optional().isBoolean().withMessage('active must be a boolean'),
  body('retryEnabled').optional().isBoolean().withMessage('retryEnabled must be a boolean'),
  body('maxRetries')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('maxRetries must be between 0 and 10'),
  body('retryDelaySeconds')
    .optional()
    .isInt({ min: 10, max: 3600 }).withMessage('retryDelaySeconds must be between 10 and 3600'),
  body('customHeaders')
    .optional()
    .isObject().withMessage('customHeaders must be an object'),
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid subscription ID'),
];

const validateDeliveryId = [
  param('deliveryId').isInt({ min: 1 }).withMessage('Invalid delivery ID'),
];

// Routes - All routes require authentication and admin/manager role

// Create webhook subscription (admin/manager only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateWebhookSubscription,
  webhookController.createWebhookSubscription
);

// Get all webhook subscriptions (admin/manager only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  webhookController.getWebhookSubscriptions
);

// Get webhook subscription by ID (admin/manager only)
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  webhookController.getWebhookSubscriptionById
);

// Update webhook subscription (admin/manager only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  validateWebhookUpdate,
  webhookController.updateWebhookSubscription
);

// Delete webhook subscription (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  validateId,
  webhookController.deleteWebhookSubscription
);

// Regenerate webhook secret (admin/manager only)
router.post(
  '/:id/regenerate-secret',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  webhookController.regenerateWebhookSecret
);

// Test webhook subscription (admin/manager only)
router.post(
  '/:id/test',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  webhookController.testWebhookSubscription
);

// Get webhook deliveries for a subscription (admin/manager only)
router.get(
  '/:id/deliveries',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  webhookController.getWebhookDeliveries
);

// Get webhook statistics for a subscription (admin/manager only)
router.get(
  '/:id/statistics',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateId,
  webhookController.getWebhookStatistics
);

// Retry failed webhook delivery (admin/manager only)
router.post(
  '/deliveries/:deliveryId/retry',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateDeliveryId,
  webhookController.retryWebhookDelivery
);

export default router;
