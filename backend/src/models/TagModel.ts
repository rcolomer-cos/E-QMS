import { getConnection, sql } from '../config/database';

export interface Tag {
  id?: number;
  name: string;
  description?: string;
  backgroundColor: string; // Hex color code
  fontColor: string; // Hex color code
  createdBy: number;
  createdAt?: Date;
  updatedBy?: number;
  updatedAt?: Date;
}

export interface DocumentTag {
  id?: number;
  documentId: number;
  tagId: number;
  assignedBy: number;
  assignedAt?: Date;
}

export class TagModel {
  /**
   * Create a new tag
   */
  static async create(tag: Tag): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('name', sql.NVarChar, tag.name.trim())
      .input('description', sql.NVarChar, tag.description)
      .input('backgroundColor', sql.NVarChar, tag.backgroundColor)
      .input('fontColor', sql.NVarChar, tag.fontColor)
      .input('createdBy', sql.Int, tag.createdBy)
      .query(`
        INSERT INTO Tags (name, description, backgroundColor, fontColor, createdBy)
        OUTPUT INSERTED.id
        VALUES (@name, @description, @backgroundColor, @fontColor, @createdBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Find tag by ID
   */
  static async findById(id: number): Promise<Tag | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Tags WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find tag by name (case-insensitive)
   */
  static async findByName(name: string): Promise<Tag | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name.trim())
      .query('SELECT * FROM Tags WHERE name = @name');

    return result.recordset[0] || null;
  }

  /**
   * Get all tags
   */
  static async findAll(): Promise<Tag[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT * FROM Tags ORDER BY name ASC');

    return result.recordset;
  }

  /**
   * Update tag
   */
  static async update(id: number, updates: Partial<Tag>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request();
    const setClauses: string[] = [];

    if (updates.name !== undefined) {
      request.input('name', sql.NVarChar, updates.name.trim());
      setClauses.push('name = @name');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      setClauses.push('description = @description');
    }
    if (updates.backgroundColor !== undefined) {
      request.input('backgroundColor', sql.NVarChar, updates.backgroundColor);
      setClauses.push('backgroundColor = @backgroundColor');
    }
    if (updates.fontColor !== undefined) {
      request.input('fontColor', sql.NVarChar, updates.fontColor);
      setClauses.push('fontColor = @fontColor');
    }
    if (updates.updatedBy !== undefined) {
      request.input('updatedBy', sql.Int, updates.updatedBy);
      setClauses.push('updatedBy = @updatedBy');
    }

    if (setClauses.length === 0) {
      return;
    }

    setClauses.push('updatedAt = GETDATE()');
    request.input('id', sql.Int, id);

    await request.query(`
      UPDATE Tags
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
  }

  /**
   * Delete tag
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Tags WHERE id = @id');
  }

  /**
   * Get tags assigned to a document
   */
  static async findByDocumentId(documentId: number): Promise<Tag[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT t.*
        FROM Tags t
        INNER JOIN DocumentTags dt ON t.id = dt.tagId
        WHERE dt.documentId = @documentId
        ORDER BY t.name ASC
      `);

    return result.recordset;
  }

  /**
   * Assign tag to document
   */
  static async assignToDocument(documentId: number, tagId: number, assignedBy: number): Promise<number> {
    const pool = await getConnection();
    
    try {
      const result = await pool
        .request()
        .input('documentId', sql.Int, documentId)
        .input('tagId', sql.Int, tagId)
        .input('assignedBy', sql.Int, assignedBy)
        .query(`
          INSERT INTO DocumentTags (documentId, tagId, assignedBy)
          OUTPUT INSERTED.id
          VALUES (@documentId, @tagId, @assignedBy)
        `);

      return result.recordset[0].id;
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.number === 2627 || error.code === 'EREQUEST') {
        throw new Error('Tag already assigned to document');
      }
      throw error;
    }
  }

  /**
   * Assign multiple tags to document
   */
  static async assignMultipleToDocument(documentId: number, tagIds: number[], assignedBy: number): Promise<void> {
    const pool = await getConnection();
    
    for (const tagId of tagIds) {
      try {
        await pool
          .request()
          .input('documentId', sql.Int, documentId)
          .input('tagId', sql.Int, tagId)
          .input('assignedBy', sql.Int, assignedBy)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM DocumentTags WHERE documentId = @documentId AND tagId = @tagId)
            BEGIN
              INSERT INTO DocumentTags (documentId, tagId, assignedBy)
              VALUES (@documentId, @tagId, @assignedBy)
            END
          `);
      } catch (error) {
        console.error(`Failed to assign tag ${tagId} to document ${documentId}:`, error);
        // Continue with other tags
      }
    }
  }

  /**
   * Remove tag from document
   */
  static async removeFromDocument(documentId: number, tagId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('tagId', sql.Int, tagId)
      .query('DELETE FROM DocumentTags WHERE documentId = @documentId AND tagId = @tagId');
  }

  /**
   * Remove all tags from document
   */
  static async removeAllFromDocument(documentId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query('DELETE FROM DocumentTags WHERE documentId = @documentId');
  }

  /**
   * Search documents by tag IDs
   */
  static async findDocumentsByTags(tagIds: number[]): Promise<number[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const pool = await getConnection();
    const request = pool.request();
    
    // Build parameter list for IN clause
    const tagParamNames = tagIds.map((_, index) => `@tagId${index}`);
    tagIds.forEach((tagId, index) => {
      request.input(`tagId${index}`, sql.Int, tagId);
    });

    const result = await request.query(`
      SELECT DISTINCT dt.documentId
      FROM DocumentTags dt
      WHERE dt.tagId IN (${tagParamNames.join(', ')})
      ORDER BY dt.documentId
    `);

    return result.recordset.map((row) => row.documentId);
  }

  /**
   * Get tag usage count (number of documents using each tag)
   */
  static async getTagUsageCount(): Promise<Array<{ tagId: number; tagName: string; documentCount: number }>> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          t.id as tagId,
          t.name as tagName,
          COUNT(dt.documentId) as documentCount
        FROM Tags t
        LEFT JOIN DocumentTags dt ON t.id = dt.tagId
        GROUP BY t.id, t.name
        ORDER BY t.name ASC
      `);

    return result.recordset;
  }
}
