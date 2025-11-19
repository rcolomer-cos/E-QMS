import { Response } from 'express';
import { ModuleVisibilityModel } from '../models/ModuleVisibilityModel';
import { AuthRequest, UserRole } from '../types';
import { validationResult } from 'express-validator';
import { logUpdate, AuditActionCategory } from '../services/auditLogService';

/**
 * Get all module visibility settings
 */
export const getAllModules = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const modules = await ModuleVisibilityModel.findAll();
    res.json(modules);
  } catch (error) {
    console.error('Get all modules error:', error);
    res.status(500).json({ error: 'Failed to get module visibility settings' });
  }
};

/**
 * Get enabled modules only
 */
export const getEnabledModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // If user is admin or superuser, return all modules regardless of visibility
    if (req.user) {
      const userRoles = req.user.roles || [];
      const isAdmin = userRoles.some(role => 
        role === UserRole.ADMIN || role === UserRole.SUPERUSER
      );
      
      if (isAdmin) {
        const modules = await ModuleVisibilityModel.findAll();
        res.json(modules);
        return;
      }
    }

    // For non-admin users, return only enabled modules
    const modules = await ModuleVisibilityModel.findEnabled();
    res.json(modules);
  } catch (error) {
    console.error('Get enabled modules error:', error);
    res.status(500).json({ error: 'Failed to get enabled modules' });
  }
};

/**
 * Get a single module by key
 */
export const getModuleByKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const module = await ModuleVisibilityModel.findByKey(key);
    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    res.json(module);
  } catch (error) {
    console.error('Get module by key error:', error);
    res.status(500).json({ error: 'Failed to get module' });
  }
};

/**
 * Update module visibility
 */
export const updateModuleVisibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { key } = req.params;
    const { isEnabled } = req.body;

    // Get old value for audit log
    const oldModule = await ModuleVisibilityModel.findByKey(key);
    if (!oldModule) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    // Update the module visibility
    const updated = await ModuleVisibilityModel.updateVisibility(key, isEnabled);

    if (!updated) {
      res.status(400).json({ error: 'Failed to update module visibility' });
      return;
    }

    // Get updated value
    const newModule = await ModuleVisibilityModel.findByKey(key);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'ModuleVisibility',
      entityId: oldModule.id!,
      entityIdentifier: key,
      oldValues: { isEnabled: oldModule.isEnabled },
      newValues: { isEnabled: isEnabled },
    });

    res.json({
      message: 'Module visibility updated successfully',
      module: newModule,
    });
  } catch (error) {
    console.error('Update module visibility error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update module visibility' 
    });
  }
};

/**
 * Batch update multiple module visibility settings
 */
export const batchUpdateModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { modules } = req.body;

    if (!Array.isArray(modules) || modules.length === 0) {
      res.status(400).json({ error: 'Modules array is required and must not be empty' });
      return;
    }

    // Get old values for audit log
    const oldValues: Record<string, boolean> = {};
    for (const update of modules) {
      const oldModule = await ModuleVisibilityModel.findByKey(update.key);
      if (oldModule) {
        oldValues[update.key] = oldModule.isEnabled;
      }
    }

    // Batch update
    await ModuleVisibilityModel.batchUpdate(modules);

    // Get new values
    const newValues: Record<string, boolean> = {};
    for (const update of modules) {
      const newModule = await ModuleVisibilityModel.findByKey(update.key);
      if (newModule) {
        newValues[update.key] = newModule.isEnabled;
      }
    }

    // Log audit entry for batch update
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'ModuleVisibility',
      entityId: 0, // Use 0 for batch operations
      entityIdentifier: 'Batch Update',
      oldValues,
      newValues,
    });

    res.json({
      message: `${modules.length} modules updated successfully`,
      updatedCount: modules.length,
    });
  } catch (error) {
    console.error('Batch update modules error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to batch update modules' 
    });
  }
};
