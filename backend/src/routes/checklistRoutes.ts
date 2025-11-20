import { Router } from 'express';
import {
  // Template controllers
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getActiveTemplates,
  // Question controllers
  createQuestion,
  getQuestionsByTemplate,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  // Response controllers
  createResponse,
  getResponsesByAudit,
  getResponsesByAuditAndTemplate,
  getResponseById,
  updateResponse,
  deleteResponse,
  getNonCompliantResponses,
  getResponsesRequiringAction,
  getAuditCompletionStats,
} from '../controllers/checklistController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// =============================================
// Checklist Template Routes
// =============================================

// Get all templates (all authenticated users can view)
router.get('/templates', getTemplates);

// Get active templates (all authenticated users can view)
router.get('/templates/active', getActiveTemplates);

// Get template by ID
router.get('/templates/:id', validateId, getTemplateById);

// Create template (superuser, admin, manager, auditor)
router.post(
  '/templates',
  createLimiter,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  createTemplate
);

// Update template (superuser, admin, manager, auditor)
router.put(
  '/templates/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  updateTemplate
);

// Delete template (superuser, admin only)
router.delete(
  '/templates/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN),
  deleteTemplate
);

// =============================================
// Checklist Question Routes
// =============================================

// Get questions by template ID
router.get('/templates/:templateId/questions', validateId, getQuestionsByTemplate);

// Get question by ID
router.get('/questions/:id', validateId, getQuestionById);

// Create question (superuser, admin, manager, auditor)
router.post(
  '/questions',
  createLimiter,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  createQuestion
);

// Update question (superuser, admin, manager, auditor)
router.put(
  '/questions/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  updateQuestion
);

// Delete question (superuser, admin only)
router.delete(
  '/questions/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN),
  deleteQuestion
);

// Reorder questions in a template (superuser, admin, manager, auditor)
router.put(
  '/templates/:templateId/questions/reorder',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  reorderQuestions
);

// =============================================
// Checklist Response Routes
// =============================================

// Get responses by audit ID
router.get('/audits/:auditId/responses', validateId, getResponsesByAudit);

// Get responses by audit and template
router.get(
  '/audits/:auditId/templates/:templateId/responses',
  getResponsesByAuditAndTemplate
);

// Get non-compliant responses for an audit
router.get('/audits/:auditId/responses/non-compliant', validateId, getNonCompliantResponses);

// Get responses requiring action for an audit
router.get('/audits/:auditId/responses/requiring-action', validateId, getResponsesRequiringAction);

// Get audit completion stats
router.get('/audits/:auditId/completion-stats', validateId, getAuditCompletionStats);

// Get response by ID
router.get('/responses/:id', validateId, getResponseById);

// Create response (superuser, admin, manager, auditor)
router.post(
  '/responses',
  createLimiter,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  createResponse
);

// Update response (superuser, admin, manager, auditor)
router.put(
  '/responses/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  updateResponse
);

// Delete response (superuser, admin only)
router.delete(
  '/responses/:id',
  validateId,
  authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN),
  deleteResponse
);

export default router;
