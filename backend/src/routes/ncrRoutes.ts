import { Router } from 'express';
import {
  createNCR,
  getNCRs,
  getNCRById,
  updateNCR,
  deleteNCR,
} from '../controllers/ncrController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateNCR, validateNCRUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create NCR - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCR, createNCR);

// Get all NCRs - Accessible to all authenticated users
router.get('/', getNCRs);

// Get NCR by ID - Accessible to all authenticated users
router.get('/:id', validateId, getNCRById);

// Update NCR - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), validateNCRUpdate, updateNCR);

// Delete NCR - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteNCR);

export default router;
