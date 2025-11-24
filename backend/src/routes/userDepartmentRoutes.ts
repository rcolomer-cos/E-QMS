import { Router } from 'express';
import {
  getAllUserDepartments,
  getUserDepartmentsByUserId,
  getUserDepartmentsByDepartmentId,
  getUserDepartmentById,
  createUserDepartment,
  updateUserDepartment,
  deleteUserDepartment,
  setPrimaryDepartment,
} from '../controllers/userDepartmentController';
import { validateId, validateUserDepartment, validateUserDepartmentUpdate } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User-department assignment CRUD operations
router.get('/', getAllUserDepartments); // All authenticated users can view assignments
router.get('/user/:userId', validateId, getUserDepartmentsByUserId); // Get assignments for a specific user
router.get('/department/:departmentId', validateId, getUserDepartmentsByDepartmentId); // Get assignments for a specific department
router.get('/:id', validateId, getUserDepartmentById); // Get specific assignment by ID
router.post('/', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateUserDepartment, createUserDepartment); // Manager+ only
router.put('/:id', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateId, validateUserDepartmentUpdate, updateUserDepartment); // Manager+ only
router.delete('/:id', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateId, deleteUserDepartment); // Manager+ only
router.patch('/:id/primary', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateId, setPrimaryDepartment); // Set as primary department

export default router;
