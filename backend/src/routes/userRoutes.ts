import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  assignRole,
  removeRole,
  generatePassword,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All user management routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin, SuperUser
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin, SuperUser
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin, SuperUser
 */
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('department').optional().trim(),
    body('roleIds').optional().isArray().withMessage('Role IDs must be an array'),
    body('generatePassword').optional().isBoolean(),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin, SuperUser
 */
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('department').optional().trim(),
    body('active').optional().isBoolean(),
  ],
  updateUser
);

/**
 * @route   POST /api/users/:id/roles
 * @desc    Assign role to user
 * @access  Admin, SuperUser
 */
router.post(
  '/:id/roles',
  [body('roleId').isInt().withMessage('Valid role ID is required')],
  assignRole
);

/**
 * @route   DELETE /api/users/:id/roles
 * @desc    Remove role from user
 * @access  Admin, SuperUser
 */
router.delete(
  '/:id/roles',
  [body('roleId').isInt().withMessage('Valid role ID is required')],
  removeRole
);

/**
 * @route   GET /api/users/generate-password
 * @desc    Generate a strong memorable password
 * @access  Admin, SuperUser
 */
router.get('/generate-password', generatePassword);
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
