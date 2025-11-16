import { Router } from 'express';
import {
  createServiceMaintenanceRecord,
  getServiceMaintenanceRecords,
  getServiceMaintenanceRecordById,
  updateServiceMaintenanceRecord,
  deleteServiceMaintenanceRecord,
} from '../controllers/serviceMaintenanceRecordController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateServiceMaintenanceRecord, validateServiceMaintenanceRecordUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create Service/Maintenance Record - Requires ADMIN or MANAGER role
router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateServiceMaintenanceRecord, createServiceMaintenanceRecord);

// Get all Service/Maintenance Records - Accessible to all authenticated users
router.get('/', getServiceMaintenanceRecords);

// Get Service/Maintenance Record by ID - Accessible to all authenticated users
router.get('/:id', validateId, getServiceMaintenanceRecordById);

// Update Service/Maintenance Record - Requires ADMIN or MANAGER role
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateServiceMaintenanceRecordUpdate, updateServiceMaintenanceRecord);

// Delete Service/Maintenance Record - Requires ADMIN role only
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteServiceMaintenanceRecord);

export default router;
