import { getConnection, sql } from '../config/database';

export interface SystemSetting {
  id?: number;
  settingKey: string;
  settingValue: string | null;
  settingType: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'notifications' | 'audit' | 'backup' | 'permissions';
  displayName: string;
  description?: string;
  isEditable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SystemSettingsFilters {
  category?: string;
  isEditable?: boolean;
}

export class SystemSettingsModel {
  /**
   * Get all system settings with optional filters
   */
  static async findAll(filters?: SystemSettingsFilters): Promise<SystemSetting[]> {
    const pool = await getConnection();
    let query = 'SELECT * FROM system_settings WHERE 1=1';
    const request = pool.request();

    if (filters?.category) {
      query += ' AND category = @category';
      request.input('category', sql.NVarChar, filters.category);
    }

    if (filters?.isEditable !== undefined) {
      query += ' AND is_editable = @isEditable';
      request.input('isEditable', sql.Bit, filters.isEditable);
    }

    query += ' ORDER BY category, display_name';

    const result = await request.query(query);

    return result.recordset.map((row: {
      id: number;
      setting_key: string;
      setting_value: string | null;
      setting_type: string;
      category: string;
      display_name: string;
      description?: string;
      is_editable: boolean;
      created_at?: Date;
      updated_at?: Date;
    }): SystemSetting => ({
      id: row.id,
      settingKey: row.setting_key,
      settingValue: row.setting_value,
      settingType: row.setting_type as SystemSetting['settingType'],
      category: row.category as SystemSetting['category'],
      displayName: row.display_name,
      description: row.description,
      isEditable: row.is_editable,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get a single setting by key
   */
  static async findByKey(key: string): Promise<SystemSetting | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('key', sql.NVarChar, key)
      .query('SELECT * FROM system_settings WHERE setting_key = @key');

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    return {
      id: row.id,
      settingKey: row.setting_key,
      settingValue: row.setting_value,
      settingType: row.setting_type,
      category: row.category,
      displayName: row.display_name,
      description: row.description,
      isEditable: row.is_editable,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update a setting value
   */
  static async update(key: string, value: string): Promise<boolean> {
    const pool = await getConnection();

    // First check if the setting is editable
    const setting = await this.findByKey(key);
    if (!setting) {
      throw new Error(`Setting with key '${key}' not found`);
    }

    if (!setting.isEditable) {
      throw new Error(`Setting '${key}' is not editable`);
    }

    const result = await pool
      .request()
      .input('key', sql.NVarChar, key)
      .input('value', sql.NVarChar, value)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE system_settings 
        SET setting_value = @value, updated_at = @updatedAt
        WHERE setting_key = @key AND is_editable = 1
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Create a new system setting
   */
  static async create(setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('settingKey', sql.NVarChar, setting.settingKey)
      .input('settingValue', sql.NVarChar, setting.settingValue)
      .input('settingType', sql.NVarChar, setting.settingType)
      .input('category', sql.NVarChar, setting.category)
      .input('displayName', sql.NVarChar, setting.displayName)
      .input('description', sql.NVarChar, setting.description)
      .input('isEditable', sql.Bit, setting.isEditable)
      .query(`
        INSERT INTO system_settings (
          setting_key, setting_value, setting_type, category, 
          display_name, description, is_editable
        )
        OUTPUT INSERTED.id
        VALUES (
          @settingKey, @settingValue, @settingType, @category,
          @displayName, @description, @isEditable
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Delete a system setting (only if editable)
   */
  static async delete(key: string): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('key', sql.NVarChar, key)
      .query('DELETE FROM system_settings WHERE setting_key = @key AND is_editable = 1');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Get settings grouped by category
   */
  static async findByCategory(): Promise<Record<string, SystemSetting[]>> {
    const settings = await this.findAll();
    
    return settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, SystemSetting[]>);
  }

  /**
   * Batch update multiple settings
   */
  static async batchUpdate(updates: { key: string; value: string }[]): Promise<void> {
    const pool = await getConnection();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      for (const update of updates) {
        // Verify setting is editable before updating
        const setting = await this.findByKey(update.key);
        if (!setting) {
          throw new Error(`Setting with key '${update.key}' not found`);
        }
        if (!setting.isEditable) {
          throw new Error(`Setting '${update.key}' is not editable`);
        }

        await transaction
          .request()
          .input('key', sql.NVarChar, update.key)
          .input('value', sql.NVarChar, update.value)
          .input('updatedAt', sql.DateTime, new Date())
          .query(`
            UPDATE system_settings 
            SET setting_value = @value, updated_at = @updatedAt
            WHERE setting_key = @key
          `);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
