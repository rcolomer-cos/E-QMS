import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
  uploadDocumentFile,
  downloadDocumentFile,
  getDocumentVersionHistory,
  getDocumentRevisionHistory,
  createDocumentRevision,
  approveDocument,
} from '../controllers/documentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { checkDocumentPermission, DocumentAction } from '../middleware/documentPermissions';
import { validateDocument, validateDocumentUpdate, validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create document - requires USER, MANAGER, or ADMIN role
router.post('/', createLimiter, validateDocument, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), createDocument);

// List documents - all authenticated users can list (filtering happens in controller if needed)
router.get('/', getDocuments);

// Get document by ID - requires VIEW permission
router.get('/:id', validateId, checkDocumentPermission(DocumentAction.VIEW), getDocumentById);

// Get document version history - requires VIEW permission
router.get('/:id/versions', validateId, checkDocumentPermission(DocumentAction.VIEW), getDocumentVersionHistory);

// Get document revision history - requires VIEW permission
router.get('/:id/revisions', validateId, checkDocumentPermission(DocumentAction.VIEW), getDocumentRevisionHistory);

// Create document revision entry - requires EDIT permission
router.post('/:id/revisions', createLimiter, validateId, checkDocumentPermission(DocumentAction.EDIT), createDocumentRevision);

// Download document file - requires VIEW permission
router.get('/:id/download', validateId, checkDocumentPermission(DocumentAction.VIEW), downloadDocumentFile);

// Update document - requires EDIT permission
router.put('/:id', validateId, validateDocumentUpdate, checkDocumentPermission(DocumentAction.EDIT), updateDocument);

// Approve document - requires APPROVE permission
router.post('/:id/approve', validateId, checkDocumentPermission(DocumentAction.APPROVE), approveDocument);

// Delete document - requires DELETE permission (ADMIN only)
router.delete('/:id', validateId, checkDocumentPermission(DocumentAction.DELETE), deleteDocument);

// Create new version - requires VIEW permission (will create a new draft that user can edit)
router.post('/:id/version', createLimiter, validateId, checkDocumentPermission(DocumentAction.VIEW), createDocumentVersion);

// Upload document file - requires EDIT permission
router.post('/:id/upload', createLimiter, validateId, uploadMiddleware.single('file'), checkDocumentPermission(DocumentAction.EDIT), uploadDocumentFile);

export default router;
