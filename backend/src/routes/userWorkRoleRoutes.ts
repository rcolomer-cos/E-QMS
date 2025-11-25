import { Router } from 'express';
import {
  assignWorkRole,
  getUserWorkRoles,
  getWorkRoleUsers,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  hardDeleteAssignment,
  getStatistics,
} from '../controllers/userWorkRoleController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get statistics - Accessible to MANAGER and SUPERUSER
router.get(
  '/statistics',
  authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER),
  getStatistics
);

// Get all assignments with filters - Accessible to MANAGER and SUPERUSER
router.get(
  '/',
  authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER),
  getAllAssignments
);

// Get user's work roles - Users can view their own, MANAGER/SUPERUSER can view any
router.get('/user/:userId', validateId, getUserWorkRoles);

// Get users assigned to a work role - Accessible to all authenticated users
router.get('/work-role/:workRoleId', validateId, getWorkRoleUsers);

// Get single assignment by ID - Users can view their own, MANAGER/SUPERUSER can view any
router.get('/:id', validateId, getAssignmentById);

// Assign work role to user - Requires MANAGER or SUPERUSER role
router.post(
  '/',
  createLimiter,
  authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER),
  assignWorkRole
);

// Update assignment - Requires MANAGER or SUPERUSER role
router.put(
  '/:id',
  validateId,
  authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER),
  updateAssignment
);

// Soft delete (deactivate) assignment - Requires MANAGER or SUPERUSER role
router.delete(
  '/:id',
  validateId,
  authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER),
  deleteAssignment
);

// Hard delete assignment - Requires SUPERUSER role only
router.delete(
  '/:id/permanent',
  validateId,
  authorizeRoles(UserRole.SUPERUSER),
  hardDeleteAssignment
);

export default router;
