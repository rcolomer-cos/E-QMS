import { Router } from 'express';
import {
  createCompetency,
  getCompetencies,
  getCompetencyById,
  updateCompetency,
  assignCompetencyToUser,
  getUserCompetencies,
  getUsersByCompetency,
  updateUserCompetency,
  getExpiringCompetencies,
  getTrainingMatrix,
} from '../controllers/competencyController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
  validateId, 
  validateCompetency, 
  validateCompetencyUpdate,
  validateUserCompetency,
  validateUserCompetencyUpdate,
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Competency Definition Routes

// Create Competency - Requires ADMIN or MANAGER role
router.post(
  '/',
  createLimiter,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateCompetency,
  createCompetency
);

// Get all Competencies - Accessible to all authenticated users
router.get('/', getCompetencies);

// Get Training Matrix - Accessible to all authenticated users
router.get('/training-matrix', getTrainingMatrix);

// Get Competency by ID - Accessible to all authenticated users
router.get('/:id', validateId, getCompetencyById);

// Update Competency - Requires ADMIN or MANAGER role
router.put(
  '/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateCompetencyUpdate,
  updateCompetency
);

// User Competency Mapping Routes

// Assign Competency to User - Requires ADMIN or MANAGER role
router.post(
  '/assignments',
  createLimiter,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateUserCompetency,
  assignCompetencyToUser
);

// Get User's Competencies - Users can view their own, admins/managers can view any
router.get('/users/:userId', validateId, getUserCompetencies);

// Get Expiring Competencies for a User - Users can view their own, admins/managers can view any
router.get('/users/:userId/expiring', validateId, getExpiringCompetencies);

// Get Users by Competency - Accessible to all authenticated users
router.get('/:competencyId/users', validateId, getUsersByCompetency);

// Update User Competency - Requires ADMIN or MANAGER role
router.put(
  '/assignments/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validateUserCompetencyUpdate,
  updateUserCompetency
);

export default router;
