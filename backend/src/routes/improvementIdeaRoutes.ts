import { Router } from 'express';
import {
  createImprovementIdea,
  getImprovementIdeas,
  getImprovementIdeaById,
  updateImprovementIdea,
  updateImprovementIdeaStatus,
  deleteImprovementIdea,
  getImprovementIdeaStatistics,
} from '../controllers/improvementIdeaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
  validateId, 
  validateImprovementIdea, 
  validateImprovementIdeaUpdate, 
  validateImprovementIdeaStatus 
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get improvement idea statistics - Accessible to all authenticated users
router.get('/statistics', getImprovementIdeaStatistics);

// Create improvement idea - Accessible to all authenticated users
router.post('/', createLimiter, validateImprovementIdea, createImprovementIdea);

// Get all improvement ideas - Accessible to all authenticated users
router.get('/', getImprovementIdeas);

// Get improvement idea by ID - Accessible to all authenticated users
router.get('/:id', validateId, getImprovementIdeaById);

// Update improvement idea status - Requires ADMIN or MANAGER role
router.put('/:id/status', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateImprovementIdeaStatus, updateImprovementIdeaStatus);

// Update improvement idea - Users can update their own ideas, ADMIN and MANAGER can update any
router.put('/:id', validateId, validateImprovementIdeaUpdate, updateImprovementIdea);

// Delete improvement idea - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteImprovementIdea);

export default router;
