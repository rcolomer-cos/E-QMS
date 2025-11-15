import { getConnection, sql } from '../config/database';
import { Role } from '../types';

export class RoleModel {
  /**
   * Get all active roles
   */
  static async findAll(): Promise<Role[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT * FROM Roles WHERE active = 1 ORDER BY level DESC');

    return result.recordset;
  }

  /**
   * Find role by ID
   */
  static async findById(id: number): Promise<Role | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Roles WHERE id = @id AND active = 1');

    return result.recordset[0] || null;
  }

  /**
   * Find role by name
   */
  static async findByName(name: string): Promise<Role | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Roles WHERE name = @name AND active = 1');

    return result.recordset[0] || null;
  }

  /**
   * Get roles by IDs
   */
  static async findByIds(roleIds: number[]): Promise<Role[]> {
    if (roleIds.length === 0) return [];

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('roleIds', sql.NVarChar, roleIds.join(','))
      .query(`
        SELECT * FROM Roles 
        WHERE id IN (SELECT value FROM STRING_SPLIT(@roleIds, ','))
          AND active = 1
        ORDER BY level DESC
      `);

    return result.recordset;
  }

  /**
   * Create a new role (admin function)
   */
  static async create(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, role.name)
      .input('displayName', sql.NVarChar, role.displayName)
      .input('description', sql.NVarChar, role.description)
      .input('level', sql.Int, role.level)
      .query(`
        INSERT INTO Roles (name, displayName, description, level, active)
        OUTPUT INSERTED.id
        VALUES (@name, @displayName, @description, @level, 1)
      `);

    return result.recordset[0].id;
  }

  /**
   * Update role
   */
  static async update(id: number, updates: Partial<Role>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    if (updates.displayName) {
      request.input('displayName', sql.NVarChar, updates.displayName);
      fields.push('displayName = @displayName');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      fields.push('description = @description');
    }
    if (updates.level !== undefined) {
      request.input('level', sql.Int, updates.level);
      fields.push('level = @level');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Roles SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Deactivate role (soft delete)
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Roles SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Get role permission level
   */
  static async getRoleLevel(roleId: number): Promise<number> {
    const role = await this.findById(roleId);
    return role ? role.level : 0;
  }

  /**
   * Check if role exists
   */
  static async exists(name: string): Promise<boolean> {
    const role = await this.findByName(name);
    return role !== null;
  }
}
