import { Router } from 'express';
import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  getEquipmentByQR,
  updateEquipment,
  deleteEquipment,
  getCalibrationDue,
} from '../controllers/equipmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateId } from '../utils/validators';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), createEquipment);
router.get('/', getEquipment);
router.get('/calibration-due', getCalibrationDue);
router.get('/qr/:qrCode', getEquipmentByQR);
router.get('/:id', validateId, getEquipmentById);
router.put('/:id', validateId, updateEquipment);
router.delete('/:id', validateId, authorizeRoles(UserRole.ADMIN), deleteEquipment);

export default router;
