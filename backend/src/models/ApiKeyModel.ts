import { getConnection, sql } from '../config/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface ApiKey {
  id: number;
  keyHash: string;
  keyPreview: string;
  name: string;
  expiresAt?: Date;
  scopes?: string;
  allowedIPs?: string;
  active: boolean;
  revokedAt?: Date;
  revokedBy?: number;
  revocationReason?: string;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  description?: string;
  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
  creatorEmail?: string;
  creatorName?: string;
}

export interface CreateApiKeyData {
  name: string;
  description?: string;
  expiresAt?: Date;
  scopes?: string[];
  allowedIPs?: string[];
  createdBy: number;
}

export interface ApiKeyWithRaw {
  apiKey: ApiKey;
  rawKey: string;
}

export class ApiKeyModel {
  /**
   * Generate a secure random API key
   */
  private static generateApiKey(): string {
    // Generate a 32-byte random key and encode as base64url (no padding)
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Create a preview of the API key for display
   */
  private static createKeyPreview(key: string): string {
    if (key.length < 12) {
      return key;
    }
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Create a new API key
   * Returns both the stored key info and the raw key (shown only once)
   */
  static async create(data: CreateApiKeyData): Promise<ApiKeyWithRaw> {
    const pool = await getConnection();
    const rawKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPreview = this.createKeyPreview(rawKey);

    const result = await pool
      .request()
      .input('keyHash', sql.NVarChar, keyHash)
      .input('keyPreview', sql.NVarChar, keyPreview)
      .input('name', sql.NVarChar, data.name)
      .input('expiresAt', sql.DateTime2, data.expiresAt || null)
      .input('scopes', sql.NVarChar, data.scopes ? JSON.stringify(data.scopes) : null)
      .input('allowedIPs', sql.NVarChar, data.allowedIPs ? JSON.stringify(data.allowedIPs) : null)
      .input('description', sql.NVarChar, data.description || null)
      .input('createdBy', sql.Int, data.createdBy)
      .query(`
        INSERT INTO ApiKeys (
          keyHash, keyPreview, name, expiresAt, scopes, allowedIPs,
          description, active, createdBy, updatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @keyHash, @keyPreview, @name, @expiresAt, @scopes, @allowedIPs,
          @description, 1, @createdBy, GETDATE()
        )
      `);

    const apiKey = result.recordset[0] as ApiKey;

    return {
      apiKey,
      rawKey,
    };
  }

  /**
   * Get all API keys with creator information
   */
  static async findAll(): Promise<ApiKey[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        ak.*,
        u.email as creatorEmail,
        CONCAT(u.firstName, ' ', u.lastName) as creatorName
      FROM ApiKeys ak
      LEFT JOIN Users u ON ak.createdBy = u.id
      ORDER BY ak.createdAt DESC
    `);

    return result.recordset;
  }

  /**
   * Get an API key by ID
   */
  static async findById(id: number): Promise<ApiKey | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          ak.*,
          u.email as creatorEmail,
          CONCAT(u.firstName, ' ', u.lastName) as creatorName
        FROM ApiKeys ak
        LEFT JOIN Users u ON ak.createdBy = u.id
        WHERE ak.id = @id
      `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Verify an API key and return associated data if valid
   */
  static async verify(rawKey: string): Promise<ApiKey | null> {
    const pool = await getConnection();
    
    // Get all active keys
    const result = await pool.request().query(`
      SELECT * FROM ApiKeys
      WHERE active = 1
      AND (expiresAt IS NULL OR expiresAt > GETDATE())
    `);

    // Check each key hash
    for (const apiKey of result.recordset) {
      const isValid = await bcrypt.compare(rawKey, apiKey.keyHash);
      if (isValid) {
        return apiKey;
      }
    }

    return null;
  }

  /**
   * Update last used timestamp and IP address
   */
  static async updateLastUsed(id: number, ipAddress: string): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('ipAddress', sql.NVarChar, ipAddress)
      .query(`
        UPDATE ApiKeys
        SET 
          lastUsedAt = GETDATE(),
          lastUsedIp = @ipAddress,
          usageCount = usageCount + 1
        WHERE id = @id
      `);
  }

  /**
   * Revoke an API key
   */
  static async revoke(id: number, revokedBy: number, reason?: string): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('revokedBy', sql.Int, revokedBy)
      .input('reason', sql.NVarChar, reason || null)
      .query(`
        UPDATE ApiKeys
        SET 
          active = 0,
          revokedAt = GETDATE(),
          revokedBy = @revokedBy,
          revocationReason = @reason,
          updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Delete an API key (hard delete)
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM ApiKeys
        WHERE id = @id
      `);
  }

  /**
   * Update API key details
   */
  static async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      expiresAt?: Date | null;
      scopes?: string[];
      allowedIPs?: string[];
    }
  ): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const updates: string[] = [];

    if (data.name !== undefined) {
      request.input('name', sql.NVarChar, data.name);
      updates.push('name = @name');
    }

    if (data.description !== undefined) {
      request.input('description', sql.NVarChar, data.description);
      updates.push('description = @description');
    }

    if (data.expiresAt !== undefined) {
      request.input('expiresAt', sql.DateTime2, data.expiresAt);
      updates.push('expiresAt = @expiresAt');
    }

    if (data.scopes !== undefined) {
      request.input('scopes', sql.NVarChar, JSON.stringify(data.scopes));
      updates.push('scopes = @scopes');
    }

    if (data.allowedIPs !== undefined) {
      request.input('allowedIPs', sql.NVarChar, JSON.stringify(data.allowedIPs));
      updates.push('allowedIPs = @allowedIPs');
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`
      UPDATE ApiKeys
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
  }
}
