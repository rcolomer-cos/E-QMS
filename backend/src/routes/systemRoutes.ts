import express from 'express';
import { body } from 'express-validator';
import {
  checkInitialization,
  createFirstSuperUser,
  getSystemStatus,
} from '../controllers/systemController';

const router = express.Router();

/**
 * @route   GET /api/system/init-status
 * @desc    Check if system needs initialization
 * @access  Public
 */
router.get('/init-status', checkInitialization);

/**
 * @route   POST /api/system/init
 * @desc    Create first superuser (only works if no superuser exists)
 * @access  Public (but fails if superuser already exists)
 */
router.post(
  '/init',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
  ],
  createFirstSuperUser
);

/**
 * @route   GET /api/system/status
 * @desc    Get system status and health
 * @access  Public
 */
router.get('/status', getSystemStatus);

export default router;
