import { Response } from 'express';
import { AuthRequest } from '../types';
import { 
  AuditorAccessTokenService, 
  TokenScopeType,
  CreateAuditorAccessToken,
} from '../services/auditorAccessTokenService';
import { validationResult } from 'express-validator';
import { logAudit, AuditActionCategory, AuditAction } from '../services/auditLogService';

/**
 * Generate a new auditor access token
 */
export const generateToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      auditorName,
      auditorEmail,
      auditorOrganization,
      expiresAt,
      maxUses,
      scopeType,
      scopeEntityId,
      allowedResources,
      purpose,
      notes,
    } = req.body;

    // Validate expiration date
    const expirationDate = new Date(expiresAt);
    if (expirationDate <= new Date()) {
      res.status(400).json({ error: 'Expiration date must be in the future' });
      return;
    }

    // Validate scope type
    if (!Object.values(TokenScopeType).includes(scopeType)) {
      res.status(400).json({ 
        error: 'Invalid scope type',
        validScopes: Object.values(TokenScopeType),
      });
      return;
    }

    // Validate that specific scopes have entity IDs
    if (scopeType.startsWith('specific_') && !scopeEntityId) {
      res.status(400).json({ 
        error: `Scope type '${scopeType}' requires scopeEntityId`,
      });
      return;
    }

    const tokenData: CreateAuditorAccessToken = {
      auditorName,
      auditorEmail,
      auditorOrganization,
      expiresAt: expirationDate,
      maxUses,
      scopeType,
      scopeEntityId,
      allowedResources,
      purpose,
      notes,
      createdBy: req.user.id,
    };

    const result = await AuditorAccessTokenService.createToken(tokenData);

    // Log token creation
    await logAudit({
      req,
      action: AuditAction.CREATE,
      actionCategory: AuditActionCategory.SYSTEM,
      actionDescription: `Generated auditor access token for ${auditorName} (${auditorEmail})`,
      entityType: 'AuditorAccessToken',
      entityId: result.id,
      entityIdentifier: auditorEmail,
      success: true,
      statusCode: 201,
      newValues: JSON.stringify({
        auditorName,
        auditorEmail,
        scopeType,
        expiresAt: expirationDate.toISOString(),
        purpose,
      }),
    });

    res.status(201).json({
      message: 'Auditor access token generated successfully',
      tokenId: result.id,
      token: result.token, // Only time the raw token is returned
      expiresAt: expirationDate.toISOString(),
      accessUrl: `${req.protocol}://${req.get('host')}/auditor-access?token=${result.token}`,
      warning: 'Store this token securely. It will not be displayed again.',
    });
  } catch (error) {
    console.error('Generate token error:', error);
    
    await logAudit({
      req,
      action: AuditAction.CREATE,
      actionCategory: AuditActionCategory.SYSTEM,
      actionDescription: 'Failed to generate auditor access token',
      entityType: 'AuditorAccessToken',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    });
    
    res.status(500).json({ error: 'Failed to generate auditor access token' });
  }
};

/**
 * Get all auditor access tokens
 */
export const getTokens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { activeOnly, auditorEmail, scopeType } = req.query;

    const filters = {
      activeOnly: activeOnly === 'true',
      auditorEmail: auditorEmail as string | undefined,
      scopeType: scopeType as TokenScopeType | undefined,
    };

    const tokens = await AuditorAccessTokenService.getTokens(filters);

    res.json({
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to retrieve auditor access tokens' });
  }
};

/**
 * Get a specific auditor access token by ID
 */
export const getTokenById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const tokenId = parseInt(id, 10);

    if (isNaN(tokenId)) {
      res.status(400).json({ error: 'Invalid token ID' });
      return;
    }

    const token = await AuditorAccessTokenService.getTokenById(tokenId);

    if (!token) {
      res.status(404).json({ error: 'Auditor access token not found' });
      return;
    }

    res.json(token);
  } catch (error) {
    console.error('Get token by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve auditor access token' });
  }
};

/**
 * Revoke an auditor access token
 */
export const revokeToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;
    const tokenId = parseInt(id, 10);

    if (isNaN(tokenId)) {
      res.status(400).json({ error: 'Invalid token ID' });
      return;
    }

    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: 'Revocation reason is required' });
      return;
    }

    // Check if token exists
    const token = await AuditorAccessTokenService.getTokenById(tokenId);
    if (!token) {
      res.status(404).json({ error: 'Auditor access token not found' });
      return;
    }

    if (!token.active) {
      res.status(400).json({ error: 'Token is already revoked' });
      return;
    }

    await AuditorAccessTokenService.revokeToken(tokenId, req.user.id, reason);

    // Log token revocation
    await logAudit({
      req,
      action: AuditAction.DELETE,
      actionCategory: AuditActionCategory.SYSTEM,
      actionDescription: `Revoked auditor access token for ${token.auditorName} (${token.auditorEmail})`,
      entityType: 'AuditorAccessToken',
      entityId: tokenId,
      entityIdentifier: token.auditorEmail,
      success: true,
      statusCode: 200,
      oldValues: JSON.stringify({
        active: true,
      }),
      newValues: JSON.stringify({
        active: false,
        revokedBy: req.user.id,
        revocationReason: reason,
      }),
    });

    res.json({ 
      message: 'Auditor access token revoked successfully',
      tokenId,
    });
  } catch (error) {
    console.error('Revoke token error:', error);
    
    await logAudit({
      req,
      action: AuditAction.DELETE,
      actionCategory: AuditActionCategory.SYSTEM,
      actionDescription: 'Failed to revoke auditor access token',
      entityType: 'AuditorAccessToken',
      entityId: req.params.id ? parseInt(req.params.id, 10) : undefined,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    });
    
    res.status(500).json({ error: 'Failed to revoke auditor access token' });
  }
};

/**
 * Get available scope types and resource types
 */
export const getOptions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const options = {
      scopeTypes: Object.values(TokenScopeType).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        requiresEntityId: type.startsWith('specific_'),
      })),
      resourceTypes: [
        'audit',
        'document',
        'ncr',
        'capa',
        'equipment',
        'training',
        'audit-finding',
      ],
      defaultExpirationHours: [24, 48, 72, 168], // 1 day, 2 days, 3 days, 1 week
    };

    res.json(options);
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({ error: 'Failed to retrieve options' });
  }
};

/**
 * Cleanup expired tokens
 */
export const cleanupExpiredTokens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const count = await AuditorAccessTokenService.cleanupExpiredTokens();

    // Log cleanup operation
    await logAudit({
      req,
      action: AuditAction.DELETE,
      actionCategory: AuditActionCategory.SYSTEM,
      actionDescription: `Cleaned up ${count} expired auditor access tokens`,
      entityType: 'AuditorAccessToken',
      success: true,
      statusCode: 200,
    });

    res.json({ 
      message: 'Expired tokens cleaned up successfully',
      count,
    });
  } catch (error) {
    console.error('Cleanup expired tokens error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired tokens' });
  }
};
