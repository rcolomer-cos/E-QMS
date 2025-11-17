import { Router } from 'express';
import {
  createSupplierEvaluation,
  getSupplierEvaluations,
  getSupplierEvaluationById,
  getEvaluationsBySupplier,
  updateSupplierEvaluation,
  updateSupplierEvaluationStatus,
  deleteSupplierEvaluation,
  getSupplierEvaluationStatistics,
} from '../controllers/supplierEvaluationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  validateId,
  validateSupplierEvaluation,
  validateSupplierEvaluationUpdate,
  validateSupplierEvaluationStatus,
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get supplier evaluation statistics - Accessible to all authenticated users
router.get('/statistics', getSupplierEvaluationStatistics);

// Create supplier evaluation - Requires ADMIN, MANAGER, or AUDITOR role
router.post(
  '/',
  createLimiter,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  validateSupplierEvaluation,
  createSupplierEvaluation
);

// Get all supplier evaluations - Accessible to all authenticated users
router.get('/', getSupplierEvaluations);

// Get evaluations by supplier ID - Accessible to all authenticated users
router.get('/supplier/:supplierId', validateId, getEvaluationsBySupplier);

// Get supplier evaluation by ID - Accessible to all authenticated users
router.get('/:id', validateId, getSupplierEvaluationById);

// Update supplier evaluation status - ADMIN and MANAGER can approve; ADMIN, MANAGER, and AUDITOR can change other statuses
router.put(
  '/:id/status',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  validateSupplierEvaluationStatus,
  updateSupplierEvaluationStatus
);

// Update supplier evaluation - Requires ADMIN, MANAGER, or AUDITOR role
router.put(
  '/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  validateSupplierEvaluationUpdate,
  updateSupplierEvaluation
);

// Delete supplier evaluation - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteSupplierEvaluation);

export default router;
