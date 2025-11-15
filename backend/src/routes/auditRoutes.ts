import { Router } from 'express';
import {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  deleteAudit,
} from '../controllers/auditController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateToken);

router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), createAudit);
router.get('/', getAudits);
router.get('/:id', validateId, getAuditById);
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), updateAudit);
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteAudit);

export default router;
