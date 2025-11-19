import { getConnection, sql } from '../config/database';

export interface Group {
  id?: number;
  name: string;
  description?: string;
  active?: boolean;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GroupWithCounts extends Group {
  userCount?: number;
  documentCount?: number;
}

export class GroupModel {
  /**
   * Create a new group
   */
  static async create(group: Group): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('name', sql.NVarChar, group.name)
      .input('description', sql.NVarChar, group.description)
      .input('createdBy', sql.Int, group.createdBy)
      .query(`
        INSERT INTO Groups (name, description, createdBy)
        OUTPUT INSERTED.id
        VALUES (@name, @description, @createdBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Get group by ID
   */
  static async findById(id: number): Promise<Group | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Groups WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Get all groups, optionally with user and document counts
   */
  static async findAll(options?: { includeInactive?: boolean; withCounts?: boolean }): Promise<GroupWithCounts[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        g.*
        ${options?.withCounts ? `,
        (SELECT COUNT(*) FROM UserGroups ug WHERE ug.groupId = g.id) AS userCount,
        (SELECT COUNT(*) FROM DocumentGroups dg WHERE dg.groupId = g.id) AS documentCount` : ''}
      FROM Groups g
      WHERE 1=1
    `;

    if (!options?.includeInactive) {
      query += ' AND g.active = 1';
    }

    query += ' ORDER BY g.name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update group
   */
  static async update(id: number, updates: Partial<Group>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdBy' && key !== 'createdAt') {
        request.input(key, value);
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Groups SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Delete group (soft delete by setting active = 0)
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Groups SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Hard delete group (permanently remove)
   */
  static async hardDelete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Groups WHERE id = @id');
  }

  /**
   * Get all users in a group
   */
  static async getUsersByGroupId(groupId: number): Promise<any[]> {
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
          ug.addedAt,
          addedByUser.firstName AS addedByFirstName,
          addedByUser.lastName AS addedByLastName
        FROM UserGroups ug
        INNER JOIN Users u ON ug.userId = u.id
        LEFT JOIN Users addedByUser ON ug.addedBy = addedByUser.id
        WHERE ug.groupId = @groupId
        ORDER BY u.lastName, u.firstName
      `);

    return result.recordset;
  }

  /**
   * Get all documents assigned to a group
   */
  static async getDocumentsByGroupId(groupId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT 
          d.id,
          d.title,
          d.documentType,
          d.category,
          d.version,
          d.status,
          dg.assignedAt,
          assignedByUser.firstName AS assignedByFirstName,
          assignedByUser.lastName AS assignedByLastName
        FROM DocumentGroups dg
        INNER JOIN Documents d ON dg.documentId = d.id
        LEFT JOIN Users assignedByUser ON dg.assignedBy = assignedByUser.id
        WHERE dg.groupId = @groupId
        ORDER BY d.title
      `);

    return result.recordset;
  }

  /**
   * Check if a group name already exists
   */
  static async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('name', sql.NVarChar, name);

    let query = 'SELECT COUNT(*) AS count FROM Groups WHERE name = @name';
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }
}
