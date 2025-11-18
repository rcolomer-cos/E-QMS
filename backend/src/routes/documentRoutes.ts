import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getPendingDocuments,
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
  rejectDocument,
  requestChangesDocument,
  getDocumentProcesses,
} from '../controllers/documentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { flexibleAuth } from '../middleware/flexibleAuth';
import { enforceReadOnly, checkResourceScope, logAuditorAccess } from '../middleware/auditorAccessToken';
import { checkDocumentPermission, DocumentAction } from '../middleware/documentPermissions';
import { validateDocument, validateDocumentUpdate, validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware, attachmentUpload } from '../middleware/upload';
import { UserRole } from '../types';
import {
  getDocumentContent,
  upsertDocumentContent,
  uploadDocumentContentImage,
  exportDocumentPdf,
} from '../controllers/documentController';

const router = Router();

// Create document - requires USER, MANAGER, or ADMIN role
router.post('/', authenticateToken, createLimiter, validateDocument, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), createDocument);

// List documents - all authenticated users can list (filtering happens in controller if needed)
router.get('/', flexibleAuth, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), getDocuments);

// Get pending documents (in review status) with enriched data
router.get('/pending', flexibleAuth, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), getPendingDocuments);

// Get document by ID - requires VIEW permission
router.get('/:id', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), checkDocumentPermission(DocumentAction.VIEW), getDocumentById);

// Get document version history - requires VIEW permission
router.get('/:id/versions', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), checkDocumentPermission(DocumentAction.VIEW), getDocumentVersionHistory);

// Get document revision history - requires VIEW permission
router.get('/:id/revisions', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), checkDocumentPermission(DocumentAction.VIEW), getDocumentRevisionHistory);

// Create document revision entry - requires EDIT permission
router.post('/:id/revisions', authenticateToken, createLimiter, validateId, checkDocumentPermission(DocumentAction.EDIT), createDocumentRevision);

// Download document file - requires VIEW permission
router.get('/:id/download', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), checkDocumentPermission(DocumentAction.VIEW), downloadDocumentFile);

// Update document - requires EDIT permission
router.put('/:id', authenticateToken, validateId, validateDocumentUpdate, checkDocumentPermission(DocumentAction.EDIT), updateDocument);

// Approve document - requires APPROVE permission
router.post('/:id/approve', authenticateToken, validateId, checkDocumentPermission(DocumentAction.APPROVE), approveDocument);

// Reject document - requires REJECT permission
router.post('/:id/reject', authenticateToken, createLimiter, validateId, checkDocumentPermission(DocumentAction.REJECT), rejectDocument);

// Request changes for document - requires REQUEST_CHANGES permission
router.post('/:id/request-changes', authenticateToken, createLimiter, validateId, checkDocumentPermission(DocumentAction.REQUEST_CHANGES), requestChangesDocument);

// Delete document - requires DELETE permission (ADMIN only)
router.delete('/:id', authenticateToken, validateId, checkDocumentPermission(DocumentAction.DELETE), deleteDocument);

// Create new version - requires VIEW permission (will create a new draft that user can edit)
router.post('/:id/version', authenticateToken, createLimiter, validateId, checkDocumentPermission(DocumentAction.VIEW), createDocumentVersion);

// Upload document file - requires EDIT permission
router.post('/:id/upload', authenticateToken, createLimiter, validateId, uploadMiddleware.single('file'), checkDocumentPermission(DocumentAction.EDIT), uploadDocumentFile);

// Rich content: get/save content
router.get('/:id/content', authenticateToken, validateId, checkDocumentPermission(DocumentAction.VIEW), getDocumentContent);
router.put('/:id/content', authenticateToken, createLimiter, validateId, checkDocumentPermission(DocumentAction.EDIT), upsertDocumentContent);

// Rich content image upload for editor
router.post('/:id/content-images', authenticateToken, createLimiter, validateId, attachmentUpload.single('file'), checkDocumentPermission(DocumentAction.EDIT), uploadDocumentContentImage);

// Export document as PDF with watermark
router.post('/:id/export-pdf', authenticateToken, validateId, checkDocumentPermission(DocumentAction.VIEW), exportDocumentPdf);

// Get processes linked to document
router.get('/:id/processes', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('document'), logAuditorAccess('document'), checkDocumentPermission(DocumentAction.VIEW), getDocumentProcesses);

export default router;
