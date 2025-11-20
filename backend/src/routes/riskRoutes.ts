import { Router } from 'express';
import {
  createRisk,
  getRisks,
  getRiskById,
  updateRisk,
  updateRiskStatus,
  deleteRisk,
  getRiskStatistics,
} from '../controllers/riskController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
  validateId, 
  validateRisk, 
  validateRiskUpdate, 
  validateRiskStatus 
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication and admin/manager/superuser roles
router.use(authenticateToken);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER));

// Get risk statistics - Requires ADMIN, MANAGER, or SUPERUSER role
router.get('/statistics', getRiskStatistics);

// Create risk - Requires ADMIN, MANAGER, or SUPERUSER role
router.post('/', createLimiter, validateRisk, createRisk);

// Get all risks - Requires ADMIN, MANAGER, or SUPERUSER role
router.get('/', getRisks);

// Get risk by ID - Requires ADMIN, MANAGER, or SUPERUSER role
router.get('/:id', validateId, getRiskById);

// Update risk status - Requires ADMIN, MANAGER, or SUPERUSER role
router.put('/:id/status', validateId, validateRiskStatus, updateRiskStatus);

// Update risk - Requires ADMIN, MANAGER, or SUPERUSER role
router.put('/:id', validateId, validateRiskUpdate, updateRisk);

// Delete risk - Requires ADMIN, MANAGER, or SUPERUSER role
router.delete('/:id', validateId, deleteRisk);

export default router;
