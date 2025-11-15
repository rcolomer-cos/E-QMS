import { Response } from 'express';
import { UserModel, CreateUserData } from '../models/UserModel';
import { RoleModel } from '../models/RoleModel';
import { AuthRequest, UserRole } from '../types';
import { validationResult } from 'express-validator';
import { generatePasswordOptions, generateMemorablePassword } from '../utils/passwordGenerator';

/**
 * Get all users (admin/superuser only)
 */
export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    
    // Remove password from response
    const sanitizedUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get user by ID (admin/superuser only)
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(parseInt(id, 10));

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Create a new user (admin/superuser only)
 * Note: Only superusers can create other superusers
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { email, password, firstName, lastName, department, roleIds } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Validate roleIds
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      res.status(400).json({ error: 'At least one role must be assigned' });
      return;
    }

    // Check if trying to create a superuser
    const roles = await RoleModel.findByIds(roleIds);
    const hasSuperuserRole = roles.some(r => r.name === 'superuser');

    if (hasSuperuserRole) {
      // Only superusers can create other superusers
      const isSuperuser = req.user.roles.includes(UserRole.SUPERUSER);
      if (!isSuperuser) {
        res.status(403).json({ error: 'Only superusers can create other superusers' });
        return;
      }
    }

    // Create user
    const userData: CreateUserData = {
      email,
      password,
      firstName,
      lastName,
      department,
      roleIds,
      createdBy: req.user.id,
      mustChangePassword: false,
    };

    const userId = await UserModel.create(userData);

    res.status(201).json({
      message: 'User created successfully',
      userId,
      email,
      password, // Return password only once so admin can share it
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user information (admin/superuser only)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { email, firstName, lastName, department } = req.body;

    const user = await UserModel.findById(parseInt(id, 10));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await UserModel.update(parseInt(id, 10), {
      email,
      firstName,
      lastName,
      department,
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete/deactivate user (admin/superuser only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const userId = parseInt(id, 10);

    // Prevent self-deletion
    if (userId === req.user.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if trying to delete a superuser
    const isSuperuser = user.roleNames?.includes('superuser');
    if (isSuperuser) {
      // Only superusers can delete other superusers
      const isRequestingSuperuser = req.user.roles.includes(UserRole.SUPERUSER);
      if (!isRequestingSuperuser) {
        res.status(403).json({ error: 'Only superusers can delete other superusers' });
        return;
      }
    }

    await UserModel.delete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Assign role to user (admin/superuser only)
 */
export const assignRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { roleId, expiresAt } = req.body;

    const user = await UserModel.findById(parseInt(id, 10));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Check if trying to assign superuser role
    if (role.name === 'superuser') {
      const isSuperuser = req.user.roles.includes(UserRole.SUPERUSER);
      if (!isSuperuser) {
        res.status(403).json({ error: 'Only superusers can assign the superuser role' });
        return;
      }
    }

    await UserModel.assignRole(
      parseInt(id, 10),
      roleId,
      req.user.id,
      expiresAt ? new Date(expiresAt) : undefined
    );

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

/**
 * Revoke role from user (admin/superuser only)
 */
export const revokeRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { roleId } = req.body;

    const user = await UserModel.findById(parseInt(id, 10));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Check if trying to revoke superuser role
    if (role.name === 'superuser') {
      const isSuperuser = req.user.roles.includes(UserRole.SUPERUSER);
      if (!isSuperuser) {
        res.status(403).json({ error: 'Only superusers can revoke the superuser role' });
        return;
      }
    }

    await UserModel.revokeRole(parseInt(id, 10), roleId);

    res.json({ message: 'Role revoked successfully' });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({ error: 'Failed to revoke role' });
  }
};

/**
 * Generate password options for new user
 */
export const generatePassword = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const passwords = generatePasswordOptions(3);
    res.json({ passwords });
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ error: 'Failed to generate password' });
  }
};

/**
 * Generate a single memorable password
 */
export const generateSinglePassword = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const password = generateMemorablePassword();
    res.json({ password });
  } catch (error) {
    console.error('Generate single password error:', error);
    res.status(500).json({ error: 'Failed to generate password' });
  }
};

/**
 * Get all available roles
 */
export const getAllRoles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await RoleModel.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};
