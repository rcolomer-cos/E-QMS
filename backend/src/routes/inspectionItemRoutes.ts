import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  createInspectionItem,
  getInspectionItems,
  getInspectionItemById,
  getInspectionItemsByRecordId,
  getFailedItems,
  getMandatoryFailedItems,
  getInspectionStatistics,
  updateInspectionItem,
  deleteInspectionItem,
  scoreInspectionItem,
  scoreMultipleItems,
  calculateInspectionStatus,
  updateInspectionStatus,
  createItemsFromCriteria,
  overrideItemScore,
} from '../controllers/inspectionItemController';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create inspection item
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    body('inspectionRecordId').isInt({ min: 1 }).withMessage('Valid inspection record ID is required'),
    body('acceptanceCriteriaId').isInt({ min: 1 }).withMessage('Valid acceptance criteria ID is required'),
    body('passed').isBoolean().withMessage('Passed must be a boolean'),
    body('autoScored').isBoolean().withMessage('Auto scored must be a boolean'),
    body('status').isIn(['pending', 'completed', 'skipped', 'not_applicable']).withMessage('Invalid status'),
  ],
  createInspectionItem
);

// Get all inspection items with filters
router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), getInspectionItems);

// Get inspection items by inspection record ID
router.get(
  '/record/:inspectionRecordId',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  getInspectionItemsByRecordId
);

// Get failed items for an inspection record
router.get(
  '/record/:inspectionRecordId/failed',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  getFailedItems
);

// Get mandatory failed items for an inspection record
router.get(
  '/record/:inspectionRecordId/mandatory-failed',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  getMandatoryFailedItems
);

// Get inspection statistics
router.get(
  '/record/:inspectionRecordId/statistics',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  getInspectionStatistics
);

// Calculate overall inspection status (read-only calculation)
router.get(
  '/record/:inspectionRecordId/calculate-status',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  calculateInspectionStatus
);

// Update inspection record status based on items (writes to inspection record)
router.post(
  '/record/:inspectionRecordId/update-status',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  updateInspectionStatus
);

// Create inspection items from acceptance criteria
router.post(
  '/record/:inspectionRecordId/create-from-criteria',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [body('inspectionType').notEmpty().withMessage('Inspection type is required')],
  createItemsFromCriteria
);

// Score a single inspection item
router.post(
  '/:id/score',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [body('measuredValue').notEmpty().withMessage('Measured value is required')],
  scoreInspectionItem
);

// Score multiple inspection items at once
router.post(
  '/score-multiple',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [body('items').isArray({ min: 1 }).withMessage('Items array is required')],
  scoreMultipleItems
);

// Override an item's score
router.post(
  '/:id/override',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    body('passed').isBoolean().withMessage('Passed must be a boolean'),
    body('overrideReason').notEmpty().withMessage('Override reason is required'),
  ],
  overrideItemScore
);

// Get inspection item by ID
router.get('/:id', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), getInspectionItemById);

// Update inspection item
router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [body('status').optional().isIn(['pending', 'completed', 'skipped', 'not_applicable']).withMessage('Invalid status')],
  updateInspectionItem
);

// Delete inspection item
router.delete('/:id', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), deleteInspectionItem);

export default router;
