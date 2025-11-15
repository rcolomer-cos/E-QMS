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

export default router;
