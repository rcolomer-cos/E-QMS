import { Router } from 'express';
import {
  createRequirement,
  getRequirements,
  getRequirementById,
  getRequiredCompetenciesForRole,
  getMissingCompetenciesForUser,
  getUsersWithMissingCompetencies,
  updateRequirement,
  deleteRequirement,
} from '../controllers/roleTrainingRequirementsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  validateId,
  validateRoleTrainingRequirement,
  validateRoleTrainingRequirementUpdate,
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create Role Training Requirement - Requires ADMIN or MANAGER role
router.post(
  '/',
  createLimiter,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER),
  validateRoleTrainingRequirement,
  createRequirement
);

// Get all Role Training Requirements - Accessible to all authenticated users
router.get('/', getRequirements);

// Get Role Training Requirement by ID - Accessible to all authenticated users
router.get('/:id', validateId, getRequirementById);

// Get Required Competencies for a specific Role - Accessible to all authenticated users
router.get('/roles/:roleId/competencies', validateId, getRequiredCompetenciesForRole);

// Get Missing Competencies for a User - Users can view their own, admins/managers can view any
router.get('/users/:userId/missing', validateId, getMissingCompetenciesForUser);

// Get Users with Missing Competencies - Requires ADMIN or MANAGER role
router.get(
  '/compliance/gaps',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER),
  getUsersWithMissingCompetencies
);

// Update Role Training Requirement - Requires ADMIN or MANAGER role
router.put(
  '/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER),
  validateRoleTrainingRequirementUpdate,
  updateRequirement
);

// Delete Role Training Requirement - Requires ADMIN role
router.delete(
  '/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  deleteRequirement
);

export default router;
