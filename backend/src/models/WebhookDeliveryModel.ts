import { getConnection, sql } from '../config/database';

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';
export type WebhookEntityType = 'NCR' | 'CAPA';

export interface WebhookDelivery {
  id?: number;
  subscriptionId: number;
  eventType: string;
  entityType: WebhookEntityType;
  entityId: number;
  requestUrl: string;
  requestPayload: object;
  requestHeaders?: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  responseTime?: number;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  status: WebhookDeliveryStatus;
  errorMessage?: string;
  createdAt?: Date;
  deliveredAt?: Date;
}

export class WebhookDeliveryModel {
  /**
   * Create a new webhook delivery log
   */
  static async create(delivery: WebhookDelivery): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('subscriptionId', sql.Int, delivery.subscriptionId)
      .input('eventType', sql.NVarChar, delivery.eventType)
      .input('entityType', sql.NVarChar, delivery.entityType)
      .input('entityId', sql.Int, delivery.entityId)
      .input('requestUrl', sql.NVarChar, delivery.requestUrl)
      .input('requestPayload', sql.NVarChar, JSON.stringify(delivery.requestPayload))
      .input('requestHeaders', sql.NVarChar, delivery.requestHeaders ? JSON.stringify(delivery.requestHeaders) : null)
      .input('responseStatus', sql.Int, delivery.responseStatus)
      .input('responseBody', sql.NVarChar, delivery.responseBody)
      .input('responseTime', sql.Int, delivery.responseTime)
      .input('attempt', sql.Int, delivery.attempt)
      .input('maxAttempts', sql.Int, delivery.maxAttempts)
      .input('nextRetryAt', sql.DateTime2, delivery.nextRetryAt)
      .input('status', sql.NVarChar, delivery.status)
      .input('errorMessage', sql.NVarChar, delivery.errorMessage)
      .input('deliveredAt', sql.DateTime2, delivery.deliveredAt)
      .query(`
        INSERT INTO WebhookDeliveries (
          subscriptionId, eventType, entityType, entityId, requestUrl, requestPayload, requestHeaders,
          responseStatus, responseBody, responseTime, attempt, maxAttempts, nextRetryAt, status, errorMessage, deliveredAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @subscriptionId, @eventType, @entityType, @entityId, @requestUrl, @requestPayload, @requestHeaders,
          @responseStatus, @responseBody, @responseTime, @attempt, @maxAttempts, @nextRetryAt, @status, @errorMessage, @deliveredAt
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get webhook delivery by ID
   */
  static async findById(id: number): Promise<WebhookDelivery | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM WebhookDeliveries WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.parseDelivery(result.recordset[0]);
  }

  /**
   * Get deliveries for a subscription
   */
  static async findBySubscription(
    subscriptionId: number,
    options?: { status?: WebhookDeliveryStatus; limit?: number }
  ): Promise<WebhookDelivery[]> {
    const pool = await getConnection();
    const request = pool.request().input('subscriptionId', sql.Int, subscriptionId);

    let query = 'SELECT * FROM WebhookDeliveries WHERE subscriptionId = @subscriptionId';

    if (options?.status) {
      request.input('status', sql.NVarChar, options.status);
      query += ' AND status = @status';
    }

    query += ' ORDER BY createdAt DESC';

    if (options?.limit) {
      request.input('limit', sql.Int, options.limit);
      query = `SELECT TOP (@limit) * FROM (${query}) AS subquery`;
    }

    const result = await request.query(query);

    return result.recordset.map(record => this.parseDelivery(record));
  }

  /**
   * Get deliveries for an entity (NCR or CAPA)
   */
  static async findByEntity(
    entityType: WebhookEntityType,
    entityId: number,
    limit: number = 50
  ): Promise<WebhookDelivery[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('entityType', sql.NVarChar, entityType)
      .input('entityId', sql.Int, entityId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) * FROM WebhookDeliveries 
        WHERE entityType = @entityType AND entityId = @entityId
        ORDER BY createdAt DESC
      `);

    return result.recordset.map(record => this.parseDelivery(record));
  }

  /**
   * Get pending retries (deliveries that need to be retried)
   */
  static async findPendingRetries(): Promise<WebhookDelivery[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM WebhookDeliveries 
        WHERE status = 'retrying' 
        AND nextRetryAt <= GETDATE()
        ORDER BY nextRetryAt ASC
      `);

    return result.recordset.map(record => this.parseDelivery(record));
  }

  /**
   * Update webhook delivery
   */
  static async update(id: number, updates: Partial<WebhookDelivery>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const setClauses: string[] = [];

    if (updates.responseStatus !== undefined) {
      request.input('responseStatus', sql.Int, updates.responseStatus);
      setClauses.push('responseStatus = @responseStatus');
    }

    if (updates.responseBody !== undefined) {
      request.input('responseBody', sql.NVarChar, updates.responseBody);
      setClauses.push('responseBody = @responseBody');
    }

    if (updates.responseTime !== undefined) {
      request.input('responseTime', sql.Int, updates.responseTime);
      setClauses.push('responseTime = @responseTime');
    }

    if (updates.attempt !== undefined) {
      request.input('attempt', sql.Int, updates.attempt);
      setClauses.push('attempt = @attempt');
    }

    if (updates.nextRetryAt !== undefined) {
      request.input('nextRetryAt', sql.DateTime2, updates.nextRetryAt);
      setClauses.push('nextRetryAt = @nextRetryAt');
    }

    if (updates.status !== undefined) {
      request.input('status', sql.NVarChar, updates.status);
      setClauses.push('status = @status');
    }

    if (updates.errorMessage !== undefined) {
      request.input('errorMessage', sql.NVarChar, updates.errorMessage);
      setClauses.push('errorMessage = @errorMessage');
    }

    if (updates.deliveredAt !== undefined) {
      request.input('deliveredAt', sql.DateTime2, updates.deliveredAt);
      setClauses.push('deliveredAt = @deliveredAt');
    }

    if (setClauses.length === 0) {
      return;
    }

    await request.query(`
      UPDATE WebhookDeliveries 
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
  }

  /**
   * Delete webhook delivery
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM WebhookDeliveries WHERE id = @id');
  }

  /**
   * Delete old delivery logs (cleanup)
   */
  static async deleteOldDeliveries(daysOld: number = 90): Promise<number> {
    const pool = await getConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await pool
      .request()
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        DELETE FROM WebhookDeliveries 
        WHERE createdAt < @cutoffDate
      `);

    return result.rowsAffected[0];
  }

  /**
   * Get delivery statistics for a subscription
   */
  static async getStatistics(subscriptionId: number, days: number = 7): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    retrying: number;
    successRate: number;
  }> {
    const pool = await getConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await pool
      .request()
      .input('subscriptionId', sql.Int, subscriptionId)
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'retrying' THEN 1 ELSE 0 END) as retrying
        FROM WebhookDeliveries
        WHERE subscriptionId = @subscriptionId
        AND createdAt >= @cutoffDate
      `);

    const stats = result.recordset[0];
    const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

    return {
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      pending: stats.pending,
      retrying: stats.retrying,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Parse database record to WebhookDelivery object
   */
  private static parseDelivery(record: any): WebhookDelivery {
    return {
      id: record.id,
      subscriptionId: record.subscriptionId,
      eventType: record.eventType,
      entityType: record.entityType,
      entityId: record.entityId,
      requestUrl: record.requestUrl,
      requestPayload: JSON.parse(record.requestPayload),
      requestHeaders: record.requestHeaders ? JSON.parse(record.requestHeaders) : undefined,
      responseStatus: record.responseStatus,
      responseBody: record.responseBody,
      responseTime: record.responseTime,
      attempt: record.attempt,
      maxAttempts: record.maxAttempts,
      nextRetryAt: record.nextRetryAt,
      status: record.status,
      errorMessage: record.errorMessage,
      createdAt: record.createdAt,
      deliveredAt: record.deliveredAt,
    };
  }
}
