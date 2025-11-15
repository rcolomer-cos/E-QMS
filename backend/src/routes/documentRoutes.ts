import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
} from '../controllers/documentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateDocument, validateId } from '../utils/validators';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateToken);

router.post('/', validateDocument, createDocument);
router.get('/', getDocuments);
router.get('/:id', validateId, getDocumentById);
router.put('/:id', validateId, updateDocument);
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteDocument);
router.post('/:id/version', validateId, createDocumentVersion);

export default router;
