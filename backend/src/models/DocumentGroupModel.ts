import { getConnection, sql } from '../config/database';

export interface DocumentGroup {
  id?: number;
  documentId: number;
  groupId: number;
  assignedBy: number;
  assignedAt?: Date;
}

export class DocumentGroupModel {
  /**
   * Assign a group to a document
   */
  static async create(documentGroup: DocumentGroup): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('documentId', sql.Int, documentGroup.documentId)
      .input('groupId', sql.Int, documentGroup.groupId)
      .input('assignedBy', sql.Int, documentGroup.assignedBy)
      .query(`
        INSERT INTO DocumentGroups (documentId, groupId, assignedBy)
        OUTPUT INSERTED.id
        VALUES (@documentId, @groupId, @assignedBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Remove a group from a document
   */
  static async delete(documentId: number, groupId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('groupId', sql.Int, groupId)
      .query('DELETE FROM DocumentGroups WHERE documentId = @documentId AND groupId = @groupId');
  }

  /**
   * Get all groups assigned to a document
   */
  static async findByDocumentId(documentId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT 
          g.*,
          dg.assignedAt,
          u.firstName AS assignedByFirstName,
          u.lastName AS assignedByLastName
        FROM DocumentGroups dg
        INNER JOIN Groups g ON dg.groupId = g.id
        LEFT JOIN Users u ON dg.assignedBy = u.id
        WHERE dg.documentId = @documentId AND g.active = 1
        ORDER BY g.name
      `);

    return result.recordset;
  }

  /**
   * Get all documents assigned to a group
   */
  static async findByGroupId(groupId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT 
          d.*,
          dg.assignedAt
        FROM DocumentGroups dg
        INNER JOIN Documents d ON dg.documentId = d.id
        WHERE dg.groupId = @groupId
        ORDER BY d.title
      `);

    return result.recordset;
  }

  /**
   * Check if a document is assigned to a group
   */
  static async exists(documentId: number, groupId: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('groupId', sql.Int, groupId)
      .query('SELECT COUNT(*) AS count FROM DocumentGroups WHERE documentId = @documentId AND groupId = @groupId');

    return result.recordset[0].count > 0;
  }

  /**
   * Assign multiple groups to a document
   */
  static async assignGroupsToDocument(groupIds: number[], documentId: number, assignedBy: number): Promise<void> {
    for (const groupId of groupIds) {
      // Check if already exists
      const exists = await this.exists(documentId, groupId);
      if (!exists) {
        await this.create({ documentId, groupId, assignedBy });
      }
    }
  }

  /**
   * Remove multiple groups from a document
   */
  static async removeGroupsFromDocument(groupIds: number[], documentId: number): Promise<void> {
    for (const groupId of groupIds) {
      await this.delete(documentId, groupId);
    }
  }

  /**
   * Remove all groups from a document
   */
  static async deleteAllByDocumentId(documentId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query('DELETE FROM DocumentGroups WHERE documentId = @documentId');
  }

  /**
   * Remove all documents from a group
   */
  static async deleteAllByGroupId(groupId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('groupId', sql.Int, groupId)
      .query('DELETE FROM DocumentGroups WHERE groupId = @groupId');
  }

  /**
   * Get all user IDs that have access to a document through groups
   */
  static async getUserIdsForDocument(documentId: number): Promise<number[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT DISTINCT ug.userId
        FROM DocumentGroups dg
        INNER JOIN UserGroups ug ON dg.groupId = ug.groupId
        INNER JOIN Groups g ON dg.groupId = g.id
        WHERE dg.documentId = @documentId AND g.active = 1
      `);

    return result.recordset.map((row: any) => row.userId);
  }

  /**
   * Check if a user has access to a document through any group
   */
  static async userHasAccess(userId: number, documentId: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT COUNT(*) AS count
        FROM DocumentGroups dg
        INNER JOIN UserGroups ug ON dg.groupId = ug.groupId
        INNER JOIN Groups g ON dg.groupId = g.id
        WHERE ug.userId = @userId AND dg.documentId = @documentId AND g.active = 1
      `);

    return result.recordset[0].count > 0;
  }

  /**
   * Get all documents accessible to a user through groups
   */
  static async getDocumentsForUser(userId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT DISTINCT d.*
        FROM Documents d
        INNER JOIN DocumentGroups dg ON d.id = dg.documentId
        INNER JOIN UserGroups ug ON dg.groupId = ug.groupId
        INNER JOIN Groups g ON dg.groupId = g.id
        WHERE ug.userId = @userId AND g.active = 1
        ORDER BY d.title
      `);

    return result.recordset;
  }
}
