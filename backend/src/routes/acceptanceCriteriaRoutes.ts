import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createAcceptanceCriteria,
  getAcceptanceCriteria,
  getAcceptanceCriteriaById,
  getAcceptanceCriteriaByCriteriaCode,
  getAcceptanceCriteriaByInspectionType,
  getActiveAcceptanceCriteria,
  getMandatoryCriteria,
  getSafetyRelatedCriteria,
  updateAcceptanceCriteria,
  deleteAcceptanceCriteria,
  validateMeasurement,
} from '../controllers/acceptanceCriteriaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create acceptance criteria
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    body('criteriaCode').notEmpty().withMessage('Criteria code is required'),
    body('criteriaName').notEmpty().withMessage('Criteria name is required'),
    body('inspectionType').notEmpty().withMessage('Inspection type is required'),
    body('parameterName').notEmpty().withMessage('Parameter name is required'),
    body('measurementType')
      .isIn(['quantitative', 'qualitative', 'binary', 'range', 'checklist'])
      .withMessage('Invalid measurement type'),
    body('ruleType')
      .isIn(['range', 'min', 'max', 'exact', 'tolerance', 'checklist', 'pass_fail'])
      .withMessage('Invalid rule type'),
    body('severity')
      .isIn(['critical', 'major', 'minor', 'normal'])
      .withMessage('Invalid severity'),
    body('mandatory').isBoolean().withMessage('Mandatory must be a boolean'),
    body('failureAction')
      .isIn(['fail_inspection', 'flag_for_review', 'warning_only', 'conditional_pass'])
      .withMessage('Invalid failure action'),
    body('status')
      .isIn(['active', 'inactive', 'draft', 'obsolete'])
      .withMessage('Invalid status'),
    body('effectiveDate').isISO8601().withMessage('Effective date must be a valid date'),
    body('version').notEmpty().withMessage('Version is required'),
  ],
  createAcceptanceCriteria
);

// Get all acceptance criteria with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive', 'draft', 'obsolete']).withMessage('Invalid status'),
    query('severity').optional().isIn(['critical', 'major', 'minor', 'normal']).withMessage('Invalid severity'),
    query('mandatory').optional().isBoolean().withMessage('Mandatory must be a boolean'),
    query('safetyRelated').optional().isBoolean().withMessage('Safety related must be a boolean'),
    query('regulatoryRequirement').optional().isBoolean().withMessage('Regulatory requirement must be a boolean'),
    query('measurementType')
      .optional()
      .isIn(['quantitative', 'qualitative', 'binary', 'range', 'checklist'])
      .withMessage('Invalid measurement type'),
  ],
  getAcceptanceCriteria
);

// Get active acceptance criteria
router.get('/active', getActiveAcceptanceCriteria);

// Get mandatory criteria
router.get('/mandatory', getMandatoryCriteria);

// Get safety-related criteria
router.get('/safety-related', getSafetyRelatedCriteria);

// Get acceptance criteria by inspection type
router.get(
  '/inspection-type/:inspectionType',
  [param('inspectionType').notEmpty().withMessage('Inspection type is required')],
  getAcceptanceCriteriaByInspectionType
);

// Get acceptance criteria by criteria code
router.get(
  '/code/:criteriaCode',
  [param('criteriaCode').notEmpty().withMessage('Criteria code is required')],
  getAcceptanceCriteriaByCriteriaCode
);

// Validate measurement against criteria
router.post(
  '/:id/validate',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid criteria ID'),
    body('measuredValue').exists().withMessage('Measured value is required'),
  ],
  validateMeasurement
);

// Get acceptance criteria by ID
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid criteria ID')],
  getAcceptanceCriteriaById
);

// Update acceptance criteria
router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid criteria ID'),
    body('measurementType')
      .optional()
      .isIn(['quantitative', 'qualitative', 'binary', 'range', 'checklist'])
      .withMessage('Invalid measurement type'),
    body('ruleType')
      .optional()
      .isIn(['range', 'min', 'max', 'exact', 'tolerance', 'checklist', 'pass_fail'])
      .withMessage('Invalid rule type'),
    body('severity')
      .optional()
      .isIn(['critical', 'major', 'minor', 'normal'])
      .withMessage('Invalid severity'),
    body('mandatory').optional().isBoolean().withMessage('Mandatory must be a boolean'),
    body('failureAction')
      .optional()
      .isIn(['fail_inspection', 'flag_for_review', 'warning_only', 'conditional_pass'])
      .withMessage('Invalid failure action'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'draft', 'obsolete'])
      .withMessage('Invalid status'),
    body('effectiveDate').optional().isISO8601().withMessage('Effective date must be a valid date'),
    body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  ],
  updateAcceptanceCriteria
);

// Delete acceptance criteria
router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  [param('id').isInt({ min: 1 }).withMessage('Invalid criteria ID')],
  deleteAcceptanceCriteria
);

export default router;
