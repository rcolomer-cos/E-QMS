import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getOrganizationalHierarchy,
  getOrgChartData,
  updateOrgChartData,
} from '../controllers/departmentController';
import { validateDepartment, validateDepartmentUpdate, validateId } from '../utils/validators';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Organizational hierarchy endpoint (must be before /:id to avoid conflicts)
router.get('/hierarchy/full', getOrganizationalHierarchy); // All authenticated users can view hierarchy

// Organizational chart flow data endpoints
router.get('/orgchart/data', getOrgChartData); // All authenticated users can view org chart
router.put('/orgchart/data', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), updateOrgChartData); // Manager+ can edit

// Department CRUD operations
router.get('/', getAllDepartments); // All authenticated users can view departments
router.get('/:id', validateId, getDepartmentById); // All authenticated users can view departments
router.get('/code/:code', getDepartmentByCode); // All authenticated users can view departments by code
router.post('/', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateDepartment, createDepartment); // Manager+ only
router.put('/:id', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateId, validateDepartmentUpdate, updateDepartment); // Manager+ only
router.delete('/:id', authorizeRoles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER), validateId, deleteDepartment); // Manager+ only

export default router;
