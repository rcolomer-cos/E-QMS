import { Response } from 'express';
import { AuthRequest } from '../types';
import { SyncConfigurationModel } from '../models/SyncConfigurationModel';
import { SyncLogModel } from '../models/SyncLogModel';
import { SyncConflictModel } from '../models/SyncConflictModel';
import { SyncService } from '../services/syncService';

/**
 * Get all sync configurations
 */
export const getAllConfigurations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enabled, systemType, entityType, scheduleType } = req.query;

    const filters: any = {};
    if (enabled !== undefined) filters.enabled = enabled === 'true';
    if (systemType) filters.systemType = systemType as string;
    if (entityType) filters.entityType = entityType as string;
    if (scheduleType) filters.scheduleType = scheduleType as string;

    const configurations = await SyncConfigurationModel.findAll(filters);

    res.json({
      success: true,
      count: configurations.length,
      configurations,
    });
  } catch (error) {
    console.error('Error fetching sync configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync configurations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get sync configuration by ID
 */
export const getConfigurationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const configuration = await SyncConfigurationModel.findById(parseInt(id));

    if (!configuration) {
      res.status(404).json({
        success: false,
        message: 'Sync configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      configuration,
    });
  } catch (error) {
    console.error('Error fetching sync configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create a new sync configuration
 */
export const createConfiguration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const configData = {
      ...req.body,
      createdBy: userId,
    };

    const configuration = await SyncConfigurationModel.create(configData);

    res.status(201).json({
      success: true,
      message: 'Sync configuration created successfully',
      configuration,
    });
  } catch (error) {
    console.error('Error creating sync configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sync configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update sync configuration
 */
export const updateConfiguration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const configuration = await SyncConfigurationModel.update(parseInt(id), updates);

    if (!configuration) {
      res.status(404).json({
        success: false,
        message: 'Sync configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Sync configuration updated successfully',
      configuration,
    });
  } catch (error) {
    console.error('Error updating sync configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sync configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete sync configuration
 */
export const deleteConfiguration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await SyncConfigurationModel.delete(parseInt(id));

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Sync configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Sync configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting sync configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sync configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Execute a sync run manually
 */
export const executeSyncRun = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await SyncService.executeSyncRun(
      parseInt(id),
      'manual',
      userId
    );

    res.json({
      success: result.success,
      message: result.message,
      result,
    });
  } catch (error) {
    console.error('Error executing sync run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute sync run',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get sync status for a configuration
 */
export const getSyncStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const status = await SyncService.getSyncStatus(parseInt(id));

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get sync logs for a configuration
 */
export const getSyncLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit, status } = req.query;

    const options: any = {};
    if (limit) options.limit = parseInt(limit as string);
    if (status) options.status = status as string;

    const logs = await SyncLogModel.findByConfigurationId(parseInt(id), options);

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get sync conflicts for a configuration
 */
export const getSyncConflicts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, severity, entityType, requiresManualReview, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (severity) filters.severity = severity as string;
    if (entityType) filters.entityType = entityType as string;
    if (requiresManualReview !== undefined) filters.requiresManualReview = requiresManualReview === 'true';
    if (limit) filters.limit = parseInt(limit as string);

    const conflicts = await SyncConflictModel.findByConfigurationId(parseInt(id), filters);

    res.json({
      success: true,
      count: conflicts.length,
      conflicts,
    });
  } catch (error) {
    console.error('Error fetching sync conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync conflicts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Resolve a sync conflict
 */
export const resolveConflict = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conflictId } = req.params;
    const { resolution, resolvedValue, resolutionNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const conflict = await SyncConflictModel.resolve(parseInt(conflictId), {
      resolution,
      resolvedValue,
      resolvedBy: userId,
      resolutionNotes,
    });

    if (!conflict) {
      res.status(404).json({
        success: false,
        message: 'Conflict not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Conflict resolved successfully',
      conflict,
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve conflict',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get delta changes for a configuration
 */
export const getDeltaChanges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const changes = await SyncService.getDeltaChanges(parseInt(id));

    res.json({
      success: true,
      changes,
    });
  } catch (error) {
    console.error('Error fetching delta changes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delta changes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Retry a failed sync run
 */
export const retrySyncRun = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { logId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await SyncService.retrySyncRun(parseInt(logId), userId);

    res.json({
      success: result.success,
      message: result.message,
      result,
    });
  } catch (error) {
    console.error('Error retrying sync run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry sync run',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
