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

// All routes require authentication
router.use(authenticateToken);

// Get risk statistics - Accessible to all authenticated users
router.get('/statistics', getRiskStatistics);

// Create risk - Requires ADMIN, MANAGER, or AUDITOR role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateRisk, createRisk);

// Get all risks - Accessible to all authenticated users
router.get('/', getRisks);

// Get risk by ID - Accessible to all authenticated users
router.get('/:id', validateId, getRiskById);

// Update risk status - ADMIN and MANAGER can close/accept risks; ADMIN, MANAGER, and AUDITOR can change to other statuses
router.put('/:id/status', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateRiskStatus, updateRiskStatus);

// Update risk - Requires ADMIN, MANAGER, or AUDITOR role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateRiskUpdate, updateRisk);

// Delete risk - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteRisk);

export default router;
