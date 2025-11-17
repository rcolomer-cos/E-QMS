import { Router } from 'express';
import { EvidencePackController } from '../controllers/evidencePackController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/evidence-pack/generate
 * @desc    Generate and download evidence pack PDF
 * @access  Admin, Manager, Auditor
 */
router.post(
  '/generate',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  EvidencePackController.generateEvidencePack
);

/**
 * @route   GET /api/evidence-pack/options
 * @desc    Get available options for evidence pack generation
 * @access  Admin, Manager, Auditor
 */
router.get(
  '/options',
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  EvidencePackController.getOptions
);

export default router;
