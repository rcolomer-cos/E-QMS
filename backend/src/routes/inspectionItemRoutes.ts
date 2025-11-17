import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
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
router.use(authenticate);

// Create inspection item
router.post(
  '/',
  authorize(['admin', 'quality_manager', 'inspector']),
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
router.get('/', authorize(['admin', 'quality_manager', 'inspector', 'auditor']), getInspectionItems);

// Get inspection items by inspection record ID
router.get(
  '/record/:inspectionRecordId',
  authorize(['admin', 'quality_manager', 'inspector', 'auditor']),
  getInspectionItemsByRecordId
);

// Get failed items for an inspection record
router.get(
  '/record/:inspectionRecordId/failed',
  authorize(['admin', 'quality_manager', 'inspector', 'auditor']),
  getFailedItems
);

// Get mandatory failed items for an inspection record
router.get(
  '/record/:inspectionRecordId/mandatory-failed',
  authorize(['admin', 'quality_manager', 'inspector', 'auditor']),
  getMandatoryFailedItems
);

// Get inspection statistics
router.get(
  '/record/:inspectionRecordId/statistics',
  authorize(['admin', 'quality_manager', 'inspector', 'auditor']),
  getInspectionStatistics
);

// Calculate overall inspection status (read-only calculation)
router.get(
  '/record/:inspectionRecordId/calculate-status',
  authorize(['admin', 'quality_manager', 'inspector', 'auditor']),
  calculateInspectionStatus
);

// Update inspection record status based on items (writes to inspection record)
router.post(
  '/record/:inspectionRecordId/update-status',
  authorize(['admin', 'quality_manager', 'inspector']),
  updateInspectionStatus
);

// Create inspection items from acceptance criteria
router.post(
  '/record/:inspectionRecordId/create-from-criteria',
  authorize(['admin', 'quality_manager', 'inspector']),
  [body('inspectionType').notEmpty().withMessage('Inspection type is required')],
  createItemsFromCriteria
);

// Score a single inspection item
router.post(
  '/:id/score',
  authorize(['admin', 'quality_manager', 'inspector']),
  [body('measuredValue').notEmpty().withMessage('Measured value is required')],
  scoreInspectionItem
);

// Score multiple inspection items at once
router.post(
  '/score-multiple',
  authorize(['admin', 'quality_manager', 'inspector']),
  [body('items').isArray({ min: 1 }).withMessage('Items array is required')],
  scoreMultipleItems
);

// Override an item's score
router.post(
  '/:id/override',
  authorize(['admin', 'quality_manager']),
  [
    body('passed').isBoolean().withMessage('Passed must be a boolean'),
    body('overrideReason').notEmpty().withMessage('Override reason is required'),
  ],
  overrideItemScore
);

// Get inspection item by ID
router.get('/:id', authorize(['admin', 'quality_manager', 'inspector', 'auditor']), getInspectionItemById);

// Update inspection item
router.put(
  '/:id',
  authorize(['admin', 'quality_manager', 'inspector']),
  [body('status').optional().isIn(['pending', 'completed', 'skipped', 'not_applicable']).withMessage('Invalid status')],
  updateInspectionItem
);

// Delete inspection item
router.delete('/:id', authorize(['admin', 'quality_manager']), deleteInspectionItem);

export default router;
