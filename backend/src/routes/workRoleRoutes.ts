import { Router } from 'express';
import {
  createWorkRole,
  getWorkRoles,
  getWorkRoleById,
  updateWorkRole,
  deleteWorkRole,
  getCategories,
  getLevels,
  getWorkRolesByDepartment,
  getStatistics,
} from '../controllers/workRoleController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get metadata endpoints - Accessible to all authenticated users
router.get('/categories', getCategories);
router.get('/levels', getLevels);

// Get statistics - Accessible to MANAGER and SUPERUSER
router.get('/statistics', authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER), getStatistics);

// Get work roles by department - Accessible to all authenticated users
router.get('/department/:departmentId', validateId, getWorkRolesByDepartment);

// Get all work roles - Accessible to all authenticated users
router.get('/', getWorkRoles);

// Get work role by ID - Accessible to all authenticated users
router.get('/:id', validateId, getWorkRoleById);

// Create work role - Requires MANAGER or SUPERUSER role only
router.post('/', createLimiter, authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER), createWorkRole);

// Update work role - Requires MANAGER or SUPERUSER role only
router.put('/:id', validateId, authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER), updateWorkRole);

// Delete work role - Requires MANAGER or SUPERUSER role only
router.delete('/:id', validateId, authorizeRoles(UserRole.MANAGER, UserRole.SUPERUSER), deleteWorkRole);

export default router;
