import { Response } from 'express';
import { SystemSettingsModel } from '../models/SystemSettingsModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logUpdate, AuditActionCategory } from '../services/auditLogService';

/**
 * Get all system settings
 */
export const getSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, isEditable } = req.query;

    const filters = {
      category: category as string | undefined,
      isEditable: isEditable === 'true' ? true : isEditable === 'false' ? false : undefined,
    };

    const settings = await SystemSettingsModel.findAll(filters);

    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
};

/**
 * Get settings grouped by category
 */
export const getSystemSettingsByCategory = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settingsByCategory = await SystemSettingsModel.findByCategory();

    res.json(settingsByCategory);
  } catch (error) {
    console.error('Get system settings by category error:', error);
    res.status(500).json({ error: 'Failed to get system settings by category' });
  }
};

/**
 * Get a single setting by key
 */
export const getSystemSettingByKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const setting = await SystemSettingsModel.findByKey(key);
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    res.json(setting);
  } catch (error) {
    console.error('Get system setting by key error:', error);
    res.status(500).json({ error: 'Failed to get system setting' });
  }
};

/**
 * Update a system setting
 */
export const updateSystemSetting = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { value } = req.body;

    // Get old value for audit log
    const oldSetting = await SystemSettingsModel.findByKey(key);
    if (!oldSetting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    // Update the setting
    const updated = await SystemSettingsModel.update(key, value);

    if (!updated) {
      res.status(400).json({ error: 'Failed to update setting. It may not be editable.' });
      return;
    }

    // Get updated value
    const newSetting = await SystemSettingsModel.findByKey(key);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'SystemSetting',
      entityId: oldSetting.id!,
      entityIdentifier: key,
      oldValues: { settingValue: oldSetting.settingValue },
      newValues: { settingValue: value },
    });

    res.json({
      message: 'Setting updated successfully',
      setting: newSetting,
    });
  } catch (error) {
    console.error('Update system setting error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update system setting' 
    });
  }
};

/**
 * Batch update multiple settings
 */
export const batchUpdateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      res.status(400).json({ error: 'Settings array is required and must not be empty' });
      return;
    }

    // Get old values for audit log
    const oldValues: Record<string, string | null> = {};
    for (const update of settings) {
      const oldSetting = await SystemSettingsModel.findByKey(update.key);
      if (oldSetting) {
        oldValues[update.key] = oldSetting.settingValue;
      }
    }

    // Batch update
    await SystemSettingsModel.batchUpdate(settings);

    // Get new values
    const newValues: Record<string, string | null> = {};
    for (const update of settings) {
      const newSetting = await SystemSettingsModel.findByKey(update.key);
      if (newSetting) {
        newValues[update.key] = newSetting.settingValue;
      }
    }

    // Log audit entry for batch update
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'SystemSettings',
      entityId: 0, // Use 0 for batch operations
      entityIdentifier: 'Batch Update',
      oldValues,
      newValues,
    });

    res.json({
      message: `${settings.length} settings updated successfully`,
      updatedCount: settings.length,
    });
  } catch (error) {
    console.error('Batch update system settings error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to batch update system settings' 
    });
  }
};
