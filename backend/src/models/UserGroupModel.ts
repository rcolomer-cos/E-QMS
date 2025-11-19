import { getConnection, sql } from '../config/database';

export interface UserGroup {
  id?: number;
  userId: number;
  groupId: number;
  addedBy: number;
  addedAt?: Date;
}

export class UserGroupModel {
  /**
   * Add a user to a group
   */
  static async create(userGroup: UserGroup): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('userId', sql.Int, userGroup.userId)
      .input('groupId', sql.Int, userGroup.groupId)
      .input('addedBy', sql.Int, userGroup.addedBy)
      .query(`
        INSERT INTO UserGroups (userId, groupId, addedBy)
        OUTPUT INSERTED.id
        VALUES (@userId, @groupId, @addedBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Remove a user from a group
   */
  static async delete(userId: number, groupId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('groupId', sql.Int, groupId)
      .query('DELETE FROM UserGroups WHERE userId = @userId AND groupId = @groupId');
  }

  /**
   * Get all groups for a user
   */
  static async findByUserId(userId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          g.*,
          ug.addedAt
        FROM UserGroups ug
        INNER JOIN Groups g ON ug.groupId = g.id
        WHERE ug.userId = @userId AND g.active = 1
        ORDER BY g.name
      `);

    return result.recordset;
  }

  /**
   * Get all users in a group
   */
  static async findByGroupId(groupId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT 
          u.id,
          u.email,
          u.firstName,
          u.lastName,
          u.department,
          u.active,
          ug.addedAt
        FROM UserGroups ug
        INNER JOIN Users u ON ug.userId = u.id
        WHERE ug.groupId = @groupId
        ORDER BY u.lastName, u.firstName
      `);

    return result.recordset;
  }

  /**
   * Check if a user is in a group
   */
  static async exists(userId: number, groupId: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('groupId', sql.Int, groupId)
      .query('SELECT COUNT(*) AS count FROM UserGroups WHERE userId = @userId AND groupId = @groupId');

    return result.recordset[0].count > 0;
  }

  /**
   * Add multiple users to a group
   */
  static async addUsersToGroup(userIds: number[], groupId: number, addedBy: number): Promise<void> {
    for (const userId of userIds) {
      // Check if already exists
      const exists = await this.exists(userId, groupId);
      if (!exists) {
        await this.create({ userId, groupId, addedBy });
      }
    }
  }

  /**
   * Remove multiple users from a group
   */
  static async removeUsersFromGroup(userIds: number[], groupId: number): Promise<void> {
    for (const userId of userIds) {
      await this.delete(userId, groupId);
    }
  }

  /**
   * Remove all users from a group
   */
  static async deleteAllByGroupId(groupId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('groupId', sql.Int, groupId)
      .query('DELETE FROM UserGroups WHERE groupId = @groupId');
  }

  /**
   * Remove user from all groups
   */
  static async deleteAllByUserId(userId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM UserGroups WHERE userId = @userId');
  }
}
