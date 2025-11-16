import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, CreateUserData } from '../models/UserModel';
import { RoleModel } from '../models/RoleModel';
import { config } from '../config';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { logAudit, AuditActionCategory, AuditAction } from '../services/auditLogService';

/**
 * Register a new user (admin/superuser function)
 * Note: This should be protected by authorization middleware
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, department, roleIds } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Validate roleIds
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      res.status(400).json({ error: 'At least one role must be assigned' });
      return;
    }

    // Create user data
    const userData: CreateUserData = {
      email,
      password,
      firstName,
      lastName,
      department,
      roleIds,
      createdBy: (req as AuthRequest).user?.id || 0, // Will be 0 for initial superuser
      mustChangePassword: false,
    };

    const userId = await UserModel.create(userData);

    res.status(201).json({
      message: 'User registered successfully',
      userId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
      // Log failed login attempt
      await logAudit({
        req,
        action: AuditAction.LOGIN,
        actionCategory: AuditActionCategory.AUTHENTICATION,
        actionDescription: `Failed login attempt for ${email}`,
        entityType: 'User',
        entityIdentifier: email,
        success: false,
        errorMessage: 'Invalid credentials',
        statusCode: 401,
      });

      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    await UserModel.updateLastLogin(user.id!);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roleNames || [],
        roleIds: user.roles?.map(r => r.id) || [],
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    // Log successful login
    await logAudit({
      req,
      action: AuditAction.LOGIN,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `User logged in successfully`,
      entityType: 'User',
      entityId: user.id,
      entityIdentifier: email,
      success: true,
      statusCode: 200,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        roles: user.roles,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

/**
 * Get current user profile
 */
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

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      roles: user.roles,
      roleNames: user.roleNames,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Check if system has any superusers (for bootstrap)
 */
export const checkSuperusers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hasSuperusers = await UserModel.hasSuperusers();
    res.json({ hasSuperusers });
  } catch (error) {
    console.error('Check superusers error:', error);
    res.status(500).json({ error: 'Failed to check superusers' });
  }
};

/**
 * Create initial superuser (only if no superusers exist)
 */
export const createInitialSuperuser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Check if superusers already exist
    const hasSuperusers = await UserModel.hasSuperusers();
    if (hasSuperusers) {
      res.status(403).json({ error: 'Superusers already exist in the system' });
      return;
    }

    const { email, password, firstName, lastName } = req.body;

    // Get superuser role
    const superuserRole = await RoleModel.findByName('superuser');
    if (!superuserRole) {
      res.status(500).json({ error: 'Superuser role not found in database' });
      return;
    }

    // Create initial superuser
    const userData: CreateUserData = {
      email,
      password,
      firstName,
      lastName,
      roleIds: [superuserRole.id],
      createdBy: 0, // System created
      mustChangePassword: false,
    };

    const userId = await UserModel.create(userData);

    res.status(201).json({
      message: 'Initial superuser created successfully',
      userId,
    });
  } catch (error) {
    console.error('Create initial superuser error:', error);
    res.status(500).json({ error: 'Failed to create initial superuser' });
  }
};
