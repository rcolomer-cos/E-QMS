import { Request, Response } from 'express';
import { SystemService } from '../services/systemService';
import { BackupService } from '../services/backupService';
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

/**
 * Create database backup
 */
export const createBackup = async (_req: Request, res: Response): Promise<void> => {
  try {
    const backupConfig = BackupService.getBackupConfig();
    const result = await BackupService.executeBackup(backupConfig);

    if (result.success) {
      res.json({
        message: 'Backup created successfully',
        backup: result,
      });
    } else {
      res.status(500).json({
        error: 'Backup failed',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

/**
 * List available backups
 */
export const listBackups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const backupConfig = BackupService.getBackupConfig();
    const backups = await BackupService.listBackups(
      backupConfig.backupPath,
      backupConfig.database
    );

    res.json({
      backups,
      backupPath: backupConfig.backupPath,
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { backupFile, replaceExisting } = req.body;
    const backupConfig = BackupService.getBackupConfig();

    const restoreConfig = {
      serverInstance: backupConfig.serverInstance,
      database: backupConfig.database,
      backupFile,
      replaceExisting: replaceExisting || false,
      username: backupConfig.username,
      password: backupConfig.password,
    };

    const result = await BackupService.executeRestore(restoreConfig);

    if (result.success) {
      res.json({
        message: 'Database restored successfully',
        restore: result,
      });
    } else {
      res.status(500).json({
        error: 'Restore failed',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
};

/**
 * Verify backup file
 */
export const verifyBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { backupFile } = req.body;
    const backupConfig = BackupService.getBackupConfig();

    const restoreConfig = {
      serverInstance: backupConfig.serverInstance,
      database: backupConfig.database,
      backupFile,
      verifyOnly: true,
      username: backupConfig.username,
      password: backupConfig.password,
    };

    const result = await BackupService.executeRestore(restoreConfig);

    if (result.success) {
      res.json({
        message: 'Backup file is valid',
        verified: true,
      });
    } else {
      res.status(400).json({
        error: 'Backup file verification failed',
        details: result.error,
        verified: false,
      });
    }
  } catch (error) {
    console.error('Verify backup error:', error);
    res.status(500).json({ error: 'Failed to verify backup' });
  }
};

/**
 * Delete backup file
 */
export const deleteBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { fileName } = req.body;
    const backupConfig = BackupService.getBackupConfig();

    const success = await BackupService.deleteBackup(
      backupConfig.backupPath,
      fileName
    );

    if (success) {
      res.json({
        message: 'Backup deleted successfully',
      });
    } else {
      res.status(404).json({
        error: 'Backup file not found or could not be deleted',
      });
    }
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
};
