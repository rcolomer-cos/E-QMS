import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import * as syncController from '../controllers/syncController';
import { UserRole } from '../types';

const router = Router();

/**
 * Sync Configuration Routes
 */

// Get all sync configurations
router.get(
  '/configurations',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.getAllConfigurations
);

// Get sync configuration by ID
router.get(
  '/configurations/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.getConfigurationById
);

// Create new sync configuration
router.post(
  '/configurations',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  syncController.createConfiguration
);

// Update sync configuration
router.put(
  '/configurations/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.updateConfiguration
);

// Delete sync configuration
router.delete(
  '/configurations/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  syncController.deleteConfiguration
);

/**
 * Sync Execution Routes
 */

// Execute sync run manually
router.post(
  '/configurations/:id/execute',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.executeSyncRun
);

// Get sync status
router.get(
  '/configurations/:id/status',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  syncController.getSyncStatus
);

// Get delta changes
router.get(
  '/configurations/:id/delta',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.getDeltaChanges
);

/**
 * Sync Logs Routes
 */

// Get sync logs for a configuration
router.get(
  '/configurations/:id/logs',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR),
  syncController.getSyncLogs
);

// Retry a failed sync run
router.post(
  '/logs/:logId/retry',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.retrySyncRun
);

/**
 * Conflict Resolution Routes
 */

// Get sync conflicts for a configuration
router.get(
  '/configurations/:id/conflicts',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.getSyncConflicts
);

// Resolve a sync conflict
router.post(
  '/conflicts/:conflictId/resolve',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  syncController.resolveConflict
);

export default router;
