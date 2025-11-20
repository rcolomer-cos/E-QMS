import { Router } from 'express';
import {
  createSwotEntry,
  getSwotEntries,
  getSwotEntryById,
  updateSwotEntry,
  deleteSwotEntry,
  getSwotStatistics,
  reorderSwotEntries,
} from '../controllers/swotController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateSwotEntry, validateSwotEntryUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get SWOT statistics - Accessible to all authenticated users
router.get('/statistics', getSwotStatistics);

// Reorder SWOT entries - Requires ADMIN or MANAGER role
router.post('/reorder', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), reorderSwotEntries);

// Create SWOT entry - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateSwotEntry, createSwotEntry);

// Get all SWOT entries - Accessible to all authenticated users
router.get('/', getSwotEntries);

// Get SWOT entry by ID - Accessible to all authenticated users
router.get('/:id', validateId, getSwotEntryById);

// Update SWOT entry - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateSwotEntryUpdate, updateSwotEntry);

// Delete SWOT entry - Requires ADMIN, MANAGER, or SUPERUSER role
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), deleteSwotEntry);

export default router;
