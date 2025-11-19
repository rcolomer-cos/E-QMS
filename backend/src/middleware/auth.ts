import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';
import { config } from '../config';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
      roleIds: number[];
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Helper function to normalize role names for comparison
const normalizeRole = (roleName: string): string => {
  const normalized = roleName.toLowerCase().trim();
  if (normalized === 'administrator' || normalized.startsWith('admin')) return 'admin';
  if (normalized === 'super user' || normalized === 'super-user' || normalized.startsWith('super')) return 'superuser';
  if (normalized.startsWith('manager')) return 'manager';
  if (normalized.startsWith('auditor')) return 'auditor';
  if (normalized.startsWith('viewer')) return 'viewer';
  return normalized;
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Normalize user roles and allowed roles for comparison
    const normalizedUserRoles = req.user.roles.map(role => normalizeRole(role));
    const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));

    // Debug logging
    console.log('Authorization Check:');
    console.log('  User roles (raw):', req.user.roles);
    console.log('  User roles (normalized):', normalizedUserRoles);
    console.log('  Allowed roles (raw):', allowedRoles);
    console.log('  Allowed roles (normalized):', normalizedAllowedRoles);

    // Check if user has any of the allowed roles
    const hasRole = normalizedUserRoles.some(role => 
      normalizedAllowedRoles.includes(role)
    );

    console.log('  Has required role:', hasRole);

    if (!hasRole) {
      res.status(403).json({ error: 'Access denied: insufficient permissions' });
      return;
    }

    next();
  };
};
