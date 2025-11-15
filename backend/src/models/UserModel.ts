import { getConnection, sql } from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
  id?: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  active: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  roles?: string[]; // Role names for convenience
}

export class UserModel {
  static async create(user: User, createdBy?: number): Promise<number> {
    const pool = await getConnection();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const result = await pool
      .request()
      .input('email', sql.NVarChar, user.email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('firstName', sql.NVarChar, user.firstName)
      .input('lastName', sql.NVarChar, user.lastName)
      .input('department', sql.NVarChar, user.department)
      .input('createdBy', sql.Int, createdBy || null)
      .input('mustChangePassword', sql.Bit, user.mustChangePassword || 0)
      .query(`
        INSERT INTO Users (email, password, firstName, lastName, department, createdBy, mustChangePassword, active)
        OUTPUT INSERTED.id
        VALUES (@email, @password, @firstName, @lastName, @department, @createdBy, @mustChangePassword, 1)
      `);

    return result.recordset[0].id;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email AND active = 1');

    return result.recordset[0] || null;
  }

  // Keep for backward compatibility but redirect to email lookup
  static async findByUsername(username: string): Promise<User | null> {
    return this.findByEmail(username);
  }

  static async findById(id: number): Promise<User | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE id = @id AND active = 1');

    return result.recordset[0] || null;
  }

  static async findAll(): Promise<User[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          u.id, u.email, u.firstName, u.lastName, u.department, 
          u.active, u.lastLoginAt, u.createdAt, u.updatedAt,
          STRING_AGG(r.name, ',') as roles
        FROM Users u
        LEFT JOIN UserRoles ur ON u.id = ur.userId
        LEFT JOIN Roles r ON ur.roleId = r.id AND r.active = 1
        WHERE u.active = 1
        GROUP BY u.id, u.email, u.firstName, u.lastName, u.department, 
                 u.active, u.lastLoginAt, u.createdAt, u.updatedAt
        ORDER BY u.createdAt DESC
      `);

    return result.recordset.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    }));
  }

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
    if (updates.mustChangePassword !== undefined) {
      request.input('mustChangePassword', sql.Bit, updates.mustChangePassword);
      fields.push('mustChangePassword = @mustChangePassword');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Users SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async updateLastLogin(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Users SET lastLoginAt = GETDATE() WHERE id = @id');
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const pool = await getConnection();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @password, passwordChangedAt = GETDATE(), mustChangePassword = 0 WHERE id = @id');
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Users SET active = 0 WHERE id = @id');
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static async updatePassword(id: number, hashedPassword: string): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @password, updatedAt = GETDATE() WHERE id = @id');
  }
}
