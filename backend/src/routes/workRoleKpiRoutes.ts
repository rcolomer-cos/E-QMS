import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getWorkRoleKPIs,
  getWorkRoleKPIById,
  getWorkRoleKPISummary
} from '../controllers/workRoleKpiController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/work-role-kpis
 * @desc    Get KPI statistics for all work roles
 * @access  Private (authenticated users)
 */
router.get('/', getWorkRoleKPIs);

/**
 * @route   GET /api/work-role-kpis/summary
 * @desc    Get overall summary statistics across all work roles
 * @access  Private (authenticated users)
 */
router.get('/summary', getWorkRoleKPISummary);

/**
 * @route   GET /api/work-role-kpis/:id
 * @desc    Get detailed KPI statistics for a specific work role
 * @access  Private (authenticated users)
 */
router.get('/:id', getWorkRoleKPIById);

export default router;
