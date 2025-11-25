import express from 'express';
import {
  getSkillLevels,
  getSkillLevelSummary,
  getSkillLevelById,
  getSkillLevelByLevel,
  createSkillLevel,
  updateSkillLevel,
  deleteSkillLevel,
} from '../controllers/skillLevelController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { UserRole } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/skill-levels
 * @desc    Get all skill levels
 * @access  Authenticated users
 */
router.get('/', getSkillLevels);

/**
 * @route   GET /api/skill-levels/summary
 * @desc    Get skill level summary (quick reference)
 * @access  Authenticated users
 */
router.get('/summary', getSkillLevelSummary);

/**
 * @route   GET /api/skill-levels/level/:level
 * @desc    Get skill level by level number (1-5)
 * @access  Authenticated users
 */
router.get('/level/:level', getSkillLevelByLevel);

/**
 * @route   GET /api/skill-levels/:id
 * @desc    Get a single skill level by ID
 * @access  Authenticated users
 */
router.get('/:id', validateId, getSkillLevelById);

/**
 * @route   POST /api/skill-levels
 * @desc    Create a new skill level
 * @access  SUPERUSER only (organizational standards)
 */
router.post('/', authorizeRoles(UserRole.SUPERUSER), createSkillLevel);

/**
 * @route   PUT /api/skill-levels/:id
 * @desc    Update an existing skill level
 * @access  SUPERUSER only (organizational standards)
 */
router.put('/:id', validateId, authorizeRoles(UserRole.SUPERUSER), updateSkillLevel);

/**
 * @route   DELETE /api/skill-levels/:id
 * @desc    Delete a skill level (soft delete)
 * @access  SUPERUSER only (organizational standards)
 */
router.delete('/:id', validateId, authorizeRoles(UserRole.SUPERUSER), deleteSkillLevel);

export default router;
