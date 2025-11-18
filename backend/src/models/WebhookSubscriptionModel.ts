import { getConnection, sql } from '../config/database';

export interface WebhookSubscription {
  id?: number;
  name: string;
  url: string;
  secret: string;
  events: string[]; // Array of event types: ncr.created, ncr.updated, ncr.closed, capa.created, capa.updated, capa.closed
  active: boolean;
  retryEnabled: boolean;
  maxRetries: number;
  retryDelaySeconds: number;
  customHeaders?: Record<string, string>;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastTriggeredAt?: Date;
}

export class WebhookSubscriptionModel {
  /**
   * Create a new webhook subscription
   */
  static async create(subscription: WebhookSubscription): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('name', sql.NVarChar, subscription.name)
      .input('url', sql.NVarChar, subscription.url)
      .input('secret', sql.NVarChar, subscription.secret)
      .input('events', sql.NVarChar, JSON.stringify(subscription.events))
      .input('active', sql.Bit, subscription.active)
      .input('retryEnabled', sql.Bit, subscription.retryEnabled)
      .input('maxRetries', sql.Int, subscription.maxRetries)
      .input('retryDelaySeconds', sql.Int, subscription.retryDelaySeconds)
      .input('customHeaders', sql.NVarChar, subscription.customHeaders ? JSON.stringify(subscription.customHeaders) : null)
      .input('createdBy', sql.Int, subscription.createdBy)
      .query(`
        INSERT INTO WebhookSubscriptions (
          name, url, secret, events, active, retryEnabled, maxRetries, retryDelaySeconds, customHeaders, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @name, @url, @secret, @events, @active, @retryEnabled, @maxRetries, @retryDelaySeconds, @customHeaders, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get webhook subscription by ID
   */
  static async findById(id: number): Promise<WebhookSubscription | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM WebhookSubscriptions WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.parseSubscription(result.recordset[0]);
  }

  /**
   * Get all webhook subscriptions
   */
  static async findAll(activeOnly: boolean = false): Promise<WebhookSubscription[]> {
    const pool = await getConnection();
    
    let query = 'SELECT * FROM WebhookSubscriptions';
    if (activeOnly) {
      query += ' WHERE active = 1';
    }
    query += ' ORDER BY createdAt DESC';

    const result = await pool.request().query(query);

    return result.recordset.map(record => this.parseSubscription(record));
  }

  /**
   * Get active subscriptions for a specific event type
   */
  static async findByEvent(eventType: string): Promise<WebhookSubscription[]> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .query(`
        SELECT * FROM WebhookSubscriptions 
        WHERE active = 1 
        AND events LIKE '%${eventType}%'
        ORDER BY createdAt DESC
      `);

    // Filter results to only include exact event matches
    const subscriptions = result.recordset
      .map(record => this.parseSubscription(record))
      .filter(sub => sub.events.includes(eventType));

    return subscriptions;
  }

  /**
   * Update webhook subscription
   */
  static async update(id: number, updates: Partial<WebhookSubscription>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const setClauses: string[] = [];

    if (updates.name !== undefined) {
      request.input('name', sql.NVarChar, updates.name);
      setClauses.push('name = @name');
    }

    if (updates.url !== undefined) {
      request.input('url', sql.NVarChar, updates.url);
      setClauses.push('url = @url');
    }

    if (updates.secret !== undefined) {
      request.input('secret', sql.NVarChar, updates.secret);
      setClauses.push('secret = @secret');
    }

    if (updates.events !== undefined) {
      request.input('events', sql.NVarChar, JSON.stringify(updates.events));
      setClauses.push('events = @events');
    }

    if (updates.active !== undefined) {
      request.input('active', sql.Bit, updates.active);
      setClauses.push('active = @active');
    }

    if (updates.retryEnabled !== undefined) {
      request.input('retryEnabled', sql.Bit, updates.retryEnabled);
      setClauses.push('retryEnabled = @retryEnabled');
    }

    if (updates.maxRetries !== undefined) {
      request.input('maxRetries', sql.Int, updates.maxRetries);
      setClauses.push('maxRetries = @maxRetries');
    }

    if (updates.retryDelaySeconds !== undefined) {
      request.input('retryDelaySeconds', sql.Int, updates.retryDelaySeconds);
      setClauses.push('retryDelaySeconds = @retryDelaySeconds');
    }

    if (updates.customHeaders !== undefined) {
      request.input('customHeaders', sql.NVarChar, updates.customHeaders ? JSON.stringify(updates.customHeaders) : null);
      setClauses.push('customHeaders = @customHeaders');
    }

    if (setClauses.length === 0) {
      return;
    }

    setClauses.push('updatedAt = GETDATE()');

    await request.query(`
      UPDATE WebhookSubscriptions 
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
  }

  /**
   * Update last triggered timestamp
   */
  static async updateLastTriggered(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE WebhookSubscriptions SET lastTriggeredAt = GETDATE() WHERE id = @id');
  }

  /**
   * Delete webhook subscription
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM WebhookSubscriptions WHERE id = @id');
  }

  /**
   * Parse database record to WebhookSubscription object
   */
  private static parseSubscription(record: any): WebhookSubscription {
    return {
      id: record.id,
      name: record.name,
      url: record.url,
      secret: record.secret,
      events: JSON.parse(record.events),
      active: record.active,
      retryEnabled: record.retryEnabled,
      maxRetries: record.maxRetries,
      retryDelaySeconds: record.retryDelaySeconds,
      customHeaders: record.customHeaders ? JSON.parse(record.customHeaders) : undefined,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastTriggeredAt: record.lastTriggeredAt,
    };
  }
}
