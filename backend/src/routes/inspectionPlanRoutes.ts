import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import {
  createInspectionPlan,
  getInspectionPlans,
  getInspectionPlanById,
  getInspectionPlanByPlanNumber,
  updateInspectionPlan,
  deleteInspectionPlan,
  getUpcomingInspections,
  getOverdueInspections,
  getInspectionsByInspector,
  getInspectionTypes,
} from '../controllers/inspectionPlanController';

const router = Router();

// Validation rules
const createValidation = [
  body('planNumber').notEmpty().withMessage('Plan number is required'),
  body('planName').notEmpty().withMessage('Plan name is required'),
  body('equipmentId').isInt({ min: 1 }).withMessage('Valid equipment ID is required'),
  body('inspectionType').notEmpty().withMessage('Inspection type is required'),
  body('priority').isIn(['low', 'normal', 'high', 'critical']).withMessage('Valid priority is required'),
  body('planType').isIn(['recurring', 'one_time']).withMessage('Valid plan type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('nextDueDate').isISO8601().withMessage('Valid next due date is required'),
  body('responsibleInspectorId').isInt({ min: 1 }).withMessage('Valid responsible inspector ID is required'),
  body('status').optional().isIn(['active', 'inactive', 'on_hold', 'completed', 'cancelled']),
];

const updateValidation = [
  body('planNumber').optional().notEmpty().withMessage('Plan number cannot be empty'),
  body('planName').optional().notEmpty().withMessage('Plan name cannot be empty'),
  body('equipmentId').optional().isInt({ min: 1 }).withMessage('Valid equipment ID is required'),
  body('inspectionType').optional().notEmpty().withMessage('Inspection type cannot be empty'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']),
  body('planType').optional().isIn(['recurring', 'one_time']),
  body('status').optional().isIn(['active', 'inactive', 'on_hold', 'completed', 'cancelled']),
];

// Create inspection plan (Admin, Manager)
router.post(
  '/',
  authenticate,
  authorize(['Admin', 'Manager']),
  createValidation,
  createInspectionPlan
);

// Get all inspection plans with filters
router.get('/', authenticate, getInspectionPlans);

// Get inspection types
router.get('/types', authenticate, getInspectionTypes);

// Get upcoming inspections
router.get('/upcoming', authenticate, getUpcomingInspections);

// Get overdue inspections
router.get('/overdue', authenticate, getOverdueInspections);

// Get inspections by inspector
router.get('/inspector/:inspectorId', authenticate, getInspectionsByInspector);

// Get inspection plan by plan number
router.get('/plan-number/:planNumber', authenticate, getInspectionPlanByPlanNumber);

// Get inspection plan by ID
router.get('/:id', authenticate, getInspectionPlanById);

// Update inspection plan (Admin, Manager)
router.put(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  updateValidation,
  updateInspectionPlan
);

// Delete inspection plan (Admin only)
router.delete('/:id', authenticate, authorize(['Admin']), deleteInspectionPlan);

export default router;
