import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  revokeRole,
  generatePassword,
  generateSinglePassword,
  getAllRoles,
} from '../controllers/userController';
import { validateUser, validateId } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Password generation (admin/superuser only)
router.get('/generate-password', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), generatePassword);
router.get('/generate-password-single', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), generateSinglePassword);

// Role management
router.get('/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getAllRoles);

// User CRUD operations (admin/superuser only)
router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), getAllUsers);
router.get('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, getUserById);
router.post('/', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateUser, createUser);
router.put('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, updateUser);
router.delete('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, deleteUser);

// Role assignment (admin/superuser only, but superuser restrictions apply in controller)
router.post('/:id/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, assignRole);
router.delete('/:id/roles', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, revokeRole);

export default router;
