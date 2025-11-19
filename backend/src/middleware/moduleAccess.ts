import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { ModuleVisibilityModel } from '../models/ModuleVisibilityModel';

/**
 * Middleware to check if a module is accessible by the user
 * Admins and superusers always have access regardless of module visibility
 */
export const checkModuleAccess = (moduleKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Check if user is admin or superuser - they bypass module visibility checks
      const userRoles = req.user.roles || [];
      const isAdmin = userRoles.some(role => 
        role === UserRole.ADMIN || role === UserRole.SUPERUSER
      );

      if (isAdmin) {
        // Admins always have access
        next();
        return;
      }

      // For non-admin users, check if module is enabled
      const isEnabled = await ModuleVisibilityModel.isModuleEnabled(moduleKey);
      
      if (!isEnabled) {
        res.status(403).json({ 
          error: 'This module is not available',
          moduleKey: moduleKey
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Module access check error:', error);
      res.status(500).json({ error: 'Failed to verify module access' });
    }
  };
};

/**
 * Map of route prefixes to module keys
 */
export const MODULE_ROUTE_MAP: Record<string, string> = {
  '/api/documents': 'documents',
  '/api/processes': 'processes',
  '/api/audits': 'audits',
  '/api/audit-findings': 'audits',
  '/api/ncr': 'ncr',
  '/api/capa': 'capa',
  '/api/trainings': 'training',
  '/api/training-matrix': 'training',
  '/api/role-training-requirements': 'training',
  '/api/risks': 'risks',
  '/api/equipment': 'equipment',
  '/api/calibration-records': 'equipment',
  '/api/service-maintenance-records': 'equipment',
  '/api/inspection-plans': 'inspection',
  '/api/inspection-records': 'inspection',
  '/api/inspection-items': 'inspection',
  '/api/improvement-ideas': 'improvements',
  '/api/swot': 'improvements',
};

/**
 * Get module key from request path
 */
export const getModuleKeyFromPath = (path: string): string | null => {
  for (const [prefix, moduleKey] of Object.entries(MODULE_ROUTE_MAP)) {
    if (path.startsWith(prefix)) {
      return moduleKey;
    }
  }
  return null;
};
