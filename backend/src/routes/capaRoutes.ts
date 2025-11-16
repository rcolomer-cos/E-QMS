import { Router } from 'express';
import {
  createCAPA,
  getCAPAs,
  getCAPAById,
  updateCAPA,
  deleteCAPA,
} from '../controllers/capaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateCAPA, validateCAPAUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create CAPA - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPA, createCAPA);

// Get all CAPAs - Accessible to all authenticated users
router.get('/', getCAPAs);

// Get CAPA by ID - Accessible to all authenticated users
router.get('/:id', validateId, getCAPAById);

// Update CAPA - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateCAPAUpdate, updateCAPA);

// Delete CAPA - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteCAPA);

export default router;
