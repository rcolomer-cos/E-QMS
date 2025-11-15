import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/userController';
import { validateUser, validateUserUpdate } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All user management routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles(UserRole.ADMIN));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validateUser, createUser);
router.put('/:id', validateUserUpdate, updateUser);
router.delete('/:id', deactivateUser);

export default router;
