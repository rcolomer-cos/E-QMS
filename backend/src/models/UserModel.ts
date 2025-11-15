import { getConnection, sql } from '../config/database';
import bcrypt from 'bcrypt';
import { Role } from '../types';

export interface User {
  id?: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  active: boolean;
  lastLogin?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  mustChangePassword?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  roles?: Role[]; // Populated when fetched with roles
  roleNames?: string[]; // Array of role names
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  roleIds: number[]; // Role IDs to assign
  createdBy: number;
  mustChangePassword?: boolean;
}

export class UserModel {
  /**
   * Create a new user with assigned roles
   */
  static async create(userData: CreateUserData): Promise<number> {
    const pool = await getConnection();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Insert user
      const userResult = await transaction
        .request()
        .input('email', sql.NVarChar, userData.email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('firstName', sql.NVarChar, userData.firstName)
        .input('lastName', sql.NVarChar, userData.lastName)
        .input('department', sql.NVarChar, userData.department)
        .input('createdBy', sql.Int, userData.createdBy)
        .input('mustChangePassword', sql.Bit, userData.mustChangePassword || false)
        .query(`
          INSERT INTO Users (
            email, password, firstName, lastName, department, 
            active, createdBy, mustChangePassword, passwordChangedAt
          )
          OUTPUT INSERTED.id
          VALUES (
            @email, @password, @firstName, @lastName, @department, 
            1, @createdBy, @mustChangePassword, GETDATE()
          )
        `);

      const userId = userResult.recordset[0].id;

      // Assign roles
      for (const roleId of userData.roleIds) {
        await transaction
          .request()
          .input('userId', sql.Int, userId)
          .input('roleId', sql.Int, roleId)
          .input('assignedBy', sql.Int, userData.createdBy)
          .query(`
            INSERT INTO UserRoles (userId, roleId, assignedBy, active)
            VALUES (@userId, @roleId, @assignedBy, 1)
          `);
      }

      await transaction.commit();
      return userId;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Find user by email (email is the login username)
   */
  static async findByEmail(email: string): Promise<User | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT * FROM Users WHERE LOWER(email) = @email AND active = 1');

    if (result.recordset.length === 0) {
      return null;
    }

    const user = result.recordset[0];
    user.roles = await this.getUserRoles(user.id);
    user.roleNames = user.roles.map((r: Role) => r.name);
    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE id = @id AND active = 1');

    if (result.recordset.length === 0) {
      return null;
    }

    const user = result.recordset[0];
    user.roles = await this.getUserRoles(user.id);
    user.roleNames = user.roles.map((r: Role) => r.name);
    return user;
  }

  /**
   * Get all active users with their roles
   */
  static async findAll(): Promise<User[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          id, email, firstName, lastName, department, 
          active, lastLogin, createdAt, updatedAt 
        FROM Users 
        WHERE active = 1
        ORDER BY lastName, firstName
      `);

    const users = result.recordset;
    
    // Fetch roles for each user
    for (const user of users) {
      user.roles = await this.getUserRoles(user.id);
      user.roleNames = user.roles.map((r: Role) => r.name);
    }

    return users;
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: number): Promise<Role[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.*
        FROM Roles r
        INNER JOIN UserRoles ur ON r.id = ur.roleId
        WHERE ur.userId = @userId 
          AND ur.active = 1 
          AND r.active = 1
          AND (ur.expiresAt IS NULL OR ur.expiresAt > GETDATE())
        ORDER BY r.level DESC
      `);

    return result.recordset;
  }

  /**
   * Check if user has a specific role
   */
  static async hasRole(userId: number, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.some(r => r.name === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  static async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.some(r => roleNames.includes(r.name));
  }

  /**
   * Get highest permission level for user
   */
  static async getUserPermissionLevel(userId: number): Promise<number> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return 0;
    return Math.max(...roles.map(r => r.level));
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId: number, roleId: number, assignedBy: number, expiresAt?: Date): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .input('assignedBy', sql.Int, assignedBy)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE userId = @userId AND roleId = @roleId)
        BEGIN
          INSERT INTO UserRoles (userId, roleId, assignedBy, expiresAt, active)
          VALUES (@userId, @roleId, @assignedBy, @expiresAt, 1)
        END
        ELSE
        BEGIN
          UPDATE UserRoles 
          SET active = 1, expiresAt = @expiresAt, assignedBy = @assignedBy, assignedAt = GETDATE()
          WHERE userId = @userId AND roleId = @roleId
        END
      `);
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(userId: number, roleId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('UPDATE UserRoles SET active = 0 WHERE userId = @userId AND roleId = @roleId');
  }

  /**
   * Update user information
   */
  static async update(id: number, updates: Partial<User>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    if (updates.email) {
      request.input('email', sql.NVarChar, updates.email);
      fields.push('email = @email');
    }
    if (updates.firstName) {
      request.input('firstName', sql.NVarChar, updates.firstName);
      fields.push('firstName = @firstName');
    }
    if (updates.lastName) {
      request.input('lastName', sql.NVarChar, updates.lastName);
      fields.push('lastName = @lastName');
    }
    if (updates.department) {
      request.input('department', sql.NVarChar, updates.department);
      fields.push('department = @department');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Users SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Soft delete user
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Users SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Verify password
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Update password
   */
  static async updatePassword(userId: number, newPassword: string): Promise<void> {
    const pool = await getConnection();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Users 
        SET password = @password, 
            passwordChangedAt = GETDATE(), 
            mustChangePassword = 0,
            updatedAt = GETDATE()
        WHERE id = @userId
      `);
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('UPDATE Users SET lastLogin = GETDATE() WHERE id = @userId');
  }

  /**
   * Check if any superusers exist in the system
   */
  static async hasSuperusers(): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT COUNT(*) as count
        FROM Users u
        INNER JOIN UserRoles ur ON u.id = ur.userId
        INNER JOIN Roles r ON ur.roleId = r.id
        WHERE u.active = 1 
          AND ur.active = 1 
          AND r.name = 'superuser'
          AND (ur.expiresAt IS NULL OR ur.expiresAt > GETDATE())
      `);

    return result.recordset[0].count > 0;
  }

  /**
   * Get all superusers
   */
  static async getSuperusers(): Promise<User[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT DISTINCT u.*
        FROM Users u
        INNER JOIN UserRoles ur ON u.id = ur.userId
        INNER JOIN Roles r ON ur.roleId = r.id
        WHERE u.active = 1 
          AND ur.active = 1 
          AND r.name = 'superuser'
          AND (ur.expiresAt IS NULL OR ur.expiresAt > GETDATE())
        ORDER BY u.email
      `);

    return result.recordset;
  }
}
