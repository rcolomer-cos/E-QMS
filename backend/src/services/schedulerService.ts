import * as cron from 'node-cron';
import { ReminderService, ReminderConfig } from './reminderService';

export interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string; // e.g., '0 8 * * *' for daily at 8 AM
  reminderConfig?: ReminderConfig;
}

export class SchedulerService {
  private static tasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();
  private static isInitialized = false;

  /**
   * Initialize the scheduler with default configuration
   */
  static initialize(config?: SchedulerConfig): void {
    if (this.isInitialized) {
      console.log('Scheduler already initialized');
      return;
    }

    const defaultConfig: SchedulerConfig = {
      enabled: process.env.SCHEDULER_ENABLED !== 'false', // Enabled by default
      cronExpression: process.env.SCHEDULER_CRON || '0 8 * * *', // Daily at 8 AM by default
      reminderConfig: {
        trainingExpiryDays: parseInt(process.env.REMINDER_TRAINING_DAYS || '30'),
        equipmentCalibrationDays: parseInt(process.env.REMINDER_CALIBRATION_DAYS || '30'),
        equipmentMaintenanceDays: parseInt(process.env.REMINDER_MAINTENANCE_DAYS || '30'),
        capaDeadlineDays: parseInt(process.env.REMINDER_CAPA_DAYS || '7'),
      },
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (!finalConfig.enabled) {
      console.log('Scheduler is disabled');
      return;
    }

    // Validate cron expression
    if (!cron.validate(finalConfig.cronExpression)) {
      console.error(`Invalid cron expression: ${finalConfig.cronExpression}`);
      return;
    }

    console.log(`Initializing scheduler with cron: ${finalConfig.cronExpression}`);
    
    this.scheduleReminders(finalConfig);
    this.scheduleSyncJobs();
    this.scheduleWebhookRetries();
    this.isInitialized = true;
    
    console.log('Scheduler initialized successfully');
  }

  /**
   * Schedule reminder tasks
   */
  private static scheduleReminders(config: SchedulerConfig): void {
    const task = cron.schedule(
      config.cronExpression,
      async () => {
        console.log(`[${new Date().toISOString()}] Running scheduled reminder tasks...`);
        
        try {
          const result = await ReminderService.processAllReminders(config.reminderConfig);
          
          console.log(`[${new Date().toISOString()}] Reminder tasks completed:`, {
            success: result.success,
            training: result.results.training.itemsProcessed,
            calibration: result.results.calibration.itemsProcessed,
            maintenance: result.results.maintenance.itemsProcessed,
            capa: result.results.capa.itemsProcessed,
          });
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error running reminder tasks:`, error);
        }
      },
      {
        timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
      }
    );

    this.tasks.set('reminders', task);
    console.log('Reminder tasks scheduled');
  }

  /**
   * Schedule sync jobs
   */
  private static scheduleSyncJobs(): void {
    // Check for sync jobs every 5 minutes
    const task = cron.schedule(
      '*/5 * * * *',
      async () => {
        console.log(`[${new Date().toISOString()}] Checking for due sync jobs...`);
        
        try {
          const { SyncService } = await import('./syncService');
          const result = await SyncService.executeScheduledSyncs();
          
          console.log(`[${new Date().toISOString()}] Sync jobs completed:`, {
            totalProcessed: result.totalProcessed,
            successful: result.successful,
            failed: result.failed,
          });
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error running sync jobs:`, error);
        }
      },
      {
        timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
      }
    );

    this.tasks.set('sync', task);
    console.log('Sync jobs scheduled (check every 5 minutes)');
  }

  /**
   * Schedule webhook retry processing
   */
  private static scheduleWebhookRetries(): void {
    // Process webhook retries every 2 minutes
    const task = cron.schedule(
      '*/2 * * * *',
      async () => {
        console.log(`[${new Date().toISOString()}] Processing webhook retries...`);
        
        try {
          const { WebhookService } = await import('./webhookService');
          await WebhookService.processRetries();
          
          console.log(`[${new Date().toISOString()}] Webhook retry processing completed`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error processing webhook retries:`, error);
        }
      },
      {
        timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
      }
    );

    this.tasks.set('webhookRetries', task);
    console.log('Webhook retry processing scheduled (check every 2 minutes)');
  }

  /**
   * Manually trigger reminder tasks (for testing or manual execution)
   */
  static async runNow(reminderConfig?: ReminderConfig): Promise<void> {
    console.log(`[${new Date().toISOString()}] Manually running reminder tasks...`);
    
    try {
      const result = await ReminderService.processAllReminders(reminderConfig);
      
      console.log(`[${new Date().toISOString()}] Manual reminder tasks completed:`, {
        success: result.success,
        training: result.results.training.itemsProcessed,
        calibration: result.results.calibration.itemsProcessed,
        maintenance: result.results.maintenance.itemsProcessed,
        capa: result.results.capa.itemsProcessed,
      });
      
      return;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error running manual reminder tasks:`, error);
      throw error;
    }
  }

  /**
   * Stop all scheduled tasks
   */
  static stopAll(): void {
    console.log('Stopping all scheduled tasks...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    
    this.tasks.clear();
    this.isInitialized = false;
    
    console.log('All scheduled tasks stopped');
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    initialized: boolean;
    activeTasks: string[];
    configuration: {
      enabled: boolean;
      cronExpression: string;
      timezone: string;
    };
  } {
    return {
      initialized: this.isInitialized,
      activeTasks: Array.from(this.tasks.keys()),
      configuration: {
        enabled: process.env.SCHEDULER_ENABLED !== 'false',
        cronExpression: process.env.SCHEDULER_CRON || '0 8 * * *',
        timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
      },
    };
  }

  /**
   * Restart the scheduler with new configuration
   */
  static restart(config?: SchedulerConfig): void {
    console.log('Restarting scheduler...');
    this.stopAll();
    this.initialize(config);
  }
}
