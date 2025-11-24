import { getConnection, sql } from '../config/database';

export interface UserDepartmentAssignment {
  id: number;
  userId: number;
  departmentId: number;
  isPrimary: boolean;
  assignedBy: number;
  assignedAt: string;
  active: boolean;
  // Joined fields
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  departmentCode?: string;
  assignedByName?: string;
}

export interface CreateUserDepartmentData {
  userId: number;
  departmentId: number;
  isPrimary?: boolean;
  assignedBy: number;
}

export interface UpdateUserDepartmentData {
  isPrimary?: boolean;
  active?: boolean;
}

export class UserDepartmentModel {
  /**
   * Get all user-department assignments
   */
  static async findAll(): Promise<UserDepartmentAssignment[]> {
    const pool = await getConnection();
    const query = `
      SELECT 
        ud.id,
        ud.userId,
        ud.departmentId,
        ud.isPrimary,
        ud.assignedBy,
        ud.assignedAt,
        ud.active,
        u.email AS userEmail,
        CONCAT(u.firstName, ' ', u.lastName) AS userName,
        d.name AS departmentName,
        d.code AS departmentCode,
        CONCAT(ab.firstName, ' ', ab.lastName) AS assignedByName
      FROM UserDepartments ud
      INNER JOIN Users u ON ud.userId = u.id
      INNER JOIN Departments d ON ud.departmentId = d.id
      LEFT JOIN Users ab ON ud.assignedBy = ab.id
      WHERE ud.active = 1
      ORDER BY u.lastName, u.firstName, d.name
    `;
    const result = await pool.request().query(query);
    return result.recordset;
  }

  /**
   * Get assignments by user ID
   */
  static async findByUserId(userId: number): Promise<UserDepartmentAssignment[]> {
    const pool = await getConnection();
    const query = `
      SELECT 
        ud.id,
        ud.userId,
        ud.departmentId,
        ud.isPrimary,
        ud.assignedBy,
        ud.assignedAt,
        ud.active,
        d.name AS departmentName,
        d.code AS departmentCode,
        CONCAT(ab.firstName, ' ', ab.lastName) AS assignedByName
      FROM UserDepartments ud
      INNER JOIN Departments d ON ud.departmentId = d.id
      LEFT JOIN Users ab ON ud.assignedBy = ab.id
      WHERE ud.userId = @userId AND ud.active = 1
      ORDER BY ud.isPrimary DESC, d.name
    `;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(query);
    return result.recordset;
  }

  /**
   * Get assignments by department ID
   */
  static async findByDepartmentId(departmentId: number): Promise<UserDepartmentAssignment[]> {
    const pool = await getConnection();
    const query = `
      SELECT 
        ud.id,
        ud.userId,
        ud.departmentId,
        ud.isPrimary,
        ud.assignedBy,
        ud.assignedAt,
        ud.active,
        u.email AS userEmail,
        CONCAT(u.firstName, ' ', u.lastName) AS userName,
        CONCAT(ab.firstName, ' ', ab.lastName) AS assignedByName
      FROM UserDepartments ud
      INNER JOIN Users u ON ud.userId = u.id
      LEFT JOIN Users ab ON ud.assignedBy = ab.id
      WHERE ud.departmentId = @departmentId AND ud.active = 1
      ORDER BY ud.isPrimary DESC, u.lastName, u.firstName
    `;
    const result = await pool.request()
      .input('departmentId', sql.Int, departmentId)
      .query(query);
    return result.recordset;
  }

  /**
   * Get assignment by ID
   */
  static async findById(id: number): Promise<UserDepartmentAssignment | null> {
    const pool = await getConnection();
    const query = `
      SELECT 
        ud.id,
        ud.userId,
        ud.departmentId,
        ud.isPrimary,
        ud.assignedBy,
        ud.assignedAt,
        ud.active,
        u.email AS userEmail,
        CONCAT(u.firstName, ' ', u.lastName) AS userName,
        d.name AS departmentName,
        d.code AS departmentCode,
        CONCAT(ab.firstName, ' ', ab.lastName) AS assignedByName
      FROM UserDepartments ud
      INNER JOIN Users u ON ud.userId = u.id
      INNER JOIN Departments d ON ud.departmentId = d.id
      LEFT JOIN Users ab ON ud.assignedBy = ab.id
      WHERE ud.id = @id
    `;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);
    return result.recordset[0] || null;
  }

  /**
   * Check if assignment exists
   */
  static async assignmentExists(userId: number, departmentId: number): Promise<boolean> {
    const pool = await getConnection();
    const query = `
      SELECT COUNT(*) as count 
      FROM UserDepartments 
      WHERE userId = @userId AND departmentId = @departmentId AND active = 1
    `;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('departmentId', sql.Int, departmentId)
      .query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Create a new user-department assignment
   */
  static async create(data: CreateUserDepartmentData): Promise<number> {
    const pool = await getConnection();
    const query = `
      INSERT INTO UserDepartments (userId, departmentId, isPrimary, assignedBy, assignedAt, active)
      VALUES (@userId, @departmentId, @isPrimary, @assignedBy, GETDATE(), 1);
      SELECT SCOPE_IDENTITY() AS id;
    `;
    const result = await pool.request()
      .input('userId', sql.Int, data.userId)
      .input('departmentId', sql.Int, data.departmentId)
      .input('isPrimary', sql.Bit, data.isPrimary || false)
      .input('assignedBy', sql.Int, data.assignedBy)
      .query(query);
    return result.recordset[0].id;
  }

  /**
   * Update assignment
   */
  static async update(id: number, data: UpdateUserDepartmentData): Promise<void> {
    const pool = await getConnection();
    const updates: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (data.isPrimary !== undefined) {
      updates.push('isPrimary = @isPrimary');
      request.input('isPrimary', sql.Bit, data.isPrimary);
    }

    if (data.active !== undefined) {
      updates.push('active = @active');
      request.input('active', sql.Bit, data.active);
    }

    if (updates.length === 0) {
      return;
    }

    const query = `UPDATE UserDepartments SET ${updates.join(', ')} WHERE id = @id`;
    await request.query(query);
  }

  /**
   * Delete (deactivate) assignment
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    const query = `UPDATE UserDepartments SET active = 0 WHERE id = @id`;
    await pool.request()
      .input('id', sql.Int, id)
      .query(query);
  }

  /**
   * Remove primary flag from all assignments for a user
   */
  static async clearPrimaryForUser(userId: number): Promise<void> {
    const pool = await getConnection();
    const query = `UPDATE UserDepartments SET isPrimary = 0 WHERE userId = @userId AND active = 1`;
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(query);
  }

  /**
   * Set assignment as primary (and clear other primary flags for the user)
   */
  static async setPrimary(id: number, userId: number): Promise<void> {
    // First clear all primary flags for this user
    await UserDepartmentModel.clearPrimaryForUser(userId);
    
    const pool = await getConnection();
    // Then set this assignment as primary
    const query = `UPDATE UserDepartments SET isPrimary = 1 WHERE id = @id AND userId = @userId`;
    await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(query);
  }
}
