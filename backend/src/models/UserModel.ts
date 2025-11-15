import { getConnection, sql } from '../config/database';
import bcrypt from 'bcrypt';
import { UserRole } from '../types';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  department?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel {
  static async create(user: User): Promise<number> {
    const pool = await getConnection();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const result = await pool
      .request()
      .input('username', sql.NVarChar, user.username)
      .input('email', sql.NVarChar, user.email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, user.role)
      .input('firstName', sql.NVarChar, user.firstName)
      .input('lastName', sql.NVarChar, user.lastName)
      .input('department', sql.NVarChar, user.department)
      .query(`
        INSERT INTO Users (username, email, password, role, firstName, lastName, department, active)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @password, @role, @firstName, @lastName, @department, 1)
      `);

    return result.recordset[0].id;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE username = @username AND active = 1');

    return result.recordset[0] || null;
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
      .query('SELECT id, username, email, role, firstName, lastName, department, active, createdAt, updatedAt FROM Users ORDER BY createdAt DESC');

    return result.recordset;
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
    if (updates.role) {
      request.input('role', sql.NVarChar, updates.role);
      fields.push('role = @role');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Users SET ${fields.join(', ')} WHERE id = @id`);
    }
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
}
