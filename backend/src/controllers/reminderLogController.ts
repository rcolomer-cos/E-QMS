import { Request, Response } from 'express';
import { ReminderLogModel, ReminderLogFilters } from '../models/ReminderLogModel';
import { SchedulerService } from '../services/schedulerService';
import { AuthRequest } from '../types';

/**
 * Get all reminder logs with pagination and filtering
 */
export const getReminderLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const filters: ReminderLogFilters = {};
    
    if (req.query.reminderType) {
      filters.reminderType = req.query.reminderType as any;
    }
    
    if (req.query.status) {
      filters.status = req.query.status as any;
    }
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await ReminderLogModel.findAll(filters, page, limit);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reminder logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a specific reminder log by ID
 */
export const getReminderLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await ReminderLogModel.findById(parseInt(id));

    if (!log) {
      res.status(404).json({
        success: false,
        error: 'Reminder log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching reminder log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reminder log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get the latest log for a specific reminder type
 */
export const getLatestLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const log = await ReminderLogModel.getLatestByType(type as any);

    if (!log) {
      res.status(404).json({
        success: false,
        error: 'No logs found for this reminder type',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching latest reminder log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest reminder log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get reminder execution statistics
 */
export const getReminderStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await ReminderLogModel.getStatistics(days);

    res.json({
      success: true,
      data: stats,
      period: `Last ${days} days`,
    });
  } catch (error) {
    console.error('Error fetching reminder statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reminder statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Manually trigger reminder tasks (Admin only)
 */
export const triggerReminders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Configuration from request body (optional)
    const config = req.body.config;
    
    // Run reminders asynchronously
    SchedulerService.runNow(config)
      .then(() => {
        console.log('Manual reminder execution completed');
      })
      .catch(error => {
        console.error('Error in manual reminder execution:', error);
      });

    res.json({
      success: true,
      message: 'Reminder tasks triggered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger reminders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get scheduler status (Admin only)
 */
export const getSchedulerStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = SchedulerService.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete old reminder logs (Admin only)
 */
export const cleanupOldLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const deletedCount = await ReminderLogModel.deleteOlderThan(days);

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old reminder logs`,
      deletedCount,
      olderThanDays: days,
    });
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
