import { Router } from 'express';
import {
  uploadAttachment,
  uploadMultipleAttachments,
  getAttachments,
  getAttachmentById,
  downloadAttachment,
  updateAttachment,
  deleteAttachment,
  getAttachmentsByEntity,
} from '../controllers/attachmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateAttachmentUpload, validateAttachmentUpdate } from '../utils/validators';
import { attachmentUpload } from '../middleware/upload';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload single attachment - Accessible to authenticated users
router.post(
  '/',
  createLimiter,
  attachmentUpload.single('file'),
  validateAttachmentUpload,
  uploadAttachment
);

// Upload multiple attachments - Accessible to authenticated users
router.post(
  '/multiple',
  createLimiter,
  attachmentUpload.array('files', 10),
  validateAttachmentUpload,
  uploadMultipleAttachments
);

// Get all attachments (with filters) - Accessible to all authenticated users
router.get('/', getAttachments);

// Get attachments by entity - Accessible to all authenticated users
router.get('/entity/:entityType/:entityId', getAttachmentsByEntity);

// Get attachment by ID - Accessible to all authenticated users
router.get('/:id', validateId, getAttachmentById);

// Download attachment - Accessible to all authenticated users
router.get('/:id/download', validateId, downloadAttachment);

// Update attachment metadata - Accessible to authenticated users
router.put('/:id', validateId, validateAttachmentUpdate, updateAttachment);

// Delete attachment - Requires SUPERUSER, ADMIN, MANAGER, or AUDITOR role
router.delete('/:id', validateId, authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), deleteAttachment);

export default router;
