import { getConnection, sql } from '../config/database';
import { Role } from '../types';

export class RoleModel {
  static async findAll(): Promise<Role[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT * FROM Roles WHERE active = 1 ORDER BY name');

    return result.recordset;
  }

  static async findById(id: number): Promise<Role | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Roles WHERE id = @id AND active = 1');

    return result.recordset[0] || null;
  }

  static async findByName(name: string): Promise<Role | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Roles WHERE name = @name AND active = 1');

    return result.recordset[0] || null;
  }

  static async getUserRoles(userId: number): Promise<Role[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.*
        FROM Roles r
        INNER JOIN UserRoles ur ON r.id = ur.roleId
        WHERE ur.userId = @userId AND r.active = 1
        ORDER BY r.name
      `);

    return result.recordset;
  }

  static async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy?: number
  ): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .input('assignedBy', sql.Int, assignedBy || null)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE userId = @userId AND roleId = @roleId)
        BEGIN
          INSERT INTO UserRoles (userId, roleId, assignedBy)
          VALUES (@userId, @roleId, @assignedBy)
        END
      `);
  }

  static async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('DELETE FROM UserRoles WHERE userId = @userId AND roleId = @roleId');
  }

  static async userHasRole(userId: number, roleName: string): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('roleName', sql.NVarChar, roleName)
      .query(`
        SELECT COUNT(*) as count
        FROM UserRoles ur
        INNER JOIN Roles r ON ur.roleId = r.id
        WHERE ur.userId = @userId AND r.name = @roleName AND r.active = 1
      `);

    return result.recordset[0].count > 0;
  }

  static async userIsSuperUser(userId: number): Promise<boolean> {
    return this.userHasRole(userId, 'superuser');
  }

  static async userIsAdmin(userId: number): Promise<boolean> {
    const isSuperUser = await this.userIsSuperUser(userId);
    const isAdmin = await this.userHasRole(userId, 'admin');
    return isSuperUser || isAdmin;
  }

  static async hasSuperUsers(): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT COUNT(*) as count
        FROM UserRoles ur
        INNER JOIN Roles r ON ur.roleId = r.id
        WHERE r.name = 'superuser' AND r.active = 1
      `);

    return result.recordset[0].count > 0;
  }
}
