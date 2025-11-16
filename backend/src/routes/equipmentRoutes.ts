import { Router } from 'express';
import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  getEquipmentByQR,
  updateEquipment,
  deleteEquipment,
  getCalibrationDue,
  getEquipmentReadOnly,
} from '../controllers/equipmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId, validateEquipment, validateEquipmentUpdate } from '../utils/validators';
import { createLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = Router();

// Public read-only endpoint (no authentication required)
router.get('/public/:equipmentNumber', getEquipmentReadOnly);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/', createLimiter, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateEquipment, createEquipment);
router.get('/', getEquipment);
router.get('/calibration-due', getCalibrationDue);
router.get('/qr/:qrCode', getEquipmentByQR);
router.get('/:id', validateId, getEquipmentById);
router.put('/:id', validateId, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), validateEquipmentUpdate, updateEquipment);
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteEquipment);

export default router;
