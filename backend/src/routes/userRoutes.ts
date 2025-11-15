import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  changePassword,
} from '../controllers/userController';
import {
  validateId,
  validateUserUpdate,
  validateRoleUpdate,
  validatePasswordChange,
} from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (Admin only)
router.get('/', authorizeRoles(UserRole.ADMIN), getUsers);

// Get user by ID (Admin or self)
router.get('/:id', validateId, getUserById);

// Update user (Admin or self, with restrictions)
router.put('/:id', validateId, validateUserUpdate, updateUser);

// Delete (deactivate) user (Admin only)
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteUser);

// Update user role (Admin only)
router.put('/:id/role', validateId, validateRoleUpdate, authorizeRoles(UserRole.ADMIN), updateUserRole);

// Change password (Admin or self)
router.put('/:id/password', validateId, validatePasswordChange, changePassword);

export default router;
