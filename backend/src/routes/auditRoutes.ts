import { Router } from 'express';
import {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  deleteAudit,
  submitAuditForReview,
  approveAudit,
  rejectAudit,
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

// Approval workflow routes
router.post('/:id/submit-for-review', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), submitAuditForReview);
router.post('/:id/approve', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), approveAudit);
router.post('/:id/reject', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), rejectAudit);

export default router;
