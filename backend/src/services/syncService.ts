import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { SyncConfigurationModel, SyncConfiguration } from '../models/SyncConfigurationModel';
import { SyncLogModel, SyncLog } from '../models/SyncLogModel';
import { SyncConflictModel, SyncConflict } from '../models/SyncConflictModel';
import { ErpAdapterService } from './erpAdapterService';
import { MesAdapterService } from './mesAdapterService';
import { DeltaDetectionService } from './deltaDetectionService';

export interface SyncResult {
  success: boolean;
  runId: string;
  status: 'success' | 'partial' | 'failed' | 'timeout';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  recordsConflicted: number;
  duration: number;
  message: string;
  errors?: string[];
}

export class SyncService {
  /**
   * Execute a sync run for a specific configuration
   */
  static async executeSyncRun(
    configurationId: number,
    triggeredBy: 'scheduled' | 'manual' | 'api',
    triggeredByUserId?: number
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const runId = uuidv4();

    // Fetch configuration
    const config = await SyncConfigurationModel.findById(configurationId);
    if (!config) {
      throw new Error(`Sync configuration ${configurationId} not found`);
    }

    if (!config.enabled) {
      throw new Error(`Sync configuration ${configurationId} is disabled`);
    }

    // Create log entry
    const log = await SyncLogModel.create({
      configurationId,
      runId,
      status: 'in_progress',
      triggeredBy,
      triggeredByUserId,
      serverHostname: os.hostname(),
    });

    try {
      // Update configuration status
      await SyncConfigurationModel.update(configurationId, {
        lastRunStatus: 'in_progress',
      });

      // Execute sync based on system type
      let syncResult: SyncResult;
      
      if (config.systemType === 'ERP') {
        syncResult = await ErpAdapterService.sync(config, log.id!, runId);
      } else if (config.systemType === 'MES') {
        syncResult = await MesAdapterService.sync(config, log.id!, runId);
      } else {
        throw new Error(`System type ${config.systemType} not yet implemented`);
      }

      // Calculate duration
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Complete log entry
      await SyncLogModel.complete(log.id!, syncResult.status, {
        recordsProcessed: syncResult.recordsProcessed,
        recordsCreated: syncResult.recordsCreated,
        recordsUpdated: syncResult.recordsUpdated,
        recordsSkipped: syncResult.recordsSkipped,
        recordsFailed: syncResult.recordsFailed,
        recordsConflicted: syncResult.recordsConflicted,
        resultMessage: syncResult.message,
        errorMessage: syncResult.errors?.join('\n'),
      });

      // Update configuration statistics
      // Map 'timeout' to 'failed' for configuration stats
      const statsStatus = syncResult.status === 'timeout' ? 'failed' : syncResult.status;
      await SyncConfigurationModel.updateSyncStats(configurationId, {
        status: statsStatus,
        duration,
        recordsProcessed: syncResult.recordsProcessed,
        recordsFailed: syncResult.recordsFailed,
        errorMessage: syncResult.errors?.join('\n'),
        nextRunAt: this.calculateNextRunTime(config),
      });

      // Update last sync timestamp for delta detection
      if (config.deltaEnabled && syncResult.status === 'success') {
        await SyncConfigurationModel.update(configurationId, {
          lastSyncTimestamp: new Date(),
        });
      }

      return {
        ...syncResult,
        duration,
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Complete log with error
      await SyncLogModel.complete(log.id!, 'failed', {
        errorMessage,
        errorStack,
      });

      // Update configuration
      await SyncConfigurationModel.updateSyncStats(configurationId, {
        status: 'failed',
        duration,
        recordsProcessed: 0,
        recordsFailed: 0,
        errorMessage,
        nextRunAt: this.calculateNextRunTime(config),
      });

      throw error;
    }
  }

  /**
   * Execute sync for all due configurations
   */
  static async executeScheduledSyncs(): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{ configurationId: number; success: boolean; message: string }>;
  }> {
    const dueConfigs = await SyncConfigurationModel.findDueForSync();
    
    const results: Array<{ configurationId: number; success: boolean; message: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const config of dueConfigs) {
      try {
        const result = await this.executeSyncRun(config.id!, 'scheduled');
        results.push({
          configurationId: config.id!,
          success: result.success,
          message: result.message,
        });
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          configurationId: config.id!,
          success: false,
          message,
        });
        failed++;
      }
    }

    return {
      totalProcessed: dueConfigs.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Calculate next run time based on schedule configuration
   */
  private static calculateNextRunTime(config: SyncConfiguration): Date | undefined {
    if (!config.enabled || config.scheduleType === 'manual') {
      return undefined;
    }

    const now = new Date();

    if (config.scheduleType === 'interval' && config.intervalMinutes) {
      return new Date(now.getTime() + config.intervalMinutes * 60 * 1000);
    }

    if (config.scheduleType === 'cron' && config.cronExpression) {
      // For cron, we'll set next run to 1 hour from now as a simple implementation
      // In production, you'd use a cron parser library
      return new Date(now.getTime() + 60 * 60 * 1000);
    }

    return undefined;
  }

  /**
   * Get sync status for a configuration
   */
  static async getSyncStatus(configurationId: number): Promise<{
    configuration: SyncConfiguration;
    recentLogs: SyncLog[];
    unresolvedConflicts: SyncConflict[];
    statistics: any;
  }> {
    const configuration = await SyncConfigurationModel.findById(configurationId);
    if (!configuration) {
      throw new Error(`Sync configuration ${configurationId} not found`);
    }

    const recentLogs = await SyncLogModel.findByConfigurationId(configurationId, { limit: 10 });
    const unresolvedConflicts = await SyncConflictModel.findByConfigurationId(
      configurationId,
      { status: 'unresolved', limit: 50 }
    );
    const statistics = await SyncLogModel.getStatistics(configurationId);

    return {
      configuration,
      recentLogs,
      unresolvedConflicts,
      statistics,
    };
  }

  /**
   * Retry a failed sync run
   */
  static async retrySyncRun(
    logId: number,
    triggeredByUserId: number
  ): Promise<SyncResult> {
    const originalLog = await SyncLogModel.findById(logId);
    if (!originalLog) {
      throw new Error(`Sync log ${logId} not found`);
    }

    const config = await SyncConfigurationModel.findById(originalLog.configurationId);
    if (!config) {
      throw new Error(`Sync configuration ${originalLog.configurationId} not found`);
    }

    // Check retry limit
    const retryCount = originalLog.retryCount || 0;
    const maxRetries = config.maxRetries || 3;
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded for this sync run`);
    }

    // Execute retry
    return await this.executeSyncRun(
      originalLog.configurationId,
      'manual',
      triggeredByUserId
    );
  }

  /**
   * Cancel an in-progress sync run
   */
  static async cancelSyncRun(logId: number): Promise<void> {
    await SyncLogModel.update(logId, {
      status: 'cancelled',
      completedAt: new Date(),
    });
  }

  /**
   * Get delta changes since last sync
   */
  static async getDeltaChanges(
    configurationId: number
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const config = await SyncConfigurationModel.findById(configurationId);
    if (!config) {
      throw new Error(`Sync configuration ${configurationId} not found`);
    }

    if (!config.deltaEnabled) {
      return {
        hasChanges: false,
        changeCount: 0,
        changes: [],
      };
    }

    return await DeltaDetectionService.detectChanges(config);
  }
}
