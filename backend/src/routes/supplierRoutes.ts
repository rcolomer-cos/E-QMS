import { Router } from 'express';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  getSupplierByNumber,
  updateSupplier,
  updateSupplierApprovalStatus,
  deactivateSupplier,
  reactivateSupplier,
  getCategories,
  getSupplierTypes,
  getIndustries,
  exportSuppliers,
} from '../controllers/supplierController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get metadata endpoints - Accessible to all authenticated users
router.get('/categories', getCategories);
router.get('/types', getSupplierTypes);
router.get('/industries', getIndustries);

// Export suppliers - Accessible to all authenticated users
router.get('/export', exportSuppliers);

// Create supplier - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), createSupplier);

// Get all suppliers - Accessible to all authenticated users
router.get('/', getSuppliers);

// Get supplier by supplier number - Accessible to all authenticated users
router.get('/number/:supplierNumber', getSupplierByNumber);

// Get supplier by ID - Accessible to all authenticated users
router.get('/:id', validateId, getSupplierById);

// Update supplier approval status - ADMIN and MANAGER only
router.put(
  '/:id/approval-status',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  updateSupplierApprovalStatus
);

// Reactivate supplier - ADMIN, MANAGER, SUPERUSER
router.put('/:id/reactivate', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), reactivateSupplier);

// Update supplier - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), updateSupplier);

// Deactivate supplier - Requires ADMIN, MANAGER, or SUPERUSER role
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), deactivateSupplier);

export default router;
