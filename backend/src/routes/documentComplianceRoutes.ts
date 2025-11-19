import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  acknowledgeDocument,
  getComplianceStatus,
  getDocumentComplianceReport,
  getPendingDocuments,
  getComplianceDocuments,
  toggleComplianceRequired,
} from '../controllers/documentComplianceController';

const router = Router();

/**
 * @route   POST /api/documents/:documentId/compliance/acknowledge
 * @desc    Record user's acknowledgement of a compliance-required document
 * @access  Authenticated users with document access
 */
router.post(
  '/:documentId/acknowledge',
  authenticateToken,
  param('documentId').isInt().toInt(),
  acknowledgeDocument
);

/**
 * @route   GET /api/documents/:documentId/compliance/status
 * @desc    Get compliance status for current user and document
 * @access  Authenticated users
 */
router.get(
  '/:documentId/status',
  authenticateToken,
  param('documentId').isInt().toInt(),
  getComplianceStatus
);

/**
 * @route   GET /api/documents/:documentId/compliance/report
 * @desc    Get detailed compliance report for a document (who acknowledged, who hasn't)
 * @access  Admin or Manager
 */
router.get(
  '/:documentId/report',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  param('documentId').isInt().toInt(),
  getDocumentComplianceReport
);

/**
 * @route   GET /api/documents/compliance/pending
 * @desc    Get all pending documents requiring acknowledgement for current user
 * @access  Authenticated users
 */
router.get(
  '/pending',
  authenticateToken,
  getPendingDocuments
);

/**
 * @route   GET /api/documents/compliance/all
 * @desc    Get all compliance-required documents for current user with status
 * @access  Authenticated users
 */
router.get(
  '/all',
  authenticateToken,
  getComplianceDocuments
);

/**
 * @route   PUT /api/documents/:documentId/compliance/toggle
 * @desc    Toggle compliance requirement for a document
 * @access  Admin or Manager
 */
router.put(
  '/:documentId/toggle',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  param('documentId').isInt().toInt(),
  body('complianceRequired').isBoolean(),
  toggleComplianceRequired
);

export default router;
