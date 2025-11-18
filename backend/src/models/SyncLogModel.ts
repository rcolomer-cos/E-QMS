import { getConnection, sql } from '../config/database';

export interface SyncLog {
  id?: number;
  configurationId: number;
  runId: string;
  status: 'queued' | 'in_progress' | 'success' | 'partial' | 'failed' | 'cancelled' | 'timeout';
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  recordsFailed?: number;
  recordsConflicted?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  fromRecordId?: number;
  toRecordId?: number;
  resultMessage?: string;
  errorMessage?: string;
  errorStack?: string;
  apiCallsCount?: number;
  avgResponseTimeMs?: number;
  totalDataSizeBytes?: number;
  retryCount?: number;
  previousLogId?: number;
  triggeredBy: 'scheduled' | 'manual' | 'api' | 'webhook' | 'retry';
  triggeredByUserId?: number;
  serverHostname?: string;
  createdAt?: Date;
}

export class SyncLogModel {
  /**
   * Create a new sync log entry
   */
  static async create(log: SyncLog): Promise<SyncLog> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('configurationId', sql.Int, log.configurationId)
      .input('runId', sql.NVarChar, log.runId)
      .input('status', sql.NVarChar, log.status)
      .input('triggeredBy', sql.NVarChar, log.triggeredBy)
      .input('triggeredByUserId', sql.Int, log.triggeredByUserId)
      .input('serverHostname', sql.NVarChar, log.serverHostname)
      .input('retryCount', sql.Int, log.retryCount || 0)
      .input('previousLogId', sql.Int, log.previousLogId)
      .query(`
        INSERT INTO SyncLogs (
          configurationId, runId, status, triggeredBy, triggeredByUserId,
          serverHostname, retryCount, previousLogId
        )
        OUTPUT INSERTED.*
        VALUES (
          @configurationId, @runId, @status, @triggeredBy, @triggeredByUserId,
          @serverHostname, @retryCount, @previousLogId
        )
      `);

    return result.recordset[0];
  }

  /**
   * Find sync log by ID
   */
  static async findById(id: number): Promise<SyncLog | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM SyncLogs WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find sync log by run ID
   */
  static async findByRunId(runId: string): Promise<SyncLog | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('runId', sql.NVarChar, runId)
      .query('SELECT * FROM SyncLogs WHERE runId = @runId');

    return result.recordset[0] || null;
  }

  /**
   * Find all sync logs for a configuration
   */
  static async findByConfigurationId(
    configurationId: number,
    options?: {
      limit?: number;
      status?: string;
    }
  ): Promise<SyncLog[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM SyncLogs WHERE configurationId = @configurationId';
    request.input('configurationId', sql.Int, configurationId);

    if (options?.status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, options.status);
    }

    query += ' ORDER BY startedAt DESC';

    if (options?.limit) {
      query = `SELECT TOP ${options.limit} * FROM (${query}) AS logs`;
    }

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Find all sync logs with filters
   */
  static async findAll(filters?: {
    status?: string;
    triggeredBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SyncLog[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM SyncLogs WHERE 1=1';

    if (filters?.status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }

    if (filters?.triggeredBy) {
      query += ' AND triggeredBy = @triggeredBy';
      request.input('triggeredBy', sql.NVarChar, filters.triggeredBy);
    }

    if (filters?.startDate) {
      query += ' AND startedAt >= @startDate';
      request.input('startDate', sql.DateTime2, filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND startedAt <= @endDate';
      request.input('endDate', sql.DateTime2, filters.endDate);
    }

    query += ' ORDER BY startedAt DESC';

    if (filters?.limit) {
      query = `SELECT TOP ${filters.limit} * FROM (${query}) AS logs`;
    }

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update sync log
   */
  static async update(id: number, updates: Partial<SyncLog>): Promise<SyncLog | null> {
    const pool = await getConnection();
    const request = pool.request();

    const setClauses: string[] = [];

    if (updates.status !== undefined) {
      setClauses.push('status = @status');
      request.input('status', sql.NVarChar, updates.status);
    }
    if (updates.completedAt !== undefined) {
      setClauses.push('completedAt = @completedAt');
      request.input('completedAt', sql.DateTime2, updates.completedAt);
    }
    if (updates.durationSeconds !== undefined) {
      setClauses.push('durationSeconds = @durationSeconds');
      request.input('durationSeconds', sql.Int, updates.durationSeconds);
    }
    if (updates.recordsProcessed !== undefined) {
      setClauses.push('recordsProcessed = @recordsProcessed');
      request.input('recordsProcessed', sql.Int, updates.recordsProcessed);
    }
    if (updates.recordsCreated !== undefined) {
      setClauses.push('recordsCreated = @recordsCreated');
      request.input('recordsCreated', sql.Int, updates.recordsCreated);
    }
    if (updates.recordsUpdated !== undefined) {
      setClauses.push('recordsUpdated = @recordsUpdated');
      request.input('recordsUpdated', sql.Int, updates.recordsUpdated);
    }
    if (updates.recordsSkipped !== undefined) {
      setClauses.push('recordsSkipped = @recordsSkipped');
      request.input('recordsSkipped', sql.Int, updates.recordsSkipped);
    }
    if (updates.recordsFailed !== undefined) {
      setClauses.push('recordsFailed = @recordsFailed');
      request.input('recordsFailed', sql.Int, updates.recordsFailed);
    }
    if (updates.recordsConflicted !== undefined) {
      setClauses.push('recordsConflicted = @recordsConflicted');
      request.input('recordsConflicted', sql.Int, updates.recordsConflicted);
    }
    if (updates.fromTimestamp !== undefined) {
      setClauses.push('fromTimestamp = @fromTimestamp');
      request.input('fromTimestamp', sql.DateTime2, updates.fromTimestamp);
    }
    if (updates.toTimestamp !== undefined) {
      setClauses.push('toTimestamp = @toTimestamp');
      request.input('toTimestamp', sql.DateTime2, updates.toTimestamp);
    }
    if (updates.fromRecordId !== undefined) {
      setClauses.push('fromRecordId = @fromRecordId');
      request.input('fromRecordId', sql.Int, updates.fromRecordId);
    }
    if (updates.toRecordId !== undefined) {
      setClauses.push('toRecordId = @toRecordId');
      request.input('toRecordId', sql.Int, updates.toRecordId);
    }
    if (updates.resultMessage !== undefined) {
      setClauses.push('resultMessage = @resultMessage');
      request.input('resultMessage', sql.NVarChar, updates.resultMessage);
    }
    if (updates.errorMessage !== undefined) {
      setClauses.push('errorMessage = @errorMessage');
      request.input('errorMessage', sql.NVarChar, updates.errorMessage);
    }
    if (updates.errorStack !== undefined) {
      setClauses.push('errorStack = @errorStack');
      request.input('errorStack', sql.NVarChar, updates.errorStack);
    }
    if (updates.apiCallsCount !== undefined) {
      setClauses.push('apiCallsCount = @apiCallsCount');
      request.input('apiCallsCount', sql.Int, updates.apiCallsCount);
    }
    if (updates.avgResponseTimeMs !== undefined) {
      setClauses.push('avgResponseTimeMs = @avgResponseTimeMs');
      request.input('avgResponseTimeMs', sql.Int, updates.avgResponseTimeMs);
    }
    if (updates.totalDataSizeBytes !== undefined) {
      setClauses.push('totalDataSizeBytes = @totalDataSizeBytes');
      request.input('totalDataSizeBytes', sql.BigInt, updates.totalDataSizeBytes);
    }

    if (setClauses.length === 0) {
      return null;
    }

    request.input('id', sql.Int, id);
    const result = await request.query(`
      UPDATE SyncLogs
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    return result.recordset[0] || null;
  }

  /**
   * Complete sync log with final statistics
   */
  static async complete(
    id: number,
    status: 'success' | 'partial' | 'failed' | 'timeout',
    stats: {
      recordsProcessed?: number;
      recordsCreated?: number;
      recordsUpdated?: number;
      recordsSkipped?: number;
      recordsFailed?: number;
      recordsConflicted?: number;
      resultMessage?: string;
      errorMessage?: string;
      errorStack?: string;
      apiCallsCount?: number;
      avgResponseTimeMs?: number;
      totalDataSizeBytes?: number;
    }
  ): Promise<void> {
    const pool = await getConnection();
    const completedAt = new Date();

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('completedAt', sql.DateTime2, completedAt)
      .input('recordsProcessed', sql.Int, stats.recordsProcessed || 0)
      .input('recordsCreated', sql.Int, stats.recordsCreated || 0)
      .input('recordsUpdated', sql.Int, stats.recordsUpdated || 0)
      .input('recordsSkipped', sql.Int, stats.recordsSkipped || 0)
      .input('recordsFailed', sql.Int, stats.recordsFailed || 0)
      .input('recordsConflicted', sql.Int, stats.recordsConflicted || 0)
      .input('resultMessage', sql.NVarChar, stats.resultMessage)
      .input('errorMessage', sql.NVarChar, stats.errorMessage)
      .input('errorStack', sql.NVarChar, stats.errorStack)
      .input('apiCallsCount', sql.Int, stats.apiCallsCount || 0)
      .input('avgResponseTimeMs', sql.Int, stats.avgResponseTimeMs)
      .input('totalDataSizeBytes', sql.BigInt, stats.totalDataSizeBytes)
      .query(`
        UPDATE SyncLogs
        SET 
          status = @status,
          completedAt = @completedAt,
          durationSeconds = DATEDIFF(SECOND, startedAt, @completedAt),
          recordsProcessed = @recordsProcessed,
          recordsCreated = @recordsCreated,
          recordsUpdated = @recordsUpdated,
          recordsSkipped = @recordsSkipped,
          recordsFailed = @recordsFailed,
          recordsConflicted = @recordsConflicted,
          resultMessage = @resultMessage,
          errorMessage = @errorMessage,
          errorStack = @errorStack,
          apiCallsCount = @apiCallsCount,
          avgResponseTimeMs = @avgResponseTimeMs,
          totalDataSizeBytes = @totalDataSizeBytes
        WHERE id = @id
      `);
  }

  /**
   * Get sync statistics for a configuration
   */
  static async getStatistics(configurationId: number): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    partialRuns: number;
    avgDuration: number;
    totalRecordsProcessed: number;
    totalRecordsFailed: number;
    lastRun?: Date;
  }> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('configurationId', sql.Int, configurationId)
      .query(`
        SELECT 
          COUNT(*) as totalRuns,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successfulRuns,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedRuns,
          SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partialRuns,
          AVG(CAST(durationSeconds AS FLOAT)) as avgDuration,
          SUM(recordsProcessed) as totalRecordsProcessed,
          SUM(recordsFailed) as totalRecordsFailed,
          MAX(startedAt) as lastRun
        FROM SyncLogs
        WHERE configurationId = @configurationId
      `);

    return result.recordset[0];
  }
}
