import { Router } from 'express';
import {
  createTraining,
  getTrainings,
  getTrainingById,
  updateTraining,
  getTrainingAttendees,
} from '../controllers/trainingController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateTraining, validateTrainingUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create Training - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateTraining, createTraining);

// Get all Trainings - Accessible to all authenticated users
router.get('/', getTrainings);

// Get Training by ID - Accessible to all authenticated users
router.get('/:id', validateId, getTrainingById);

// Get Training attendees - Accessible to all authenticated users
router.get('/:id/attendees', validateId, getTrainingAttendees);

// Update Training - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateTrainingUpdate, updateTraining);

export default router;
