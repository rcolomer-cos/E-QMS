import { Response, NextFunction } from 'express';
import { authenticateToken } from './auth';
import { authenticateAuditorToken, AuditorTokenRequest } from './auditorAccessToken';

/**
 * Middleware that accepts either regular JWT authentication or auditor token authentication
 * This allows endpoints to be accessed by both regular users and external auditors with temporary access
 */
export const flexibleAuth = async (
  req: AuditorTokenRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // Check if it's an auditor token
  if (authHeader.startsWith('AuditorToken ')) {
    return authenticateAuditorToken(req, res, next);
  }
  
  // Otherwise, use regular JWT authentication
  if (authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  
  res.status(401).json({ error: 'Invalid authentication format' });
};
