import { getConnection, sql } from '../config/database';

export interface ModuleVisibility {
  id?: number;
  moduleKey: string;
  moduleName: string;
  description?: string;
  isEnabled: boolean;
  icon?: string;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ModuleVisibilityModel {
  /**
   * Get all modules with their visibility settings
   */
  static async findAll(): Promise<ModuleVisibility[]> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .query('SELECT * FROM module_visibility ORDER BY display_order, module_name');

    return result.recordset.map((row: {
      id: number;
      module_key: string;
      module_name: string;
      description?: string;
      is_enabled: boolean;
      icon?: string;
      display_order: number;
      created_at?: Date;
      updated_at?: Date;
    }): ModuleVisibility => ({
      id: row.id,
      moduleKey: row.module_key,
      moduleName: row.module_name,
      description: row.description,
      isEnabled: row.is_enabled,
      icon: row.icon,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get enabled modules only
   */
  static async findEnabled(): Promise<ModuleVisibility[]> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .query('SELECT * FROM module_visibility WHERE is_enabled = 1 ORDER BY display_order, module_name');

    return result.recordset.map((row: {
      id: number;
      module_key: string;
      module_name: string;
      description?: string;
      is_enabled: boolean;
      icon?: string;
      display_order: number;
      created_at?: Date;
      updated_at?: Date;
    }): ModuleVisibility => ({
      id: row.id,
      moduleKey: row.module_key,
      moduleName: row.module_name,
      description: row.description,
      isEnabled: row.is_enabled,
      icon: row.icon,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get a single module by key
   */
  static async findByKey(key: string): Promise<ModuleVisibility | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('key', sql.NVarChar, key)
      .query('SELECT * FROM module_visibility WHERE module_key = @key');

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    return {
      id: row.id,
      moduleKey: row.module_key,
      moduleName: row.module_name,
      description: row.description,
      isEnabled: row.is_enabled,
      icon: row.icon,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Check if a module is enabled
   */
  static async isModuleEnabled(moduleKey: string): Promise<boolean> {
    const module = await this.findByKey(moduleKey);
    return module ? module.isEnabled : true; // Default to true if module not found
  }

  /**
   * Update module visibility
   */
  static async updateVisibility(key: string, isEnabled: boolean): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('key', sql.NVarChar, key)
      .input('isEnabled', sql.Bit, isEnabled)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE module_visibility 
        SET is_enabled = @isEnabled, updated_at = @updatedAt
        WHERE module_key = @key
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Batch update multiple modules
   */
  static async batchUpdate(updates: { key: string; isEnabled: boolean }[]): Promise<void> {
    const pool = await getConnection();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      for (const update of updates) {
        await transaction
          .request()
          .input('key', sql.NVarChar, update.key)
          .input('isEnabled', sql.Bit, update.isEnabled)
          .input('updatedAt', sql.DateTime, new Date())
          .query(`
            UPDATE module_visibility 
            SET is_enabled = @isEnabled, updated_at = @updatedAt
            WHERE module_key = @key
          `);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create a new module visibility entry
   */
  static async create(module: Omit<ModuleVisibility, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('moduleKey', sql.NVarChar, module.moduleKey)
      .input('moduleName', sql.NVarChar, module.moduleName)
      .input('description', sql.NVarChar, module.description)
      .input('isEnabled', sql.Bit, module.isEnabled)
      .input('icon', sql.NVarChar, module.icon)
      .input('displayOrder', sql.Int, module.displayOrder)
      .query(`
        INSERT INTO module_visibility (
          module_key, module_name, description, is_enabled, icon, display_order
        )
        OUTPUT INSERTED.id
        VALUES (
          @moduleKey, @moduleName, @description, @isEnabled, @icon, @displayOrder
        )
      `);

    return result.recordset[0].id;
  }
}
