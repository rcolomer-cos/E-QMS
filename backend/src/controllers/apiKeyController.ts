import { Response } from 'express';
import { ApiKeyModel } from '../models/ApiKeyModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logAudit, AuditActionCategory, AuditAction } from '../services/auditLogService';

/**
 * Create a new API key
 */
export const createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, description, expiresAt, scopes, allowedIPs } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Parse expiresAt if provided
    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;

    const result = await ApiKeyModel.create({
      name,
      description,
      expiresAt: expirationDate,
      scopes,
      allowedIPs,
      createdBy: req.user.id,
    });

    // Log the action
    await logAudit({
      req,
      action: AuditAction.CREATE,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `Created API key: ${name}`,
      entityType: 'ApiKey',
      entityId: result.apiKey.id,
      entityIdentifier: name,
      success: true,
      statusCode: 201,
    });

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        keyPreview: result.apiKey.keyPreview,
        description: result.apiKey.description,
        expiresAt: result.apiKey.expiresAt,
        scopes: result.apiKey.scopes ? JSON.parse(result.apiKey.scopes) : null,
        allowedIPs: result.apiKey.allowedIPs ? JSON.parse(result.apiKey.allowedIPs) : null,
        createdAt: result.apiKey.createdAt,
      },
      // Return raw key only once - user must save it
      rawKey: result.rawKey,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

/**
 * Get all API keys
 */
export const getAllApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apiKeys = await ApiKeyModel.findAll();

    const formattedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPreview: key.keyPreview,
      description: key.description,
      expiresAt: key.expiresAt,
      scopes: key.scopes ? JSON.parse(key.scopes) : null,
      allowedIPs: key.allowedIPs ? JSON.parse(key.allowedIPs) : null,
      active: key.active,
      revokedAt: key.revokedAt,
      revokedBy: key.revokedBy,
      revocationReason: key.revocationReason,
      lastUsedAt: key.lastUsedAt,
      lastUsedIp: key.lastUsedIp,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
      createdBy: key.createdBy,
      creatorEmail: key.creatorEmail,
      creatorName: key.creatorName,
      updatedAt: key.updatedAt,
    }));

    res.json(formattedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

/**
 * Get an API key by ID
 */
export const getApiKeyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const apiKey = await ApiKeyModel.findById(parseInt(id, 10));

    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    res.json({
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.keyPreview,
      description: apiKey.description,
      expiresAt: apiKey.expiresAt,
      scopes: apiKey.scopes ? JSON.parse(apiKey.scopes) : null,
      allowedIPs: apiKey.allowedIPs ? JSON.parse(apiKey.allowedIPs) : null,
      active: apiKey.active,
      revokedAt: apiKey.revokedAt,
      revokedBy: apiKey.revokedBy,
      revocationReason: apiKey.revocationReason,
      lastUsedAt: apiKey.lastUsedAt,
      lastUsedIp: apiKey.lastUsedIp,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
      createdBy: apiKey.createdBy,
      creatorEmail: apiKey.creatorEmail,
      creatorName: apiKey.creatorName,
      updatedAt: apiKey.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
};

/**
 * Revoke an API key
 */
export const revokeApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const apiKey = await ApiKeyModel.findById(parseInt(id, 10));
    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    if (!apiKey.active) {
      res.status(400).json({ error: 'API key is already revoked' });
      return;
    }

    await ApiKeyModel.revoke(parseInt(id, 10), req.user.id, reason);

    // Log the action
    await logAudit({
      req,
      action: AuditAction.UPDATE,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `Revoked API key: ${apiKey.name}${reason ? ` - Reason: ${reason}` : ''}`,
      entityType: 'ApiKey',
      entityId: apiKey.id,
      entityIdentifier: apiKey.name,
      success: true,
      statusCode: 200,
    });

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const apiKey = await ApiKeyModel.findById(parseInt(id, 10));
    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    await ApiKeyModel.delete(parseInt(id, 10));

    // Log the action
    await logAudit({
      req,
      action: AuditAction.DELETE,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `Deleted API key: ${apiKey.name}`,
      entityType: 'ApiKey',
      entityId: apiKey.id,
      entityIdentifier: apiKey.name,
      success: true,
      statusCode: 200,
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};

/**
 * Update an API key
 */
export const updateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, description, expiresAt, scopes, allowedIPs } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const apiKey = await ApiKeyModel.findById(parseInt(id, 10));
    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    await ApiKeyModel.update(parseInt(id, 10), {
      name,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      scopes,
      allowedIPs,
    });

    // Log the action
    await logAudit({
      req,
      action: AuditAction.UPDATE,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `Updated API key: ${apiKey.name}`,
      entityType: 'ApiKey',
      entityId: apiKey.id,
      entityIdentifier: apiKey.name,
      success: true,
      statusCode: 200,
    });

    res.json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
};
