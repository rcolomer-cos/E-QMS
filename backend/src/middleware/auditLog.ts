import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { logAudit } from '../services/auditLogService';

/**
 * Middleware to log API requests and responses
 * This middleware captures the response and logs it to the audit trail
 */
export function auditLogMiddleware(
  actionCategory: string,
  entityType: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    // Store original json and status methods
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;
    let responseData: any = null;

    // Override status method to capture status code
    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    // Override json method to capture response data
    res.json = function (data: any) {
      responseData = data;

      // Log the audit entry after the response is sent
      setImmediate(() => {
        logAuditFromResponse(
          authReq,
          actionCategory,
          entityType,
          statusCode,
          responseData
        );
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * Helper function to log audit entry from response
 */
async function logAuditFromResponse(
  req: AuthRequest,
  actionCategory: string,
  entityType: string,
  statusCode: number,
  responseData: any
): Promise<void> {
  try {
    // Determine action from HTTP method
    let action = 'unknown';
    const method = req.method;

    if (method === 'POST') {
      action = 'create';
    } else if (method === 'PUT' || method === 'PATCH') {
      action = 'update';
    } else if (method === 'DELETE') {
      action = 'delete';
    } else if (method === 'GET') {
      // Don't log GET requests to reduce noise
      return;
    }

    // Determine success based on status code
    const success = statusCode >= 200 && statusCode < 400;

    // Extract entity ID from params or response
    let entityId: number | undefined;
    let entityIdentifier: string | undefined;

    if (req.params.id) {
      entityId = parseInt(req.params.id, 10);
    } else if (responseData?.id) {
      entityId = responseData.id;
    } else if (responseData?.userId) {
      entityId = responseData.userId;
    }

    // Extract entity identifier if available
    if (responseData?.email) {
      entityIdentifier = responseData.email;
    } else if (responseData?.title) {
      entityIdentifier = responseData.title;
    } else if (responseData?.name) {
      entityIdentifier = responseData.name;
    } else if (responseData?.ncrNumber) {
      entityIdentifier = responseData.ncrNumber;
    } else if (responseData?.capaNumber) {
      entityIdentifier = responseData.capaNumber;
    }

    // Build action description
    let actionDescription = `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType}`;
    if (entityIdentifier) {
      actionDescription += ` (${entityIdentifier})`;
    }

    // For updates, capture old values if available
    let oldValues: any;
    let newValues: any;

    if (action === 'update' && req.body) {
      newValues = req.body;
    } else if (action === 'create' && req.body) {
      newValues = req.body;
    }

    // Log the audit entry
    await logAudit({
      req,
      action,
      actionCategory,
      actionDescription,
      entityType,
      entityId,
      entityIdentifier,
      oldValues,
      newValues,
      success,
      errorMessage: !success ? responseData?.error || responseData?.message : undefined,
      statusCode,
    });
  } catch (error) {
    // Don't throw errors from audit logging
    console.error('Error in audit log middleware:', error);
  }
}

/**
 * Standalone audit log function for manual logging within controllers
 * Use this when you need more control over what gets logged
 */
export { logAudit, logCreate, logUpdate, logDelete, logFailure } from '../services/auditLogService';
export { AuditActionCategory, AuditAction } from '../services/auditLogService';
