import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup,
  getGroupDocuments,
  getUserGroups,
} from '../controllers/groupController';

const router = Router();

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Admin, Superuser
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('name').notEmpty().withMessage('Group name is required').isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  ],
  createGroup
);

/**
 * @route   GET /api/groups
 * @desc    Get all groups
 * @access  Admin, Manager, Superuser
 */
router.get('/', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), getGroups);

/**
 * @route   GET /api/groups/:id
 * @desc    Get a group by ID
 * @access  Admin, Manager, Superuser
 */
router.get('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), getGroupById);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update a group
 * @access  Admin, Superuser
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('name').optional().isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  updateGroup
);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a group (soft delete)
 * @access  Superuser only
 */
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.SUPERUSER), deleteGroup);

/**
 * @route   GET /api/groups/:id/users
 * @desc    Get all users in a group
 * @access  Admin, Manager, Superuser
 */
router.get('/:id/users', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), getGroupUsers);

/**
 * @route   POST /api/groups/:id/users
 * @desc    Add users to a group
 * @access  Admin, Manager, Superuser
 */
router.post(
  '/:id/users',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER),
  [body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array')],
  addUsersToGroup
);

/**
 * @route   DELETE /api/groups/:id/users
 * @desc    Remove users from a group
 * @access  Superuser only
 */
router.delete(
  '/:id/users',
  authenticateToken,
  authorizeRoles(UserRole.SUPERUSER),
  [body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array')],
  removeUsersFromGroup
);

/**
 * @route   GET /api/groups/:id/documents
 * @desc    Get all documents assigned to a group
 * @access  Admin, Manager, Superuser
 */
router.get('/:id/documents', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), getGroupDocuments);

/**
 * @route   GET /api/groups/user/:userId
 * @desc    Get all groups for a specific user
 * @access  Admin, Manager, or authenticated users
 */
router.get('/user/:userId', authenticateToken, getUserGroups);

export default router;
