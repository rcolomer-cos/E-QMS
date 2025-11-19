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
  getProcessDocuments,
  linkDocumentToProcess,
  unlinkDocumentFromProcess,
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
router.post('/', authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), validateProcess, createProcess); // Superuser, Admin, Manager
router.put('/:id', authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), validateId, validateProcessUpdate, updateProcess); // Superuser, Admin, Manager
router.delete('/:id', authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), validateId, deleteProcess); // Superuser, Admin, Manager

// Process owner management
router.get('/:id/owners', validateId, getProcessOwners); // All authenticated users can view process owners
router.post('/:id/owners', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), validateId, validateProcessOwner, assignProcessOwner); // Admin/Manager/superuser only
router.delete('/:id/owners/:ownerId', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), validateId, removeProcessOwner); // Admin/Manager/superuser only

// Process document linking
router.get('/:id/documents', validateId, getProcessDocuments); // All authenticated users can view linked documents
router.post('/:id/documents', validateId, linkDocumentToProcess); // Authenticated users can link documents
router.delete('/:id/documents/:documentId', validateId, unlinkDocumentFromProcess); // Authenticated users can unlink documents

export default router;
