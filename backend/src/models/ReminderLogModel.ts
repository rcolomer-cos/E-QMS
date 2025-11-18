import { getConnection, sql } from '../config/database';

export type ReminderType = 
  | 'training_expiry' 
  | 'equipment_calibration' 
  | 'equipment_maintenance' 
  | 'capa_deadline'
  | 'all_reminders';

export type ReminderStatus = 'success' | 'failed' | 'partial';

export interface ReminderLog {
  id?: number;
  reminderType: ReminderType;
  executionTime?: Date;
  status: ReminderStatus;
  itemsProcessed: number;
  itemsNotified: number;
  errorMessage?: string;
  executionDurationMs?: number;
  configuration?: string; // JSON string
  details?: string; // JSON string
  createdAt?: Date;
}

export interface ReminderLogFilters {
  reminderType?: ReminderType;
  status?: ReminderStatus;
  startDate?: Date;
  endDate?: Date;
}

export class ReminderLogModel {
  /**
   * Create a new reminder log entry
   */
  static async create(log: ReminderLog): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('reminderType', sql.NVarChar, log.reminderType)
      .input('executionTime', sql.DateTime, log.executionTime || new Date())
      .input('status', sql.NVarChar, log.status)
      .input('itemsProcessed', sql.Int, log.itemsProcessed)
      .input('itemsNotified', sql.Int, log.itemsNotified)
      .input('errorMessage', sql.NVarChar, log.errorMessage)
      .input('executionDurationMs', sql.Int, log.executionDurationMs)
      .input('configuration', sql.NVarChar, log.configuration)
      .input('details', sql.NVarChar, log.details)
      .query(`
        INSERT INTO ReminderLogs (
          reminderType, executionTime, status, itemsProcessed, 
          itemsNotified, errorMessage, executionDurationMs, 
          configuration, details
        )
        OUTPUT INSERTED.id
        VALUES (
          @reminderType, @executionTime, @status, @itemsProcessed, 
          @itemsNotified, @errorMessage, @executionDurationMs, 
          @configuration, @details
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Find reminder log by ID
   */
  static async findById(id: number): Promise<ReminderLog | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ReminderLogs WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find all reminder logs with optional filters
   */
  static async findAll(filters?: ReminderLogFilters, page = 1, limit = 50): Promise<{
    logs: ReminderLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pool = await getConnection();
    const request = pool.request();
    
    let whereConditions = '1=1';
    
    if (filters?.reminderType) {
      request.input('reminderType', sql.NVarChar, filters.reminderType);
      whereConditions += ' AND reminderType = @reminderType';
    }
    
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      whereConditions += ' AND status = @status';
    }
    
    if (filters?.startDate) {
      request.input('startDate', sql.DateTime, filters.startDate);
      whereConditions += ' AND executionTime >= @startDate';
    }
    
    if (filters?.endDate) {
      request.input('endDate', sql.DateTime, filters.endDate);
      whereConditions += ' AND executionTime <= @endDate';
    }

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total
      FROM ReminderLogs
      WHERE ${whereConditions}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated results
    const offset = (page - 1) * limit;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT *
      FROM ReminderLogs
      WHERE ${whereConditions}
      ORDER BY executionTime DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    return {
      logs: result.recordset,
      total,
      page,
      limit,
    };
  }

  /**
   * Get the most recent log for a specific reminder type
   */
  static async getLatestByType(reminderType: ReminderType): Promise<ReminderLog | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('reminderType', sql.NVarChar, reminderType)
      .query(`
        SELECT TOP 1 *
        FROM ReminderLogs
        WHERE reminderType = @reminderType
        ORDER BY executionTime DESC
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get reminder execution statistics
   */
  static async getStatistics(days = 30): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    partialExecutions: number;
    totalItemsProcessed: number;
    totalItemsNotified: number;
    averageDurationMs: number;
    byType: Array<{
      reminderType: ReminderType;
      count: number;
      successRate: number;
    }>;
  }> {
    const pool = await getConnection();
    const request = pool.request();
    request.input('days', sql.Int, days);

    // Get overall statistics
    const statsResult = await request.query(`
      SELECT 
        COUNT(*) as totalExecutions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successfulExecutions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedExecutions,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partialExecutions,
        SUM(itemsProcessed) as totalItemsProcessed,
        SUM(itemsNotified) as totalItemsNotified,
        AVG(CAST(executionDurationMs AS FLOAT)) as averageDurationMs
      FROM ReminderLogs
      WHERE executionTime >= DATEADD(day, -@days, GETDATE())
    `);

    // Get statistics by type
    const byTypeResult = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        SELECT 
          reminderType,
          COUNT(*) as count,
          CAST(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(*), 0) * 100 as successRate
        FROM ReminderLogs
        WHERE executionTime >= DATEADD(day, -@days, GETDATE())
        GROUP BY reminderType
      `);

    const stats = statsResult.recordset[0];

    return {
      totalExecutions: stats.totalExecutions || 0,
      successfulExecutions: stats.successfulExecutions || 0,
      failedExecutions: stats.failedExecutions || 0,
      partialExecutions: stats.partialExecutions || 0,
      totalItemsProcessed: stats.totalItemsProcessed || 0,
      totalItemsNotified: stats.totalItemsNotified || 0,
      averageDurationMs: Math.round(stats.averageDurationMs || 0),
      byType: byTypeResult.recordset.map(r => ({
        reminderType: r.reminderType,
        count: r.count,
        successRate: Math.round(r.successRate || 0),
      })),
    };
  }

  /**
   * Delete old reminder logs (cleanup)
   */
  static async deleteOlderThan(days: number): Promise<number> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('days', sql.Int, days)
      .query(`
        DELETE FROM ReminderLogs
        WHERE executionTime < DATEADD(day, -@days, GETDATE())
      `);

    return result.rowsAffected[0];
  }
}
