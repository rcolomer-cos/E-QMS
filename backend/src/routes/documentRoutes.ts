import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
  uploadDocumentFile,
} from '../controllers/documentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateDocument, validateDocumentUpdate, validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateToken);

router.post('/', createLimiter, validateDocument, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), createDocument);
router.get('/', getDocuments);
router.get('/:id', validateId, getDocumentById);
router.put('/:id', validateId, validateDocumentUpdate, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), updateDocument);
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteDocument);
router.post('/:id/version', createLimiter, validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), createDocumentVersion);
router.post('/:id/upload', createLimiter, validateId, uploadMiddleware.single('file'), authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), uploadDocumentFile);

export default router;
