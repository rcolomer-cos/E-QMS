import { Router } from 'express';
import {
  createNCR,
  getNCRs,
  getNCRById,
  updateNCR,
  updateNCRStatus,
  assignNCR,
  deleteNCR,
  getNCRClassificationOptions,
  getNCRsByInspectionRecord,
  getNCRMetrics,
} from '../controllers/ncrController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
  validateId, 
  validateNCR, 
  validateNCRUpdate, 
  validateNCRStatus, 
  validateNCRAssignment 
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get NCR classification options - Accessible to all authenticated users
router.get('/classification-options', getNCRClassificationOptions);

// Get NCR metrics - Accessible to all authenticated users
router.get('/metrics', getNCRMetrics);

// Get NCRs by Inspection Record - Accessible to all authenticated users
router.get('/by-inspection/:inspectionRecordId', validateId, getNCRsByInspectionRecord);

// Create NCR - Requires ADMIN, MANAGER, or AUDITOR role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCR, createNCR);

// Get all NCRs - Accessible to all authenticated users
router.get('/', getNCRs);

// Get NCR by ID - Accessible to all authenticated users
router.get('/:id', validateId, getNCRById);

// Update NCR status - ADMIN and MANAGER can close NCRs; ADMIN, MANAGER, and AUDITOR can change to other statuses
router.put('/:id/status', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCRStatus, updateNCRStatus);

// Assign NCR - Requires ADMIN, MANAGER, or AUDITOR role
router.put('/:id/assign', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCRAssignment, assignNCR);

// Update NCR - Requires ADMIN, MANAGER, or AUDITOR role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCRUpdate, updateNCR);

// Delete NCR - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteNCR);

export default router;
