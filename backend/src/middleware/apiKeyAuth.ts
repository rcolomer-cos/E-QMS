import { Response, NextFunction } from 'express';
import { ApiKeyModel } from '../models/ApiKeyModel';
import { AuthRequest } from '../types';

/**
 * Middleware to authenticate requests using API keys
 * Checks for API key in the X-API-Key header
 */
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    // Verify the API key
    const keyData = await ApiKeyModel.verify(apiKey);

    if (!keyData) {
      res.status(401).json({ error: 'Invalid or expired API key' });
      return;
    }

    // Check if key is active
    if (!keyData.active) {
      res.status(401).json({ error: 'API key has been revoked' });
      return;
    }

    // Check expiration
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      res.status(401).json({ error: 'API key has expired' });
      return;
    }

    // Check IP restrictions if configured
    if (keyData.allowedIPs) {
      const allowedIPs = JSON.parse(keyData.allowedIPs) as string[];
      const clientIP = req.ip || req.socket.remoteAddress || '';
      
      // Clean up IPv6-mapped IPv4 addresses
      const normalizedClientIP = clientIP.replace(/^::ffff:/, '');
      
      const isAllowed = allowedIPs.some(ip => {
        // Simple exact match for now
        // Could be extended to support CIDR notation
        return normalizedClientIP === ip || clientIP === ip;
      });

      if (!isAllowed) {
        res.status(403).json({ error: 'Access denied: IP address not allowed' });
        return;
      }
    }

    // Update last used information (fire and forget)
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    ApiKeyModel.updateLastUsed(keyData.id, clientIP).catch(err => {
      console.error('Error updating API key last used:', err);
    });

    // Attach key info to request for use in route handlers
    req.apiKey = {
      id: keyData.id,
      name: keyData.name,
      scopes: keyData.scopes ? JSON.parse(keyData.scopes) : [],
      createdBy: keyData.createdBy,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if API key has required scopes
 */
export const requireApiKeyScopes = (...requiredScopes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({ error: 'API key authentication required' });
      return;
    }

    const keyScopes = req.apiKey.scopes || [];

    // Check if key has all required scopes
    const hasAllScopes = requiredScopes.every(scope => 
      keyScopes.includes(scope) || keyScopes.includes('*')
    );

    if (!hasAllScopes) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredScopes,
        available: keyScopes,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to allow either JWT or API key authentication
 */
export const authenticateFlexible = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check for API key first
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }

  // Fall back to JWT authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // Import JWT auth middleware dynamically to avoid circular deps
    const { authenticateToken } = await import('./auth');
    return authenticateToken(req, res, next);
  }

  res.status(401).json({ error: 'Authentication required (JWT or API key)' });
};
