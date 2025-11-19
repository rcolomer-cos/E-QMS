import { Router } from 'express';
import {
  createInspectionRecord,
  getInspectionRecords,
  getInspectionRecordById,
  updateInspectionRecord,
  deleteInspectionRecord,
  createNCRFromInspection,
} from '../controllers/inspectionRecordController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateInspectionRecord, validateInspectionRecordUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create Inspection Record - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateInspectionRecord, createInspectionRecord);

// Get all Inspection Records - Accessible to all authenticated users
router.get('/', getInspectionRecords);

// Get Inspection Record by ID - Accessible to all authenticated users
router.get('/:id', validateId, getInspectionRecordById);

// Create NCR from Inspection Record - Requires ADMIN, MANAGER, or AUDITOR role
router.post('/:id/create-ncr', validateId, createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR), createNCRFromInspection);

// Update Inspection Record - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateInspectionRecordUpdate, updateInspectionRecord);

// Delete Inspection Record - Requires ADMIN, MANAGER, or SUPERUSER role
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERUSER), deleteInspectionRecord);

export default router;
