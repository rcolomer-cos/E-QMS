import { Request } from 'express';
import { AuditLogModel, AuditLogEntry } from '../models/AuditLogModel';
import { AuthRequest } from '../types';

/**
 * Action categories for audit logging
 */
export enum AuditActionCategory {
  AUTHENTICATION = 'authentication',
  USER_MANAGEMENT = 'user_management',
  DOCUMENT = 'document',
  NCR = 'ncr',
  CAPA = 'capa',
  EQUIPMENT = 'equipment',
  DEPARTMENT = 'department',
  PROCESS = 'process',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  SERVICE_MAINTENANCE = 'service_maintenance',
  TRAINING = 'training',
  ATTACHMENT = 'attachment',
  SYSTEM = 'system',
}

/**
 * Common actions for audit logging
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  COMPLETE = 'complete',
  VERIFY = 'verify',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  STATUS_CHANGE = 'status_change',
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

/**
 * Extract session ID from request (can be JWT token ID or session token)
 */
function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Return first 20 characters of token as session identifier
    return authHeader.substring(7, 27);
  }
  return undefined;
}

/**
 * Compare two objects and return changed fields and their old/new values
 */
function getChanges(oldData: any, newData: any): {
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
} {
  const changedFields: string[] = [];
  const oldValues: Record<string, any> = {};
  const newValues: Record<string, any> = {};

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  for (const key of allKeys) {
    // Skip certain fields that shouldn't be logged
    if (['password', 'token', 'secret', 'updatedAt'].includes(key)) {
      continue;
    }

    const oldValue = oldData?.[key];
    const newValue = newData?.[key];

    // Check if values are different
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields.push(key);
      oldValues[key] = oldValue;
      newValues[key] = newValue;
    }
  }

  return { changedFields, oldValues, newValues };
}

/**
 * Log an audit entry
 */
export async function logAudit(params: {
  req: Request | AuthRequest;
  action: string;
  actionCategory: string;
  actionDescription?: string;
  entityType: string;
  entityId?: number;
  entityIdentifier?: string;
  oldValues?: any;
  newValues?: any;
  success?: boolean;
  errorMessage?: string;
  statusCode?: number;
  additionalData?: any;
}): Promise<void> {
  try {
    const authReq = params.req as AuthRequest;
    
    // Extract user information
    const userId = authReq.user?.id;
    const userName = authReq.user
      ? `${authReq.user.firstName} ${authReq.user.lastName}`
      : undefined;
    const userEmail = authReq.user?.email;

    // Calculate changed fields if both old and new values provided
    let changedFields: string | undefined;
    let oldValuesJson: string | undefined;
    let newValuesJson: string | undefined;

    if (params.oldValues && params.newValues) {
      const changes = getChanges(params.oldValues, params.newValues);
      changedFields = changes.changedFields.join(', ');
      oldValuesJson = JSON.stringify(changes.oldValues);
      newValuesJson = JSON.stringify(changes.newValues);
    } else if (params.oldValues) {
      oldValuesJson = JSON.stringify(params.oldValues);
    } else if (params.newValues) {
      newValuesJson = JSON.stringify(params.newValues);
    }

    // Create audit log entry
    const entry: AuditLogEntry = {
      userId,
      userName,
      userEmail,
      action: params.action,
      actionCategory: params.actionCategory,
      actionDescription: params.actionDescription,
      entityType: params.entityType,
      entityId: params.entityId,
      entityIdentifier: params.entityIdentifier,
      oldValues: oldValuesJson,
      newValues: newValuesJson,
      changedFields,
      ipAddress: getIpAddress(params.req),
      userAgent: getUserAgent(params.req),
      requestMethod: params.req.method,
      requestUrl: params.req.originalUrl || params.req.url,
      success: params.success !== undefined ? params.success : true,
      errorMessage: params.errorMessage,
      statusCode: params.statusCode,
      sessionId: getSessionId(params.req),
      additionalData: params.additionalData ? JSON.stringify(params.additionalData) : undefined,
    };

    // Insert audit log entry (non-blocking)
    await AuditLogModel.create(entry);
  } catch (error) {
    // Log error but don't throw to avoid breaking the main operation
    console.error('Failed to create audit log entry:', error);
  }
}

/**
 * Log a successful create operation
 */
export async function logCreate(params: {
  req: Request | AuthRequest;
  actionCategory: string;
  entityType: string;
  entityId: number;
  entityIdentifier?: string;
  newValues?: any;
  actionDescription?: string;
}): Promise<void> {
  await logAudit({
    req: params.req,
    action: AuditAction.CREATE,
    actionCategory: params.actionCategory,
    actionDescription: params.actionDescription || `Created ${params.entityType}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityIdentifier: params.entityIdentifier,
    newValues: params.newValues,
    success: true,
  });
}

/**
 * Log a successful update operation
 */
export async function logUpdate(params: {
  req: Request | AuthRequest;
  actionCategory: string;
  entityType: string;
  entityId: number;
  entityIdentifier?: string;
  oldValues?: any;
  newValues?: any;
  actionDescription?: string;
}): Promise<void> {
  await logAudit({
    req: params.req,
    action: AuditAction.UPDATE,
    actionCategory: params.actionCategory,
    actionDescription: params.actionDescription || `Updated ${params.entityType}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityIdentifier: params.entityIdentifier,
    oldValues: params.oldValues,
    newValues: params.newValues,
    success: true,
  });
}

/**
 * Log a successful delete operation
 */
export async function logDelete(params: {
  req: Request | AuthRequest;
  actionCategory: string;
  entityType: string;
  entityId: number;
  entityIdentifier?: string;
  oldValues?: any;
  actionDescription?: string;
}): Promise<void> {
  await logAudit({
    req: params.req,
    action: AuditAction.DELETE,
    actionCategory: params.actionCategory,
    actionDescription: params.actionDescription || `Deleted ${params.entityType}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityIdentifier: params.entityIdentifier,
    oldValues: params.oldValues,
    success: true,
  });
}

/**
 * Log a failed operation
 */
export async function logFailure(params: {
  req: Request | AuthRequest;
  action: string;
  actionCategory: string;
  entityType: string;
  entityId?: number;
  errorMessage: string;
  statusCode?: number;
}): Promise<void> {
  await logAudit({
    req: params.req,
    action: params.action,
    actionCategory: params.actionCategory,
    actionDescription: `Failed to ${params.action} ${params.entityType}`,
    entityType: params.entityType,
    entityId: params.entityId,
    success: false,
    errorMessage: params.errorMessage,
    statusCode: params.statusCode,
  });
}
