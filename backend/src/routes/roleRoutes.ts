import express, { Response } from 'express';
import { RoleModel } from '../models/RoleModel';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// All role routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Authenticated users
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await RoleModel.findAll();
    
    // Map to return only necessary fields
    const rolesData = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSuperUser: role.isSuperUser,
    }));

    res.json({ roles: rolesData });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Authenticated users
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);
    const role = await RoleModel.findById(roleId);

    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json({
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSuperUser: role.isSuperUser,
        permissions: role.permissions ? JSON.parse(role.permissions) : [],
      },
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

export default router;
