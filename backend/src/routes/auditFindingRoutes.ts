import { Router } from 'express';
import {
  createAuditFinding,
  getAuditFindings,
  getAuditFindingById,
  getAuditFindingsByAuditId,
  updateAuditFinding,
  deleteAuditFinding,
  linkFindingToNCR,
  getAuditFindingStats,
  getAuditFindingsSummary,
} from '../controllers/auditFindingController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateAuditFinding, validateAuditFindingUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateToken);

// Create a new audit finding
router.post(
  '/',
  createLimiter,
  validateAuditFinding,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  createAuditFinding
);

// Get all audit findings with optional filters
router.get('/', getAuditFindings);

// Get audit findings summary with filtering by category, severity, process, and timeframe
router.get('/summary', getAuditFindingsSummary);

// Get findings by audit ID
router.get('/audit/:auditId', validateId, getAuditFindingsByAuditId);

// Get finding statistics for an audit
router.get('/audit/:auditId/stats', validateId, getAuditFindingStats);

// Get a specific audit finding by ID
router.get('/:id', validateId, getAuditFindingById);

// Update an audit finding
router.put(
  '/:id',
  validateId,
  validateAuditFindingUpdate,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  updateAuditFinding
);

// Link a finding to an NCR
router.post(
  '/:id/link-ncr',
  validateId,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  linkFindingToNCR
);

// Delete an audit finding
router.delete(
  '/:id',
  validateId,
  authorizeRoles(UserRole.ADMIN),
  deleteAuditFinding
);

export default router;
