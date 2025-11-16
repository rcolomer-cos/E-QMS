import { getConnection, sql } from '../config/database';

export interface Process {
  id?: number;
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  departmentName?: string; // Populated when fetched with department info
  processCategory?: string;
  objective?: string;
  scope?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export interface CreateProcessData {
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  processCategory?: string;
  objective?: string;
  scope?: string;
  createdBy: number;
}

export class ProcessModel {
  /**
   * Create a new process
   */
  static async create(processData: CreateProcessData): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('name', sql.NVarChar, processData.name)
      .input('code', sql.NVarChar, processData.code.toUpperCase())
      .input('description', sql.NVarChar, processData.description)
      .input('departmentId', sql.Int, processData.departmentId)
      .input('processCategory', sql.NVarChar, processData.processCategory)
      .input('objective', sql.NVarChar, processData.objective)
      .input('scope', sql.NVarChar, processData.scope)
      .input('createdBy', sql.Int, processData.createdBy)
      .query(`
        INSERT INTO Processes (name, code, description, departmentId, processCategory, objective, scope, active, createdBy)
        OUTPUT INSERTED.id
        VALUES (@name, @code, @description, @departmentId, @processCategory, @objective, @scope, 1, @createdBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Find process by ID
   */
  static async findById(id: number): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          p.*,
          d.name as departmentName
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.id = @id AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find process by code
   */
  static async findByCode(code: string): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query(`
        SELECT 
          p.*,
          d.name as departmentName
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.code = @code AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find process by name
   */
  static async findByName(name: string): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query(`
        SELECT 
          p.*,
          d.name as departmentName
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.name = @name AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Get all active processes
   */
  static async findAll(): Promise<Process[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          p.*,
          d.name as departmentName
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.active = 1
        ORDER BY p.name
      `);

    return result.recordset;
  }

  /**
   * Update process information
   */
  static async update(id: number, updates: Partial<Process>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    if (updates.name) {
      request.input('name', sql.NVarChar, updates.name);
      fields.push('name = @name');
    }
    if (updates.code) {
      request.input('code', sql.NVarChar, updates.code.toUpperCase());
      fields.push('code = @code');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      fields.push('description = @description');
    }
    if (updates.departmentId !== undefined) {
      request.input('departmentId', sql.Int, updates.departmentId);
      fields.push('departmentId = @departmentId');
    }
    if (updates.processCategory !== undefined) {
      request.input('processCategory', sql.NVarChar, updates.processCategory);
      fields.push('processCategory = @processCategory');
    }
    if (updates.objective !== undefined) {
      request.input('objective', sql.NVarChar, updates.objective);
      fields.push('objective = @objective');
    }
    if (updates.scope !== undefined) {
      request.input('scope', sql.NVarChar, updates.scope);
      fields.push('scope = @scope');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Processes SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Soft delete process
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Processes SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Check if process code exists
   */
  static async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('code', sql.NVarChar, code.toUpperCase());
    
    let query = 'SELECT COUNT(*) as count FROM Processes WHERE code = @code AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Check if process name exists
   */
  static async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('name', sql.NVarChar, name);
    
    let query = 'SELECT COUNT(*) as count FROM Processes WHERE name = @name AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }
}
