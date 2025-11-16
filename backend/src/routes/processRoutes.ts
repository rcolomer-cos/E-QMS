import { Router } from 'express';
import {
  getAllProcesses,
  getProcessById,
  getProcessByCode,
  createProcess,
  updateProcess,
  deleteProcess,
  getProcessOwners,
  assignProcessOwner,
  removeProcessOwner,
} from '../controllers/processController';
import { validateProcess, validateProcessUpdate, validateProcessOwner, validateId } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Process CRUD operations
router.get('/', getAllProcesses); // All authenticated users can view processes
router.get('/:id', validateId, getProcessById); // All authenticated users can view processes
router.get('/code/:code', getProcessByCode); // All authenticated users can view processes by code
router.post('/', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateProcess, createProcess); // Admin/superuser only
router.put('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, validateProcessUpdate, updateProcess); // Admin/superuser only
router.delete('/:id', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, deleteProcess); // Admin/superuser only

// Process owner management
router.get('/:id/owners', validateId, getProcessOwners); // All authenticated users can view process owners
router.post('/:id/owners', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, validateProcessOwner, assignProcessOwner); // Admin/superuser only
router.delete('/:id/owners/:ownerId', authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER), validateId, removeProcessOwner); // Admin/superuser only

export default router;
