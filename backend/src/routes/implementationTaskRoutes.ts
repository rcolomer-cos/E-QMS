import express from 'express';
import {
  createImplementationTask,
  getImplementationTasks,
  getImplementationTaskById,
  getTasksByImprovementIdeaId,
  updateImplementationTask,
  completeImplementationTask,
  deleteImplementationTask,
  getTaskStatistics,
} from '../controllers/implementationTaskController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  validateImplementationTask,
  validateImplementationTaskUpdate,
  validateImplementationTaskComplete,
  validateIdParam,
  validateImprovementIdeaIdParam,
} from '../utils/validators';
import { UserRole } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/implementation-tasks
 * @desc    Create a new implementation task
 * @access  Admin, Manager, User
 */
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
  validateImplementationTask,
  createImplementationTask
);

/**
 * @route   GET /api/implementation-tasks
 * @desc    Get all implementation tasks with filtering and sorting
 * @access  Authenticated
 */
router.get('/', getImplementationTasks);

/**
 * @route   GET /api/implementation-tasks/idea/:improvementIdeaId/statistics
 * @desc    Get task statistics for an improvement idea
 * @access  Authenticated
 */
router.get(
  '/idea/:improvementIdeaId/statistics',
  validateImprovementIdeaIdParam,
  getTaskStatistics
);

/**
 * @route   GET /api/implementation-tasks/idea/:improvementIdeaId
 * @desc    Get all tasks for a specific improvement idea
 * @access  Authenticated
 */
router.get(
  '/idea/:improvementIdeaId',
  validateImprovementIdeaIdParam,
  getTasksByImprovementIdeaId
);

/**
 * @route   GET /api/implementation-tasks/:id
 * @desc    Get implementation task by ID
 * @access  Authenticated
 */
router.get('/:id', validateIdParam, getImplementationTaskById);

/**
 * @route   PUT /api/implementation-tasks/:id
 * @desc    Update implementation task
 * @access  Admin, Manager, User
 */
router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
  [...validateIdParam, ...validateImplementationTaskUpdate],
  updateImplementationTask
);

/**
 * @route   POST /api/implementation-tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Admin, Manager, User
 */
router.post(
  '/:id/complete',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
  [...validateIdParam, ...validateImplementationTaskComplete],
  completeImplementationTask
);

/**
 * @route   DELETE /api/implementation-tasks/:id
 * @desc    Delete implementation task
 * @access  Admin, Manager
 */
router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateIdParam,
  deleteImplementationTask
);

export default router;
