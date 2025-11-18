import { getConnection, sql } from '../config/database';

export interface SyncConfiguration {
  id?: number;
  name: string;
  description?: string;
  systemType: 'ERP' | 'MES' | 'WMS' | 'CRM' | 'PLM' | 'Other';
  systemName: string;
  connectionString?: string;
  apiEndpoint?: string;
  authType?: 'basic' | 'oauth' | 'apikey' | 'windows' | 'certificate' | 'none';
  authCredentials?: string;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  syncType: 'full' | 'delta' | 'incremental';
  entityType: 'equipment' | 'suppliers' | 'orders' | 'inventory' | 'employees' | 'customers' | 'products' | 'processes' | 'quality_records' | 'inspections' | 'ncr' | 'capa';
  enabled?: boolean;
  scheduleType?: 'manual' | 'cron' | 'interval';
  cronExpression?: string;
  intervalMinutes?: number;
  deltaEnabled?: boolean;
  deltaField?: string;
  lastSyncTimestamp?: Date;
  lastSyncRecordId?: number;
  conflictStrategy?: 'log' | 'source_wins' | 'target_wins' | 'manual' | 'newest_wins' | 'skip';
  mappingConfigJson?: string;
  batchSize?: number;
  timeoutSeconds?: number;
  maxRetries?: number;
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'partial' | 'cancelled' | 'in_progress';
  lastRunDuration?: number;
  lastRunRecordsProcessed?: number;
  lastRunRecordsFailed?: number;
  lastRunErrorMessage?: string;
  nextRunAt?: Date;
  totalRunsCount?: number;
  successfulRunsCount?: number;
  failedRunsCount?: number;
  totalRecordsProcessed?: number;
  totalRecordsFailed?: number;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deactivatedAt?: Date;
  deactivatedBy?: number;
}

export class SyncConfigurationModel {
  /**
   * Create a new sync configuration
   */
  static async create(config: SyncConfiguration): Promise<SyncConfiguration> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, config.name)
      .input('description', sql.NVarChar, config.description)
      .input('systemType', sql.NVarChar, config.systemType)
      .input('systemName', sql.NVarChar, config.systemName)
      .input('connectionString', sql.NVarChar, config.connectionString)
      .input('apiEndpoint', sql.NVarChar, config.apiEndpoint)
      .input('authType', sql.NVarChar, config.authType)
      .input('authCredentials', sql.NVarChar, config.authCredentials)
      .input('syncDirection', sql.NVarChar, config.syncDirection)
      .input('syncType', sql.NVarChar, config.syncType)
      .input('entityType', sql.NVarChar, config.entityType)
      .input('enabled', sql.Bit, config.enabled ?? true)
      .input('scheduleType', sql.NVarChar, config.scheduleType || 'manual')
      .input('cronExpression', sql.NVarChar, config.cronExpression)
      .input('intervalMinutes', sql.Int, config.intervalMinutes)
      .input('deltaEnabled', sql.Bit, config.deltaEnabled ?? true)
      .input('deltaField', sql.NVarChar, config.deltaField)
      .input('conflictStrategy', sql.NVarChar, config.conflictStrategy || 'log')
      .input('mappingConfigJson', sql.NVarChar, config.mappingConfigJson)
      .input('batchSize', sql.Int, config.batchSize || 100)
      .input('timeoutSeconds', sql.Int, config.timeoutSeconds || 300)
      .input('maxRetries', sql.Int, config.maxRetries || 3)
      .input('createdBy', sql.Int, config.createdBy)
      .query(`
        INSERT INTO SyncConfigurations (
          name, description, systemType, systemName, connectionString, apiEndpoint,
          authType, authCredentials, syncDirection, syncType, entityType, enabled,
          scheduleType, cronExpression, intervalMinutes, deltaEnabled, deltaField,
          conflictStrategy, mappingConfigJson, batchSize, timeoutSeconds, maxRetries, createdBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @description, @systemType, @systemName, @connectionString, @apiEndpoint,
          @authType, @authCredentials, @syncDirection, @syncType, @entityType, @enabled,
          @scheduleType, @cronExpression, @intervalMinutes, @deltaEnabled, @deltaField,
          @conflictStrategy, @mappingConfigJson, @batchSize, @timeoutSeconds, @maxRetries, @createdBy
        )
      `);

    return result.recordset[0];
  }

  /**
   * Find sync configuration by ID
   */
  static async findById(id: number): Promise<SyncConfiguration | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM SyncConfigurations WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find all sync configurations
   */
  static async findAll(filters?: {
    enabled?: boolean;
    systemType?: string;
    entityType?: string;
    scheduleType?: string;
  }): Promise<SyncConfiguration[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM SyncConfigurations WHERE 1=1';

    if (filters?.enabled !== undefined) {
      query += ' AND enabled = @enabled';
      request.input('enabled', sql.Bit, filters.enabled);
    }

    if (filters?.systemType) {
      query += ' AND systemType = @systemType';
      request.input('systemType', sql.NVarChar, filters.systemType);
    }

    if (filters?.entityType) {
      query += ' AND entityType = @entityType';
      request.input('entityType', sql.NVarChar, filters.entityType);
    }

    if (filters?.scheduleType) {
      query += ' AND scheduleType = @scheduleType';
      request.input('scheduleType', sql.NVarChar, filters.scheduleType);
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get configurations due for sync
   */
  static async findDueForSync(): Promise<SyncConfiguration[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM SyncConfigurations
        WHERE enabled = 1
          AND scheduleType IN ('cron', 'interval')
          AND (nextRunAt IS NULL OR nextRunAt <= GETDATE())
          AND (lastRunStatus IS NULL OR lastRunStatus NOT IN ('in_progress', 'queued'))
        ORDER BY nextRunAt ASC
      `);

    return result.recordset;
  }

  /**
   * Update sync configuration
   */
  static async update(id: number, updates: Partial<SyncConfiguration>): Promise<SyncConfiguration | null> {
    const pool = await getConnection();
    const request = pool.request();

    const setClauses: string[] = [];
    
    if (updates.name !== undefined) {
      setClauses.push('name = @name');
      request.input('name', sql.NVarChar, updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = @description');
      request.input('description', sql.NVarChar, updates.description);
    }
    if (updates.systemType !== undefined) {
      setClauses.push('systemType = @systemType');
      request.input('systemType', sql.NVarChar, updates.systemType);
    }
    if (updates.systemName !== undefined) {
      setClauses.push('systemName = @systemName');
      request.input('systemName', sql.NVarChar, updates.systemName);
    }
    if (updates.connectionString !== undefined) {
      setClauses.push('connectionString = @connectionString');
      request.input('connectionString', sql.NVarChar, updates.connectionString);
    }
    if (updates.apiEndpoint !== undefined) {
      setClauses.push('apiEndpoint = @apiEndpoint');
      request.input('apiEndpoint', sql.NVarChar, updates.apiEndpoint);
    }
    if (updates.authType !== undefined) {
      setClauses.push('authType = @authType');
      request.input('authType', sql.NVarChar, updates.authType);
    }
    if (updates.authCredentials !== undefined) {
      setClauses.push('authCredentials = @authCredentials');
      request.input('authCredentials', sql.NVarChar, updates.authCredentials);
    }
    if (updates.syncDirection !== undefined) {
      setClauses.push('syncDirection = @syncDirection');
      request.input('syncDirection', sql.NVarChar, updates.syncDirection);
    }
    if (updates.syncType !== undefined) {
      setClauses.push('syncType = @syncType');
      request.input('syncType', sql.NVarChar, updates.syncType);
    }
    if (updates.entityType !== undefined) {
      setClauses.push('entityType = @entityType');
      request.input('entityType', sql.NVarChar, updates.entityType);
    }
    if (updates.enabled !== undefined) {
      setClauses.push('enabled = @enabled');
      request.input('enabled', sql.Bit, updates.enabled);
    }
    if (updates.scheduleType !== undefined) {
      setClauses.push('scheduleType = @scheduleType');
      request.input('scheduleType', sql.NVarChar, updates.scheduleType);
    }
    if (updates.cronExpression !== undefined) {
      setClauses.push('cronExpression = @cronExpression');
      request.input('cronExpression', sql.NVarChar, updates.cronExpression);
    }
    if (updates.intervalMinutes !== undefined) {
      setClauses.push('intervalMinutes = @intervalMinutes');
      request.input('intervalMinutes', sql.Int, updates.intervalMinutes);
    }
    if (updates.deltaEnabled !== undefined) {
      setClauses.push('deltaEnabled = @deltaEnabled');
      request.input('deltaEnabled', sql.Bit, updates.deltaEnabled);
    }
    if (updates.deltaField !== undefined) {
      setClauses.push('deltaField = @deltaField');
      request.input('deltaField', sql.NVarChar, updates.deltaField);
    }
    if (updates.lastSyncTimestamp !== undefined) {
      setClauses.push('lastSyncTimestamp = @lastSyncTimestamp');
      request.input('lastSyncTimestamp', sql.DateTime2, updates.lastSyncTimestamp);
    }
    if (updates.lastSyncRecordId !== undefined) {
      setClauses.push('lastSyncRecordId = @lastSyncRecordId');
      request.input('lastSyncRecordId', sql.Int, updates.lastSyncRecordId);
    }
    if (updates.conflictStrategy !== undefined) {
      setClauses.push('conflictStrategy = @conflictStrategy');
      request.input('conflictStrategy', sql.NVarChar, updates.conflictStrategy);
    }
    if (updates.mappingConfigJson !== undefined) {
      setClauses.push('mappingConfigJson = @mappingConfigJson');
      request.input('mappingConfigJson', sql.NVarChar, updates.mappingConfigJson);
    }
    if (updates.batchSize !== undefined) {
      setClauses.push('batchSize = @batchSize');
      request.input('batchSize', sql.Int, updates.batchSize);
    }
    if (updates.timeoutSeconds !== undefined) {
      setClauses.push('timeoutSeconds = @timeoutSeconds');
      request.input('timeoutSeconds', sql.Int, updates.timeoutSeconds);
    }
    if (updates.maxRetries !== undefined) {
      setClauses.push('maxRetries = @maxRetries');
      request.input('maxRetries', sql.Int, updates.maxRetries);
    }
    if (updates.lastRunAt !== undefined) {
      setClauses.push('lastRunAt = @lastRunAt');
      request.input('lastRunAt', sql.DateTime2, updates.lastRunAt);
    }
    if (updates.lastRunStatus !== undefined) {
      setClauses.push('lastRunStatus = @lastRunStatus');
      request.input('lastRunStatus', sql.NVarChar, updates.lastRunStatus);
    }
    if (updates.lastRunDuration !== undefined) {
      setClauses.push('lastRunDuration = @lastRunDuration');
      request.input('lastRunDuration', sql.Int, updates.lastRunDuration);
    }
    if (updates.lastRunRecordsProcessed !== undefined) {
      setClauses.push('lastRunRecordsProcessed = @lastRunRecordsProcessed');
      request.input('lastRunRecordsProcessed', sql.Int, updates.lastRunRecordsProcessed);
    }
    if (updates.lastRunRecordsFailed !== undefined) {
      setClauses.push('lastRunRecordsFailed = @lastRunRecordsFailed');
      request.input('lastRunRecordsFailed', sql.Int, updates.lastRunRecordsFailed);
    }
    if (updates.lastRunErrorMessage !== undefined) {
      setClauses.push('lastRunErrorMessage = @lastRunErrorMessage');
      request.input('lastRunErrorMessage', sql.NVarChar, updates.lastRunErrorMessage);
    }
    if (updates.nextRunAt !== undefined) {
      setClauses.push('nextRunAt = @nextRunAt');
      request.input('nextRunAt', sql.DateTime2, updates.nextRunAt);
    }
    if (updates.totalRunsCount !== undefined) {
      setClauses.push('totalRunsCount = @totalRunsCount');
      request.input('totalRunsCount', sql.Int, updates.totalRunsCount);
    }
    if (updates.successfulRunsCount !== undefined) {
      setClauses.push('successfulRunsCount = @successfulRunsCount');
      request.input('successfulRunsCount', sql.Int, updates.successfulRunsCount);
    }
    if (updates.failedRunsCount !== undefined) {
      setClauses.push('failedRunsCount = @failedRunsCount');
      request.input('failedRunsCount', sql.Int, updates.failedRunsCount);
    }
    if (updates.totalRecordsProcessed !== undefined) {
      setClauses.push('totalRecordsProcessed = @totalRecordsProcessed');
      request.input('totalRecordsProcessed', sql.Int, updates.totalRecordsProcessed);
    }
    if (updates.totalRecordsFailed !== undefined) {
      setClauses.push('totalRecordsFailed = @totalRecordsFailed');
      request.input('totalRecordsFailed', sql.Int, updates.totalRecordsFailed);
    }
    if (updates.deactivatedAt !== undefined) {
      setClauses.push('deactivatedAt = @deactivatedAt');
      request.input('deactivatedAt', sql.DateTime2, updates.deactivatedAt);
    }
    if (updates.deactivatedBy !== undefined) {
      setClauses.push('deactivatedBy = @deactivatedBy');
      request.input('deactivatedBy', sql.Int, updates.deactivatedBy);
    }

    if (setClauses.length === 0) {
      return null;
    }

    setClauses.push('updatedAt = GETDATE()');

    request.input('id', sql.Int, id);
    const result = await request.query(`
      UPDATE SyncConfigurations
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    return result.recordset[0] || null;
  }

  /**
   * Delete sync configuration
   */
  static async delete(id: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM SyncConfigurations WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Update sync statistics after run
   */
  static async updateSyncStats(
    id: number,
    stats: {
      status: 'success' | 'failed' | 'partial';
      duration: number;
      recordsProcessed: number;
      recordsFailed: number;
      errorMessage?: string;
      nextRunAt?: Date;
    }
  ): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, stats.status)
      .input('duration', sql.Int, stats.duration)
      .input('recordsProcessed', sql.Int, stats.recordsProcessed)
      .input('recordsFailed', sql.Int, stats.recordsFailed)
      .input('errorMessage', sql.NVarChar, stats.errorMessage)
      .input('nextRunAt', sql.DateTime2, stats.nextRunAt)
      .query(`
        UPDATE SyncConfigurations
        SET 
          lastRunAt = GETDATE(),
          lastRunStatus = @status,
          lastRunDuration = @duration,
          lastRunRecordsProcessed = @recordsProcessed,
          lastRunRecordsFailed = @recordsFailed,
          lastRunErrorMessage = @errorMessage,
          nextRunAt = @nextRunAt,
          totalRunsCount = totalRunsCount + 1,
          successfulRunsCount = successfulRunsCount + CASE WHEN @status = 'success' THEN 1 ELSE 0 END,
          failedRunsCount = failedRunsCount + CASE WHEN @status = 'failed' THEN 1 ELSE 0 END,
          totalRecordsProcessed = totalRecordsProcessed + @recordsProcessed,
          totalRecordsFailed = totalRecordsFailed + @recordsFailed,
          updatedAt = GETDATE()
        WHERE id = @id
      `);
  }
}
