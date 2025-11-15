import { Response } from 'express';
import { UserModel, User } from '../models/UserModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    
    // Remove password from response
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(sanitizedUser);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password, role, firstName, lastName, department } = req.body;

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const user: User = {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      department,
      active: true,
    };

    const userId = await UserModel.create(user);

    res.status(201).json({
      message: 'User created successfully',
      userId,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { email, role, firstName, lastName, department } = req.body;
    const updates: Partial<User> = {};

    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (department !== undefined) updates.department = department;

    await UserModel.update(id, updates);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Prevent users from deactivating themselves
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await UserModel.delete(id);

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};
