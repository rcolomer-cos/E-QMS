import { Router } from 'express';
import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getCalibrationDue,
  getEquipmentReadOnly,
  regenerateQRCode,
  getEquipmentMetrics,
} from '../controllers/equipmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateEquipment, validateEquipmentUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { equipmentImageUpload } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

// Public read-only endpoint (no authentication required)
router.get('/public/:equipmentNumber', getEquipmentReadOnly);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/', createLimiter, authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), equipmentImageUpload.single('image'), validateEquipment, createEquipment);
router.get('/', getEquipment);
router.get('/metrics', getEquipmentMetrics);
router.get('/calibration-due', getCalibrationDue);
router.get('/:id', validateId, getEquipmentById);
router.put('/:id', validateId, authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), equipmentImageUpload.single('image'), validateEquipmentUpdate, updateEquipment);
router.post('/:id/regenerate-qr', validateId, authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN, UserRole.MANAGER), regenerateQRCode);
router.delete('/:id', validateId, authorizeRoles(UserRole.SUPERUSER, UserRole.ADMIN), deleteEquipment);

export default router;
