import { getConnection, sql } from '../config/database';

export interface SyncConflict {
  id?: number;
  configurationId: number;
  logId: number;
  conflictType: 'data_mismatch' | 'duplicate_record' | 'missing_reference' | 'validation_error' | 'concurrent_modification' | 'version_conflict' | 'constraint_violation' | 'mapping_error' | 'business_rule_violation' | 'data_integrity';
  entityType: string;
  entityId: string;
  externalEntityId?: string;
  fieldName?: string;
  sourceValue?: string;
  targetValue?: string;
  sourceTimestamp?: Date;
  targetTimestamp?: Date;
  status?: 'unresolved' | 'resolved' | 'ignored' | 'escalated' | 'auto_resolved';
  resolution?: 'source_wins' | 'target_wins' | 'manual_merge' | 'custom_value' | 'ignored' | 'newest_wins' | 'oldest_wins';
  resolvedValue?: string;
  resolvedAt?: Date;
  resolvedBy?: number;
  resolutionNotes?: string;
  autoResolveAttempted?: boolean;
  autoResolveStrategy?: 'source_wins' | 'target_wins' | 'newest_wins' | 'oldest_wins' | 'none';
  autoResolveSuccess?: boolean;
  autoResolveReason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  impactAssessment?: string;
  requiresManualReview?: boolean;
  contextData?: string;
  errorMessage?: string;
  detectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SyncConflictModel {
  /**
   * Create a new sync conflict
   */
  static async create(conflict: SyncConflict): Promise<SyncConflict> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('configurationId', sql.Int, conflict.configurationId)
      .input('logId', sql.Int, conflict.logId)
      .input('conflictType', sql.NVarChar, conflict.conflictType)
      .input('entityType', sql.NVarChar, conflict.entityType)
      .input('entityId', sql.NVarChar, conflict.entityId)
      .input('externalEntityId', sql.NVarChar, conflict.externalEntityId)
      .input('fieldName', sql.NVarChar, conflict.fieldName)
      .input('sourceValue', sql.NVarChar, conflict.sourceValue)
      .input('targetValue', sql.NVarChar, conflict.targetValue)
      .input('sourceTimestamp', sql.DateTime2, conflict.sourceTimestamp)
      .input('targetTimestamp', sql.DateTime2, conflict.targetTimestamp)
      .input('status', sql.NVarChar, conflict.status || 'unresolved')
      .input('autoResolveAttempted', sql.Bit, conflict.autoResolveAttempted || false)
      .input('autoResolveStrategy', sql.NVarChar, conflict.autoResolveStrategy)
      .input('autoResolveSuccess', sql.Bit, conflict.autoResolveSuccess)
      .input('autoResolveReason', sql.NVarChar, conflict.autoResolveReason)
      .input('severity', sql.NVarChar, conflict.severity || 'medium')
      .input('impactAssessment', sql.NVarChar, conflict.impactAssessment)
      .input('requiresManualReview', sql.Bit, conflict.requiresManualReview ?? true)
      .input('contextData', sql.NVarChar, conflict.contextData)
      .input('errorMessage', sql.NVarChar, conflict.errorMessage)
      .query(`
        INSERT INTO SyncConflicts (
          configurationId, logId, conflictType, entityType, entityId, externalEntityId,
          fieldName, sourceValue, targetValue, sourceTimestamp, targetTimestamp, status,
          autoResolveAttempted, autoResolveStrategy, autoResolveSuccess, autoResolveReason,
          severity, impactAssessment, requiresManualReview, contextData, errorMessage
        )
        OUTPUT INSERTED.*
        VALUES (
          @configurationId, @logId, @conflictType, @entityType, @entityId, @externalEntityId,
          @fieldName, @sourceValue, @targetValue, @sourceTimestamp, @targetTimestamp, @status,
          @autoResolveAttempted, @autoResolveStrategy, @autoResolveSuccess, @autoResolveReason,
          @severity, @impactAssessment, @requiresManualReview, @contextData, @errorMessage
        )
      `);

    return result.recordset[0];
  }

  /**
   * Find conflict by ID
   */
  static async findById(id: number): Promise<SyncConflict | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM SyncConflicts WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find conflicts by configuration
   */
  static async findByConfigurationId(
    configurationId: number,
    filters?: {
      status?: string;
      severity?: string;
      entityType?: string;
      requiresManualReview?: boolean;
      limit?: number;
    }
  ): Promise<SyncConflict[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM SyncConflicts WHERE configurationId = @configurationId';
    request.input('configurationId', sql.Int, configurationId);

    if (filters?.status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }

    if (filters?.severity) {
      query += ' AND severity = @severity';
      request.input('severity', sql.NVarChar, filters.severity);
    }

    if (filters?.entityType) {
      query += ' AND entityType = @entityType';
      request.input('entityType', sql.NVarChar, filters.entityType);
    }

    if (filters?.requiresManualReview !== undefined) {
      query += ' AND requiresManualReview = @requiresManualReview';
      request.input('requiresManualReview', sql.Bit, filters.requiresManualReview);
    }

    query += ' ORDER BY detectedAt DESC';

    if (filters?.limit) {
      query = `SELECT TOP ${filters.limit} * FROM (${query}) AS conflicts`;
    }

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Find conflicts by log ID
   */
  static async findByLogId(logId: number): Promise<SyncConflict[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('logId', sql.Int, logId)
      .query('SELECT * FROM SyncConflicts WHERE logId = @logId ORDER BY detectedAt DESC');

    return result.recordset;
  }

  /**
   * Find unresolved conflicts
   */
  static async findUnresolved(filters?: {
    configurationId?: number;
    severity?: string;
    requiresManualReview?: boolean;
  }): Promise<SyncConflict[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = "SELECT * FROM SyncConflicts WHERE status = 'unresolved'";

    if (filters?.configurationId) {
      query += ' AND configurationId = @configurationId';
      request.input('configurationId', sql.Int, filters.configurationId);
    }

    if (filters?.severity) {
      query += ' AND severity = @severity';
      request.input('severity', sql.NVarChar, filters.severity);
    }

    if (filters?.requiresManualReview !== undefined) {
      query += ' AND requiresManualReview = @requiresManualReview';
      request.input('requiresManualReview', sql.Bit, filters.requiresManualReview);
    }

    query += ' ORDER BY severity DESC, detectedAt DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Resolve a conflict
   */
  static async resolve(
    id: number,
    resolution: {
      resolution: 'source_wins' | 'target_wins' | 'manual_merge' | 'custom_value' | 'ignored' | 'newest_wins' | 'oldest_wins';
      resolvedValue?: string;
      resolvedBy: number;
      resolutionNotes?: string;
    }
  ): Promise<SyncConflict | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('resolution', sql.NVarChar, resolution.resolution)
      .input('resolvedValue', sql.NVarChar, resolution.resolvedValue)
      .input('resolvedBy', sql.Int, resolution.resolvedBy)
      .input('resolutionNotes', sql.NVarChar, resolution.resolutionNotes)
      .query(`
        UPDATE SyncConflicts
        SET 
          status = 'resolved',
          resolution = @resolution,
          resolvedValue = @resolvedValue,
          resolvedAt = GETDATE(),
          resolvedBy = @resolvedBy,
          resolutionNotes = @resolutionNotes,
          updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Update conflict status
   */
  static async updateStatus(
    id: number,
    status: 'unresolved' | 'resolved' | 'ignored' | 'escalated' | 'auto_resolved'
  ): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE SyncConflicts
        SET status = @status, updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Get conflict statistics
   */
  static async getStatistics(configurationId?: number): Promise<{
    totalConflicts: number;
    unresolvedConflicts: number;
    resolvedConflicts: number;
    autoResolvedConflicts: number;
    criticalConflicts: number;
    highConflicts: number;
    conflictsByType: Array<{ conflictType: string; count: number }>;
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let whereClause = '1=1';
    if (configurationId) {
      whereClause = 'configurationId = @configurationId';
      request.input('configurationId', sql.Int, configurationId);
    }

    const result = await request.query(`
      SELECT 
        COUNT(*) as totalConflicts,
        SUM(CASE WHEN status = 'unresolved' THEN 1 ELSE 0 END) as unresolvedConflicts,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedConflicts,
        SUM(CASE WHEN status = 'auto_resolved' THEN 1 ELSE 0 END) as autoResolvedConflicts,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as criticalConflicts,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as highConflicts
      FROM SyncConflicts
      WHERE ${whereClause}
    `);

    const typeResult = await request.query(`
      SELECT conflictType, COUNT(*) as count
      FROM SyncConflicts
      WHERE ${whereClause}
      GROUP BY conflictType
      ORDER BY count DESC
    `);

    return {
      ...result.recordset[0],
      conflictsByType: typeResult.recordset,
    };
  }
}
