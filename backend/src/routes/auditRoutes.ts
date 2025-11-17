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
import { flexibleAuth } from '../middleware/flexibleAuth';
import { enforceReadOnly, checkResourceScope, logAuditorAccess } from '../middleware/auditorAccessToken';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// Write operations require regular authentication
router.use('/*/submit-for-review', authenticateToken);
router.use('/*/approve', authenticateToken);
router.use('/*/reject', authenticateToken);

router.post('/', authenticateToken, createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), createAudit);
router.get('/', flexibleAuth, enforceReadOnly, checkResourceScope('audit'), logAuditorAccess('audit'), getAudits);
router.get('/:id', flexibleAuth, validateId, enforceReadOnly, checkResourceScope('audit'), logAuditorAccess('audit'), getAuditById);
router.put('/:id', authenticateToken, validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), updateAudit);
router.delete('/:id', authenticateToken, validateId, authorizeRoles(UserRole.ADMIN), deleteAudit);

// Approval workflow routes
router.post('/:id/submit-for-review', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), submitAuditForReview);
router.post('/:id/approve', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), approveAudit);
router.post('/:id/reject', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), rejectAudit);

export default router;
