import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuditorAccessTokenService } from '../services/auditorAccessTokenService';
import { logAudit, AuditActionCategory, AuditAction } from '../services/auditLogService';

/**
 * Extended request interface for auditor token access
 */
export interface AuditorTokenRequest extends AuthRequest {
  auditorToken?: {
    id: number;
    auditorName: string;
    auditorEmail: string;
    scopeType: string;
    scopeEntityId?: number;
    allowedResources?: string[];
  };
  isReadOnly?: boolean;
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: AuthRequest): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    undefined
  );
}

/**
 * Middleware to authenticate using auditor access token
 * This provides read-only access for external auditors
 */
export const authenticateAuditorToken = async (
  req: AuditorTokenRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for token in Authorization header (Bearer token format)
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('AuditorToken ')) {
      res.status(401).json({ error: 'Auditor access token required' });
      return;
    }
    
    const token = authHeader.substring(13); // Remove 'AuditorToken ' prefix
    
    if (!token) {
      res.status(401).json({ error: 'Auditor access token required' });
      return;
    }
    
    // Validate token
    const ipAddress = getIpAddress(req);
    const tokenData = await AuditorAccessTokenService.validateToken(token, ipAddress);
    
    if (!tokenData) {
      // Log failed access attempt
      await logAudit({
        req,
        action: AuditAction.VIEW,
        actionCategory: AuditActionCategory.AUTHENTICATION,
        actionDescription: 'Failed auditor token authentication - invalid or expired token',
        entityType: 'AuditorAccessToken',
        success: false,
        errorMessage: 'Invalid or expired auditor access token',
        statusCode: 403,
      });
      
      res.status(403).json({ error: 'Invalid or expired auditor access token' });
      return;
    }
    
    // Attach token information to request
    req.auditorToken = {
      id: tokenData.id,
      auditorName: tokenData.auditorName,
      auditorEmail: tokenData.auditorEmail,
      scopeType: tokenData.scopeType,
      scopeEntityId: tokenData.scopeEntityId,
      allowedResources: tokenData.allowedResources,
    };
    
    // Mark request as read-only
    req.isReadOnly = true;
    
    // Log successful token authentication
    await logAudit({
      req,
      action: AuditAction.VIEW,
      actionCategory: AuditActionCategory.AUTHENTICATION,
      actionDescription: `Auditor token authenticated - ${tokenData.auditorName} (${tokenData.auditorEmail})`,
      entityType: 'AuditorAccessToken',
      entityId: tokenData.id,
      entityIdentifier: tokenData.tokenPreview,
      success: true,
      statusCode: 200,
    });
    
    next();
  } catch (error) {
    console.error('Auditor token authentication error:', error);
    res.status(500).json({ error: 'Failed to authenticate auditor token' });
  }
};

/**
 * Middleware to enforce read-only access
 * Rejects any non-GET requests for auditor token access
 */
export const enforceReadOnly = (
  req: AuditorTokenRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.isReadOnly && req.method !== 'GET') {
    res.status(403).json({ 
      error: 'Read-only access: Only GET requests are allowed with auditor tokens',
      method: req.method,
      path: req.path,
    });
    return;
  }
  
  next();
};

/**
 * Middleware to check resource access scope
 * Validates that the requested resource is within the token's scope
 */
export const checkResourceScope = (resourceType: string) => {
  return (req: AuditorTokenRequest, res: Response, next: NextFunction): void => {
    // Skip scope check if not using auditor token
    if (!req.auditorToken) {
      next();
      return;
    }
    
    const { scopeType, scopeEntityId, allowedResources } = req.auditorToken;
    
    // Full read-only access allows everything
    if (scopeType === 'full_read_only') {
      next();
      return;
    }
    
    // Check if resource type is in allowed resources
    if (allowedResources && !allowedResources.includes(resourceType)) {
      res.status(403).json({ 
        error: `Access denied: ${resourceType} is not in the allowed resources for this token`,
        allowedResources,
      });
      return;
    }
    
    // For specific scope types, validate entity ID
    if (scopeType.startsWith('specific_') && scopeEntityId) {
      const requestedId = parseInt(req.params.id, 10);
      
      if (requestedId && requestedId !== scopeEntityId) {
        res.status(403).json({ 
          error: `Access denied: Token is scoped to ${scopeType} with ID ${scopeEntityId}`,
          requestedId,
          allowedId: scopeEntityId,
        });
        return;
      }
    }
    
    next();
  };
};

/**
 * Combined middleware for auditor token authentication with automatic read-only enforcement
 */
export const auditorTokenAuth = [authenticateAuditorToken, enforceReadOnly];

/**
 * Middleware to log resource access for auditor tokens
 */
export const logAuditorAccess = (resourceType: string) => {
  return async (req: AuditorTokenRequest, res: Response, next: NextFunction): Promise<void> => {
    // Only log for auditor token access
    if (!req.auditorToken) {
      next();
      return;
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to log after response
    res.json = function (data: any) {
      // Log the access
      setImmediate(async () => {
        try {
          await logAudit({
            req,
            action: AuditAction.VIEW,
            actionCategory: AuditActionCategory.SYSTEM,
            actionDescription: `Auditor ${req.auditorToken?.auditorName} accessed ${resourceType}`,
            entityType: resourceType,
            entityId: req.params.id ? parseInt(req.params.id, 10) : undefined,
            entityIdentifier: req.auditorToken?.auditorEmail,
            success: true,
            statusCode: res.statusCode,
            additionalData: JSON.stringify({
              auditorName: req.auditorToken?.auditorName,
              auditorEmail: req.auditorToken?.auditorEmail,
              scopeType: req.auditorToken?.scopeType,
              path: req.path,
            }),
          });
        } catch (error) {
          console.error('Error logging auditor access:', error);
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
};
