import crypto from 'crypto';
import { getConnection } from '../config/database';
import sql from 'mssql';

/**
 * Scope types for auditor access tokens
 */
export enum TokenScopeType {
  FULL_READ_ONLY = 'full_read_only',
  SPECIFIC_AUDIT = 'specific_audit',
  SPECIFIC_DOCUMENT = 'specific_document',
  SPECIFIC_NCR = 'specific_ncr',
  SPECIFIC_CAPA = 'specific_capa',
}

/**
 * Interface for creating a new auditor access token
 */
export interface CreateAuditorAccessToken {
  auditorName: string;
  auditorEmail: string;
  auditorOrganization?: string;
  expiresAt: Date;
  maxUses?: number;
  scopeType: TokenScopeType;
  scopeEntityId?: number;
  allowedResources?: string[];
  purpose: string;
  notes?: string;
  createdBy: number;
}

/**
 * Interface for auditor access token
 */
export interface AuditorAccessToken {
  id: number;
  token: string;
  tokenPreview: string;
  auditorName: string;
  auditorEmail: string;
  auditorOrganization?: string;
  expiresAt: Date;
  maxUses?: number;
  currentUses: number;
  scopeType: TokenScopeType;
  scopeEntityId?: number;
  allowedResources?: string[];
  active: boolean;
  revokedAt?: Date;
  revokedBy?: number;
  revocationReason?: string;
  purpose: string;
  notes?: string;
  createdAt: Date;
  createdBy: number;
  lastUsedAt?: Date;
  lastUsedIp?: string;
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create token preview (first 8 and last 4 characters)
 */
function createTokenPreview(token: string): string {
  if (token.length < 12) return token;
  return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
}

/**
 * Service for managing auditor access tokens
 */
export class AuditorAccessTokenService {
  /**
   * Create a new auditor access token
   */
  static async createToken(data: CreateAuditorAccessToken): Promise<{ id: number; token: string }> {
    const pool = await getConnection();
    
    // Generate unique token
    const token = generateToken();
    const hashedToken = hashToken(token);
    const tokenPreview = createTokenPreview(token);
    
    // Serialize allowed resources if provided
    const allowedResourcesJson = data.allowedResources 
      ? JSON.stringify(data.allowedResources)
      : null;
    
    const result = await pool.request()
      .input('token', sql.NVarChar(255), hashedToken)
      .input('tokenPreview', sql.NVarChar(50), tokenPreview)
      .input('auditorName', sql.NVarChar(255), data.auditorName)
      .input('auditorEmail', sql.NVarChar(255), data.auditorEmail)
      .input('auditorOrganization', sql.NVarChar(255), data.auditorOrganization || null)
      .input('expiresAt', sql.DateTime2, data.expiresAt)
      .input('maxUses', sql.Int, data.maxUses || null)
      .input('scopeType', sql.NVarChar(50), data.scopeType)
      .input('scopeEntityId', sql.Int, data.scopeEntityId || null)
      .input('allowedResources', sql.NVarChar(sql.MAX), allowedResourcesJson)
      .input('purpose', sql.NVarChar(500), data.purpose)
      .input('notes', sql.NVarChar(sql.MAX), data.notes || null)
      .input('createdBy', sql.Int, data.createdBy)
      .query(`
        INSERT INTO AuditorAccessTokens (
          token, tokenPreview, auditorName, auditorEmail, auditorOrganization,
          expiresAt, maxUses, scopeType, scopeEntityId, allowedResources,
          purpose, notes, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @token, @tokenPreview, @auditorName, @auditorEmail, @auditorOrganization,
          @expiresAt, @maxUses, @scopeType, @scopeEntityId, @allowedResources,
          @purpose, @notes, @createdBy
        )
      `);
    
    return {
      id: result.recordset[0].id,
      token, // Return unhashed token only once
    };
  }

  /**
   * Validate a token and return token details if valid
   */
  static async validateToken(token: string, ipAddress?: string): Promise<AuditorAccessToken | null> {
    const pool = await getConnection();
    const hashedToken = hashToken(token);
    
    const result = await pool.request()
      .input('token', sql.NVarChar(255), hashedToken)
      .input('now', sql.DateTime2, new Date())
      .query(`
        SELECT 
          id, tokenPreview, auditorName, auditorEmail, auditorOrganization,
          expiresAt, maxUses, currentUses, scopeType, scopeEntityId,
          allowedResources, active, revokedAt, revokedBy, revocationReason,
          purpose, notes, createdAt, createdBy, lastUsedAt, lastUsedIp
        FROM AuditorAccessTokens
        WHERE token = @token
          AND active = 1
          AND expiresAt > @now
          AND (maxUses IS NULL OR currentUses < maxUses)
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const tokenData = result.recordset[0];
    
    // Update usage statistics
    await pool.request()
      .input('token', sql.NVarChar(255), hashedToken)
      .input('lastUsedIp', sql.NVarChar(45), ipAddress || null)
      .query(`
        UPDATE AuditorAccessTokens
        SET currentUses = currentUses + 1,
            lastUsedAt = GETDATE(),
            lastUsedIp = @lastUsedIp
        WHERE token = @token
      `);
    
    return {
      ...tokenData,
      token: hashedToken, // Return hashed version for security
      allowedResources: tokenData.allowedResources 
        ? JSON.parse(tokenData.allowedResources)
        : undefined,
    };
  }

  /**
   * Get all tokens (with optional filtering)
   */
  static async getTokens(filters?: {
    activeOnly?: boolean;
    createdBy?: number;
    auditorEmail?: string;
    scopeType?: TokenScopeType;
  }): Promise<Omit<AuditorAccessToken, 'token'>[]> {
    const pool = await getConnection();
    
    let query = `
      SELECT 
        id, tokenPreview, auditorName, auditorEmail, auditorOrganization,
        expiresAt, maxUses, currentUses, scopeType, scopeEntityId,
        allowedResources, active, revokedAt, revokedBy, revocationReason,
        purpose, notes, createdAt, createdBy, lastUsedAt, lastUsedIp
      FROM AuditorAccessTokens
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters?.activeOnly) {
      query += ` AND active = 1 AND expiresAt > GETDATE()`;
    }
    
    if (filters?.createdBy) {
      query += ` AND createdBy = @createdBy`;
      request.input('createdBy', sql.Int, filters.createdBy);
    }
    
    if (filters?.auditorEmail) {
      query += ` AND auditorEmail = @auditorEmail`;
      request.input('auditorEmail', sql.NVarChar(255), filters.auditorEmail);
    }
    
    if (filters?.scopeType) {
      query += ` AND scopeType = @scopeType`;
      request.input('scopeType', sql.NVarChar(50), filters.scopeType);
    }
    
    query += ` ORDER BY createdAt DESC`;
    
    const result = await request.query(query);
    
    return result.recordset.map(token => ({
      ...token,
      allowedResources: token.allowedResources 
        ? JSON.parse(token.allowedResources)
        : undefined,
    }));
  }

  /**
   * Get a specific token by ID (without the actual token value)
   */
  static async getTokenById(id: number): Promise<Omit<AuditorAccessToken, 'token'> | null> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          id, tokenPreview, auditorName, auditorEmail, auditorOrganization,
          expiresAt, maxUses, currentUses, scopeType, scopeEntityId,
          allowedResources, active, revokedAt, revokedBy, revocationReason,
          purpose, notes, createdAt, createdBy, lastUsedAt, lastUsedIp
        FROM AuditorAccessTokens
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const token = result.recordset[0];
    return {
      ...token,
      allowedResources: token.allowedResources 
        ? JSON.parse(token.allowedResources)
        : undefined,
    };
  }

  /**
   * Revoke a token
   */
  static async revokeToken(id: number, revokedBy: number, reason: string): Promise<void> {
    const pool = await getConnection();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('revokedBy', sql.Int, revokedBy)
      .input('revocationReason', sql.NVarChar(500), reason)
      .query(`
        UPDATE AuditorAccessTokens
        SET active = 0,
            revokedAt = GETDATE(),
            revokedBy = @revokedBy,
            revocationReason = @revocationReason
        WHERE id = @id
      `);
  }

  /**
   * Cleanup expired tokens (soft delete by marking inactive)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        UPDATE AuditorAccessTokens
        SET active = 0
        WHERE active = 1
          AND expiresAt <= GETDATE()
      `);
    
    return result.rowsAffected[0];
  }
}
