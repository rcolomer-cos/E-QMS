import { Response } from 'express';
import { UserModel } from '../models/UserModel';
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

    // Non-admins must provide current password
    if (!isAdmin) {
      const isValidPassword = await UserModel.verifyPassword(user, currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(userId, hashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
