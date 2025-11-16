import { Router } from 'express';
import {
  createCalibrationRecord,
  getCalibrationRecords,
  getCalibrationRecordById,
  updateCalibrationRecord,
  deleteCalibrationRecord,
} from '../controllers/calibrationRecordController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateCalibrationRecord, validateCalibrationRecordUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create Calibration Record - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateCalibrationRecord, createCalibrationRecord);

// Get all Calibration Records - Accessible to all authenticated users
router.get('/', getCalibrationRecords);

// Get Calibration Record by ID - Accessible to all authenticated users
router.get('/:id', validateId, getCalibrationRecordById);

// Update Calibration Record - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateCalibrationRecordUpdate, updateCalibrationRecord);

// Delete Calibration Record - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteCalibrationRecord);

export default router;
