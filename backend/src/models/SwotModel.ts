import { getConnection, sql } from '../config/database';

export interface SwotEntry {
  id?: number;
  title: string;
  description?: string;
  category: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat';
  owner?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reviewDate?: Date;
  nextReviewDate?: Date;
  status: 'active' | 'archived' | 'addressed';
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SwotFilters {
  category?: string;
  status?: string;
  priority?: string;
  owner?: number;
}

export interface SwotStatistics {
  totalEntries: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export class SwotModel {
  /**
   * Create a new SWOT entry
   */
  static async create(entry: SwotEntry): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('title', sql.NVarChar, entry.title)
      .input('description', sql.NVarChar, entry.description || null)
      .input('category', sql.NVarChar, entry.category)
      .input('owner', sql.Int, entry.owner || null)
      .input('priority', sql.NVarChar, entry.priority || null)
      .input('reviewDate', sql.DateTime2, entry.reviewDate || null)
      .input('nextReviewDate', sql.DateTime2, entry.nextReviewDate || null)
      .input('status', sql.NVarChar, entry.status)
      .input('createdBy', sql.Int, entry.createdBy)
      .query(`
        INSERT INTO SwotEntries (
          title, description, category, owner, priority,
          reviewDate, nextReviewDate, status, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @title, @description, @category, @owner, @priority,
          @reviewDate, @nextReviewDate, @status, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Find SWOT entry by ID
   */
  static async findById(id: number): Promise<SwotEntry | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM SwotEntries WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find all SWOT entries with optional filters
   */
  static async findAll(filters?: SwotFilters): Promise<SwotEntry[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM SwotEntries WHERE 1=1';

    // Apply filters
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.priority) {
      request.input('priority', sql.NVarChar, filters.priority);
      query += ' AND priority = @priority';
    }
    if (filters?.owner) {
      request.input('owner', sql.Int, filters.owner);
      query += ' AND owner = @owner';
    }

    // Default ordering by category and creation date
    query += ' ORDER BY category, createdAt DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update a SWOT entry
   */
  static async update(id: number, updates: Partial<SwotEntry>): Promise<void> {
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
      await request.query(`UPDATE SwotEntries SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Delete a SWOT entry
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM SwotEntries WHERE id = @id');
  }

  /**
   * Get SWOT statistics
   */
  static async getStatistics(): Promise<SwotStatistics> {
    const pool = await getConnection();

    const totalResult = await pool.request().query('SELECT COUNT(*) as count FROM SwotEntries');
    const categoryResult = await pool
      .request()
      .query('SELECT category, COUNT(*) as count FROM SwotEntries GROUP BY category');
    const statusResult = await pool
      .request()
      .query('SELECT status, COUNT(*) as count FROM SwotEntries GROUP BY status');
    const priorityResult = await pool
      .request()
      .query('SELECT priority, COUNT(*) as count FROM SwotEntries WHERE priority IS NOT NULL GROUP BY priority');

    const byCategory: Record<string, number> = {};
    categoryResult.recordset.forEach((row: { category: string; count: number }) => {
      byCategory[row.category] = row.count;
    });

    const byStatus: Record<string, number> = {};
    statusResult.recordset.forEach((row: { status: string; count: number }) => {
      byStatus[row.status] = row.count;
    });

    const byPriority: Record<string, number> = {};
    priorityResult.recordset.forEach((row: { priority: string; count: number }) => {
      byPriority[row.priority] = row.count;
    });

    return {
      totalEntries: totalResult.recordset[0].count,
      byCategory,
      byStatus,
      byPriority,
    };
  }
}
