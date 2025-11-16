import { getConnection, sql } from '../config/database';

export interface Department {
  id?: number;
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  managerName?: string; // Populated when fetched with manager info
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  createdBy: number;
}

export class DepartmentModel {
  /**
   * Create a new department
   */
  static async create(departmentData: CreateDepartmentData): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('name', sql.NVarChar, departmentData.name)
      .input('code', sql.NVarChar, departmentData.code.toUpperCase())
      .input('description', sql.NVarChar, departmentData.description)
      .input('managerId', sql.Int, departmentData.managerId)
      .input('createdBy', sql.Int, departmentData.createdBy)
      .query(`
        INSERT INTO Departments (name, code, description, managerId, active, createdBy)
        OUTPUT INSERTED.id
        VALUES (@name, @code, @description, @managerId, 1, @createdBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Find department by ID
   */
  static async findById(id: number): Promise<Department | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          d.*,
          CONCAT(u.firstName, ' ', u.lastName) as managerName
        FROM Departments d
        LEFT JOIN Users u ON d.managerId = u.id
        WHERE d.id = @id AND d.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find department by code
   */
  static async findByCode(code: string): Promise<Department | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query(`
        SELECT 
          d.*,
          CONCAT(u.firstName, ' ', u.lastName) as managerName
        FROM Departments d
        LEFT JOIN Users u ON d.managerId = u.id
        WHERE d.code = @code AND d.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find department by name
   */
  static async findByName(name: string): Promise<Department | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query(`
        SELECT 
          d.*,
          CONCAT(u.firstName, ' ', u.lastName) as managerName
        FROM Departments d
        LEFT JOIN Users u ON d.managerId = u.id
        WHERE d.name = @name AND d.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Get all active departments
   */
  static async findAll(): Promise<Department[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          d.*,
          CONCAT(u.firstName, ' ', u.lastName) as managerName
        FROM Departments d
        LEFT JOIN Users u ON d.managerId = u.id
        WHERE d.active = 1
        ORDER BY d.name
      `);

    return result.recordset;
  }

  /**
   * Update department information
   */
  static async update(id: number, updates: Partial<Department>): Promise<void> {
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
    if (updates.managerId !== undefined) {
      request.input('managerId', sql.Int, updates.managerId);
      fields.push('managerId = @managerId');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Departments SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Soft delete department
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Departments SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Check if department code exists
   */
  static async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('code', sql.NVarChar, code.toUpperCase());
    
    let query = 'SELECT COUNT(*) as count FROM Departments WHERE code = @code AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Check if department name exists
   */
  static async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('name', sql.NVarChar, name);
    
    let query = 'SELECT COUNT(*) as count FROM Departments WHERE name = @name AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }
}
