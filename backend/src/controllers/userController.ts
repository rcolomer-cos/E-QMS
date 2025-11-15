import { Response } from 'express';
import { UserModel } from '../models/UserModel';
import { RoleModel } from '../models/RoleModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { generateMemorablePassword } from '../utils/passwordGenerator';

/**
 * Get all users (admin and superuser only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const users = await UserModel.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userId = parseInt(req.params.id);
    const user = await UserModel.findById(userId);

import { AuthRequest, UserRole } from '../types';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

/**
 * Get all users (Admin only)
 */
export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

/**
 * Get user by ID (Admin or self)
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is accessing their own profile or is admin
    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== userId) {
      res.status(403).json({ error: 'Access denied: You can only view your own profile' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user roles
    const roles = await RoleModel.getUserRoles(userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        active: user.active,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: roles.map(r => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
        })),
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Create/Invite new user (admin and superuser only)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

/**
 * Update user (Admin or self, with restrictions)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { email, firstName, lastName, department, roleIds, generatePassword } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Generate password or use provided one
    let password = req.body.password;
    let generatedPassword: string | undefined;

    if (generatePassword || !password) {
      generatedPassword = generateMemorablePassword(12);
      password = generatedPassword;
    }

    // Create user
    const userId = await UserModel.create(
      {
        email,
        password,
        firstName,
        lastName,
        department,
        active: true,
        mustChangePassword: false,
      },
      req.user.id
    );

    // Assign roles
    if (roleIds && Array.isArray(roleIds)) {
      for (const roleId of roleIds) {
        // Check if trying to assign superuser role
        const role = await RoleModel.findById(roleId);
        if (role && role.isSuperUser) {
          // Only superusers can assign superuser role
          const isSuperUser = await RoleModel.userIsSuperUser(req.user.id);
          if (!isSuperUser) {
            res.status(403).json({ 
              error: 'Only superusers can assign superuser role' 
            });
            return;
          }
        }

        await RoleModel.assignRoleToUser(userId, roleId, req.user.id);
      }
    }

    // Get assigned roles
    const assignedRoles = await RoleModel.getUserRoles(userId);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        department,
        roles: assignedRoles.map(r => r.name),
      },
      // Only return password if it was generated
      ...(generatedPassword && { 
        credentials: {
          email,
          password: generatedPassword,
        }
      }),
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user (admin and superuser only)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const userId = parseInt(req.params.id);
    const { email, firstName, lastName, department, active } = req.body;

    const userId = parseInt(req.params.id);
    const updates = req.body;

    // Check if user is updating their own profile or is admin
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const isSelf = req.user?.id === userId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'Access denied: You can only update your own profile' });
      return;
    }

    // Non-admins cannot change role or active status
    if (!isAdmin && (updates.role || updates.active !== undefined)) {
      res.status(403).json({ error: 'Access denied: Only admins can change role or active status' });
      return;
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await UserModel.update(userId, updates);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete (deactivate) user (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user
    await UserModel.update(userId, {
      email,
      firstName,
      lastName,
      department,
    });

    if (active !== undefined && !active) {
      await UserModel.delete(userId);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Assign role to user (admin and superuser only)
 */
export const assignRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const userId = parseInt(req.params.id);
    const { roleId } = req.body;

    await UserModel.delete(userId);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Prevent changing own role
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Cannot change your own role' });
      return;
    }

    const user = await UserModel.findById(userId);
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
    if (role.isSuperUser) {
      const isSuperUser = await RoleModel.userIsSuperUser(req.user.id);
      if (!isSuperUser) {
        res.status(403).json({ 
          error: 'Only superusers can assign superuser role' 
        });
        return;
      }
    }

    await RoleModel.assignRoleToUser(userId, roleId, req.user.id);

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

/**
 * Remove role from user (admin and superuser only)
 */
export const removeRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const userId = parseInt(req.params.id);
    const { roleId } = req.body;

    await UserModel.update(userId, { role });
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

/**
 * Change user password (Admin or self)
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    // Check if user is changing their own password or is admin
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const isSelf = req.user?.id === userId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'Access denied: You can only change your own password' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Check if trying to remove superuser role
    if (role.isSuperUser) {
      const isSuperUser = await RoleModel.userIsSuperUser(req.user.id);
      if (!isSuperUser) {
        res.status(403).json({ 
          error: 'Only superusers can remove superuser role' 
        });
    // Non-admins must provide current password
    if (!isAdmin) {
      const isValidPassword = await UserModel.verifyPassword(user, currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
    }

    await RoleModel.removeRoleFromUser(userId, roleId);

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
};

/**
 * Generate a new password
 */
export const generatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is admin or superuser
    const isAdmin = await RoleModel.userIsAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const password = generateMemorablePassword(12);

    res.json({ password });
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ error: 'Failed to generate password' });
    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(userId, hashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
