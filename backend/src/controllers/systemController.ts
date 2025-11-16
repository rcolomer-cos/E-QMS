import { Request, Response } from 'express';
import { SystemService } from '../services/systemService';
import { validationResult } from 'express-validator';
import { validatePasswordStrength } from '../utils/passwordGenerator';
import { config } from '../config';

/**
 * Check if system needs initialization
 */
export const checkInitialization = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await SystemService.needsInitialization();
    res.json(status);
  } catch (error) {
    console.error('Check initialization error:', error);
    res.status(500).json({ error: 'Failed to check system status' });
  }
};

/**
 * Create first superuser account
 */
export const createFirstSuperUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Check if system needs initialization
    const status = await SystemService.needsInitialization();
    if (!status.needsSetup) {
      res.status(400).json({ 
        error: 'System already initialized with a superuser' 
      });
      return;
    }

    const { email, password, firstName, lastName } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({ 
        error: 'Password does not meet strength requirements',
        details: passwordValidation.feedback,
      });
      return;
    }

    // Create first superuser
    const userId = await SystemService.createFirstSuperUser(
      email,
      password,
      firstName,
      lastName
    );

    res.status(201).json({
      message: 'First superuser created successfully',
      userId,
    });
  } catch (error) {
    console.error('Create first superuser error:', error);
    const details = config.nodeEnv === 'development'
      ? [ (error as any)?.message || 'Unknown error creating superuser' ]
      : undefined;
    res.status(500).json({ error: 'Failed to create first superuser', details });
  }
};

/**
 * Get system status
 */
export const getSystemStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await SystemService.getSystemStatus();
    res.json(status);
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
};
