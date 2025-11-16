import { getConnection, sql } from '../config/database';

export interface AuditLogEntry {
  id?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  action: string;
  actionCategory: string;
  actionDescription?: string;
  entityType: string;
  entityId?: number;
  entityIdentifier?: string;
  oldValues?: string;
  newValues?: string;
  changedFields?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  success: boolean;
  errorMessage?: string;
  statusCode?: number;
  timestamp?: Date;
  sessionId?: string;
  additionalData?: string;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  actionCategory?: string;
  entityType?: string;
  entityId?: number;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogModel {
  /**
   * Create a new audit log entry
   */
  static async create(entry: AuditLogEntry): Promise<number> {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('userId', sql.Int, entry.userId)
        .input('userName', sql.NVarChar, entry.userName)
        .input('userEmail', sql.NVarChar, entry.userEmail)
        .input('action', sql.NVarChar, entry.action)
        .input('actionCategory', sql.NVarChar, entry.actionCategory)
        .input('actionDescription', sql.NVarChar, entry.actionDescription)
        .input('entityType', sql.NVarChar, entry.entityType)
        .input('entityId', sql.Int, entry.entityId)
        .input('entityIdentifier', sql.NVarChar, entry.entityIdentifier)
        .input('oldValues', sql.NVarChar, entry.oldValues)
        .input('newValues', sql.NVarChar, entry.newValues)
        .input('changedFields', sql.NVarChar, entry.changedFields)
        .input('ipAddress', sql.NVarChar, entry.ipAddress)
        .input('userAgent', sql.NVarChar, entry.userAgent)
        .input('requestMethod', sql.NVarChar, entry.requestMethod)
        .input('requestUrl', sql.NVarChar, entry.requestUrl)
        .input('success', sql.Bit, entry.success)
        .input('errorMessage', sql.NVarChar, entry.errorMessage)
        .input('statusCode', sql.Int, entry.statusCode)
        .input('sessionId', sql.NVarChar, entry.sessionId)
        .input('additionalData', sql.NVarChar, entry.additionalData)
        .query(`
          INSERT INTO AuditLog (
            userId, userName, userEmail, action, actionCategory, actionDescription,
            entityType, entityId, entityIdentifier, oldValues, newValues, changedFields,
            ipAddress, userAgent, requestMethod, requestUrl, success, errorMessage,
            statusCode, sessionId, additionalData
          )
          OUTPUT INSERTED.id
          VALUES (
            @userId, @userName, @userEmail, @action, @actionCategory, @actionDescription,
            @entityType, @entityId, @entityIdentifier, @oldValues, @newValues, @changedFields,
            @ipAddress, @userAgent, @requestMethod, @requestUrl, @success, @errorMessage,
            @statusCode, @sessionId, @additionalData
          )
        `);

      return result.recordset[0].id;
    } catch (error) {
      console.error('Error creating audit log entry:', error);
      throw error;
    }
  }

  /**
   * Find audit log entries by filters
   */
  static async findAll(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
    try {
      const pool = await getConnection();
      const request = pool.request();
      let query = 'SELECT * FROM AuditLog WHERE 1=1';

      if (filters?.userId) {
        request.input('userId', sql.Int, filters.userId);
        query += ' AND userId = @userId';
      }

      if (filters?.action) {
        request.input('action', sql.NVarChar, filters.action);
        query += ' AND action = @action';
      }

      if (filters?.actionCategory) {
        request.input('actionCategory', sql.NVarChar, filters.actionCategory);
        query += ' AND actionCategory = @actionCategory';
      }

      if (filters?.entityType) {
        request.input('entityType', sql.NVarChar, filters.entityType);
        query += ' AND entityType = @entityType';
      }

      if (filters?.entityId) {
        request.input('entityId', sql.Int, filters.entityId);
        query += ' AND entityId = @entityId';
      }

      if (filters?.success !== undefined) {
        request.input('success', sql.Bit, filters.success);
        query += ' AND success = @success';
      }

      if (filters?.startDate) {
        request.input('startDate', sql.DateTime2, filters.startDate);
        query += ' AND timestamp >= @startDate';
      }

      if (filters?.endDate) {
        request.input('endDate', sql.DateTime2, filters.endDate);
        query += ' AND timestamp <= @endDate';
      }

      query += ' ORDER BY timestamp DESC';

      if (filters?.limit) {
        query += ` OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error finding audit log entries:', error);
      throw error;
    }
  }

  /**
   * Find audit log entry by ID
   */
  static async findById(id: number): Promise<AuditLogEntry | null> {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM AuditLog WHERE id = @id');

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error finding audit log entry by ID:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific entity
   */
  static async getEntityAuditTrail(
    entityType: string,
    entityId: number,
    limit?: number
  ): Promise<AuditLogEntry[]> {
    try {
      const pool = await getConnection();
      const request = pool.request()
        .input('entityType', sql.NVarChar, entityType)
        .input('entityId', sql.Int, entityId);

      let query = `
        SELECT * FROM AuditLog
        WHERE entityType = @entityType AND entityId = @entityId
        ORDER BY timestamp DESC
      `;

      if (limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting entity audit trail:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<AuditLogEntry[]> {
    try {
      const pool = await getConnection();
      const request = pool.request().input('userId', sql.Int, userId);

      let query = 'SELECT * FROM AuditLog WHERE userId = @userId';

      if (startDate) {
        request.input('startDate', sql.DateTime2, startDate);
        query += ' AND timestamp >= @startDate';
      }

      if (endDate) {
        request.input('endDate', sql.DateTime2, endDate);
        query += ' AND timestamp <= @endDate';
      }

      query += ' ORDER BY timestamp DESC';

      if (limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Get failed actions for security monitoring
   */
  static async getFailedActions(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<AuditLogEntry[]> {
    try {
      const pool = await getConnection();
      const request = pool.request().input('success', sql.Bit, false);

      let query = 'SELECT * FROM AuditLog WHERE success = @success';

      if (startDate) {
        request.input('startDate', sql.DateTime2, startDate);
        query += ' AND timestamp >= @startDate';
      }

      if (endDate) {
        request.input('endDate', sql.DateTime2, endDate);
        query += ' AND timestamp <= @endDate';
      }

      query += ' ORDER BY timestamp DESC';

      if (limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting failed actions:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let query = `
        SELECT
          COUNT(*) as totalActions,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulActions,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedActions,
          COUNT(DISTINCT userId) as uniqueUsers,
          COUNT(DISTINCT entityType) as entityTypes,
          actionCategory,
          COUNT(*) as categoryCount
        FROM AuditLog
        WHERE 1=1
      `;

      if (startDate) {
        request.input('startDate', sql.DateTime2, startDate);
        query += ' AND timestamp >= @startDate';
      }

      if (endDate) {
        request.input('endDate', sql.DateTime2, endDate);
        query += ' AND timestamp <= @endDate';
      }

      query += ' GROUP BY actionCategory';

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }
}
