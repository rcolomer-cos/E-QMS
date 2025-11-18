import { Router } from 'express';
import {
  createEmailTemplate,
  getEmailTemplates,
  getEmailTemplateById,
  getEmailTemplatesByType,
  getDefaultEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getTemplateTypes,
  getTemplateCategories,
} from '../controllers/emailTemplateController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateEmailTemplate, validateEmailTemplateUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get template types - Accessible to all authenticated users
router.get('/types', getTemplateTypes);

// Get template categories - Accessible to all authenticated users
router.get('/categories', getTemplateCategories);

// Get default template by type - Accessible to all authenticated users
router.get('/default/:type', getDefaultEmailTemplate);

// Get templates by type - Accessible to all authenticated users
router.get('/by-type/:type', getEmailTemplatesByType);

// Create email template - Requires ADMIN role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN), validateEmailTemplate, createEmailTemplate);

// Get all email templates - Accessible to all authenticated users
router.get('/', getEmailTemplates);

// Get email template by ID - Accessible to all authenticated users
router.get('/:id', validateId, getEmailTemplateById);

// Update email template - Requires ADMIN role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN), validateEmailTemplateUpdate, updateEmailTemplate);

// Delete email template - Requires ADMIN role
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteEmailTemplate);

export default router;
