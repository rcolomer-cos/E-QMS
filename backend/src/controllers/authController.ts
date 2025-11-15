import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/UserModel';
import { RoleModel } from '../models/RoleModel';
import { config } from '../config';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, department } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    const user: User = {
      email,
      password,
      firstName,
      lastName,
      department,
      active: true,
      mustChangePassword: false,
    };

    const userId = await UserModel.create(user);

    res.status(201).json({
      message: 'User registered successfully',
      userId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Get user roles
    const roles = await RoleModel.getUserRoles(user.id!);
    const roleNames = roles.map(r => r.name);

    // Update last login
    await UserModel.updateLastLogin(user.id!);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: roleNames,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        roles: roleNames,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user roles
    const roles = await RoleModel.getUserRoles(req.user.id);
    const roleNames = roles.map(r => r.name);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      roles: roleNames,
      lastLoginAt: user.lastLoginAt,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
