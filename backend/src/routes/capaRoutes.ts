import { Router } from 'express';
import {
  createCAPA,
  getCAPAs,
  getCAPAById,
  updateCAPA,
  deleteCAPA,
  assignCAPA,
  updateCAPAStatus,
  completeCAPA,
  verifyCAPA,
  getCAPAsAssignedToMe,
  getOverdueCAPAs,
  getCAPADashboardStats,
} from '../controllers/capaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { 
  validateId, 
  validateCAPA, 
  validateCAPAUpdate,
  validateCAPAAssignment,
  validateCAPAStatusUpdate,
  validateCAPACompletion,
  validateCAPAVerification,
} from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create CAPA - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPA, createCAPA);

// Workflow-specific routes (placed before :id routes to avoid conflicts)
// Get dashboard statistics - Accessible to all authenticated users
router.get('/dashboard/stats', getCAPADashboardStats);

// Get CAPAs assigned to current user - Accessible to all authenticated users
router.get('/assigned-to-me', getCAPAsAssignedToMe);

// Get overdue CAPAs - Accessible to all authenticated users
router.get('/overdue', getOverdueCAPAs);

// Get all CAPAs - Accessible to all authenticated users
router.get('/', getCAPAs);

// Get CAPA by ID - Accessible to all authenticated users
router.get('/:id', validateId, getCAPAById);

// Assign CAPA to a user - Requires ADMIN, MANAGER, or AUDITOR role
router.post('/:id/assign', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPAAssignment, assignCAPA);

// Update CAPA status - Requires ADMIN, MANAGER, AUDITOR, or assigned USER
router.put('/:id/status', validateId, validateCAPAStatusUpdate, updateCAPAStatus);

// Complete CAPA - Action owner only
router.post('/:id/complete', validateId, validateCAPACompletion, completeCAPA);

// Verify CAPA effectiveness - Requires ADMIN, MANAGER, or AUDITOR (not action owner)
router.post('/:id/verify', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPAVerification, verifyCAPA);

// Update CAPA - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPAUpdate, updateCAPA);

// Delete CAPA - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteCAPA);

export default router;
