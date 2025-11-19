import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import { uploadMiddleware } from '../middleware/upload';
import {
  getAvailableTemplates,
  downloadTemplate,
  uploadAndPreview,
  executeImport,
  getImportHistory,
  getImportLogDetails,
} from '../controllers/importController';

const router = Router();

// All import routes require superuser role
const requireSuperuser = [authenticateToken, authorizeRoles(UserRole.SUPERUSER)];

/**
 * GET /api/imports/templates
 * Get list of available import templates
 */
router.get('/templates', requireSuperuser, getAvailableTemplates);

/**
 * GET /api/imports/templates/:type
 * Download Excel template for specific type
 */
router.get('/templates/:type', requireSuperuser, downloadTemplate);

/**
 * POST /api/imports/preview
 * Upload Excel file and get preview of data
 */
router.post('/preview', requireSuperuser, uploadMiddleware.single('file'), uploadAndPreview);

/**
 * POST /api/imports/execute
 * Execute import after preview confirmation
 */
router.post('/execute', requireSuperuser, executeImport);

/**
 * GET /api/imports/history
 * Get import history with pagination and filters
 */
router.get('/history', requireSuperuser, getImportHistory);

/**
 * GET /api/imports/history/:id
 * Get import log details by ID
 */
router.get('/history/:id', requireSuperuser, getImportLogDetails);

export default router;
