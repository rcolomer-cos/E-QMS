import { getConnection, sql } from '../config/database';

export interface ImprovementIdea {
  id?: number;
  ideaNumber: string;
  title: string;
  description: string;
  category: string;
  expectedImpact?: string;
  impactArea?: string;
  submittedBy: number;
  responsibleUser?: number;
  department?: string;
  status: string;
  submittedDate: Date;
  reviewedDate?: Date;
  implementedDate?: Date;
  reviewComments?: string;
  reviewedBy?: number;
  implementationNotes?: string;
  estimatedCost?: number;
  estimatedBenefit?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ImprovementIdeaFilters {
  status?: string;
  category?: string;
  impactArea?: string;
  submittedBy?: number;
  responsibleUser?: number;
  department?: string;
}

export interface ImprovementIdeaSortOptions {
  sortBy?: 'submittedDate' | 'reviewedDate' | 'implementedDate' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export class ImprovementIdeaModel {
  /**
   * Generate next idea number
   */
  static async generateIdeaNumber(): Promise<string> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 1 ideaNumber 
      FROM ImprovementIdeas 
      ORDER BY id DESC
    `);

    if (result.recordset.length === 0) {
      return 'IDEA-0001';
    }

    const lastNumber = result.recordset[0].ideaNumber;
    const match = lastNumber.match(/IDEA-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `IDEA-${nextNum.toString().padStart(4, '0')}`;
    }

    return 'IDEA-0001';
  }

  /**
   * Create a new improvement idea
   */
  static async create(idea: ImprovementIdea): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('ideaNumber', sql.NVarChar, idea.ideaNumber)
      .input('title', sql.NVarChar, idea.title)
      .input('description', sql.NVarChar, idea.description)
      .input('category', sql.NVarChar, idea.category)
      .input('expectedImpact', sql.NVarChar, idea.expectedImpact || null)
      .input('impactArea', sql.NVarChar, idea.impactArea || null)
      .input('submittedBy', sql.Int, idea.submittedBy)
      .input('responsibleUser', sql.Int, idea.responsibleUser || null)
      .input('department', sql.NVarChar, idea.department || null)
      .input('status', sql.NVarChar, idea.status)
      .input('submittedDate', sql.DateTime2, idea.submittedDate)
      .input('estimatedCost', sql.Decimal(18, 2), idea.estimatedCost || null)
      .input('estimatedBenefit', sql.NVarChar, idea.estimatedBenefit || null)
      .query(`
        INSERT INTO ImprovementIdeas (
          ideaNumber, title, description, category, expectedImpact, impactArea,
          submittedBy, responsibleUser, department, status, submittedDate,
          estimatedCost, estimatedBenefit, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @ideaNumber, @title, @description, @category, @expectedImpact, @impactArea,
          @submittedBy, @responsibleUser, @department, @status, @submittedDate,
          @estimatedCost, @estimatedBenefit, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get all improvement ideas with filtering and sorting
   */
  static async findAll(
    filters: ImprovementIdeaFilters = {},
    sortOptions: ImprovementIdeaSortOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ImprovementIdea[]; total: number; page: number; limit: number }> {
    const pool = await getConnection();
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    const request = pool.request();

    // Apply filters
    if (filters.status) {
      whereConditions.push('i.status = @status');
      request.input('status', sql.NVarChar, filters.status);
    }
    if (filters.category) {
      whereConditions.push('i.category = @category');
      request.input('category', sql.NVarChar, filters.category);
    }
    if (filters.impactArea) {
      whereConditions.push('i.impactArea = @impactArea');
      request.input('impactArea', sql.NVarChar, filters.impactArea);
    }
    if (filters.submittedBy) {
      whereConditions.push('i.submittedBy = @submittedBy');
      request.input('submittedBy', sql.Int, filters.submittedBy);
    }
    if (filters.responsibleUser) {
      whereConditions.push('i.responsibleUser = @responsibleUser');
      request.input('responsibleUser', sql.Int, filters.responsibleUser);
    }
    if (filters.department) {
      whereConditions.push('i.department = @department');
      request.input('department', sql.NVarChar, filters.department);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Determine sort field and order
    const sortBy = sortOptions.sortBy || 'submittedDate';
    const sortOrder = sortOptions.sortOrder || 'DESC';
    const orderByClause = `ORDER BY i.${sortBy} ${sortOrder}`;

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total
      FROM ImprovementIdeas i
      ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated data
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT 
        i.*,
        u1.firstName as submitterFirstName,
        u1.lastName as submitterLastName,
        u1.email as submitterEmail,
        u2.firstName as responsibleFirstName,
        u2.lastName as responsibleLastName,
        u2.email as responsibleEmail,
        u3.firstName as reviewerFirstName,
        u3.lastName as reviewerLastName,
        u3.email as reviewerEmail
      FROM ImprovementIdeas i
      LEFT JOIN Users u1 ON i.submittedBy = u1.id
      LEFT JOIN Users u2 ON i.responsibleUser = u2.id
      LEFT JOIN Users u3 ON i.reviewedBy = u3.id
      ${whereClause}
      ${orderByClause}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      total,
      page,
      limit,
    };
  }

  /**
   * Get improvement idea by ID
   */
  static async findById(id: number): Promise<ImprovementIdea | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          i.*,
          u1.firstName as submitterFirstName,
          u1.lastName as submitterLastName,
          u1.email as submitterEmail,
          u2.firstName as responsibleFirstName,
          u2.lastName as responsibleLastName,
          u2.email as responsibleEmail,
          u3.firstName as reviewerFirstName,
          u3.lastName as reviewerLastName,
          u3.email as reviewerEmail
        FROM ImprovementIdeas i
        LEFT JOIN Users u1 ON i.submittedBy = u1.id
        LEFT JOIN Users u2 ON i.responsibleUser = u2.id
        LEFT JOIN Users u3 ON i.reviewedBy = u3.id
        WHERE i.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Update improvement idea
   */
  static async update(id: number, idea: Partial<ImprovementIdea>): Promise<boolean> {
    const pool = await getConnection();

    let updateFields: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (idea.title !== undefined) {
      updateFields.push('title = @title');
      request.input('title', sql.NVarChar, idea.title);
    }
    if (idea.description !== undefined) {
      updateFields.push('description = @description');
      request.input('description', sql.NVarChar, idea.description);
    }
    if (idea.category !== undefined) {
      updateFields.push('category = @category');
      request.input('category', sql.NVarChar, idea.category);
    }
    if (idea.expectedImpact !== undefined) {
      updateFields.push('expectedImpact = @expectedImpact');
      request.input('expectedImpact', sql.NVarChar, idea.expectedImpact || null);
    }
    if (idea.impactArea !== undefined) {
      updateFields.push('impactArea = @impactArea');
      request.input('impactArea', sql.NVarChar, idea.impactArea || null);
    }
    if (idea.responsibleUser !== undefined) {
      updateFields.push('responsibleUser = @responsibleUser');
      request.input('responsibleUser', sql.Int, idea.responsibleUser || null);
    }
    if (idea.department !== undefined) {
      updateFields.push('department = @department');
      request.input('department', sql.NVarChar, idea.department || null);
    }
    if (idea.status !== undefined) {
      updateFields.push('status = @status');
      request.input('status', sql.NVarChar, idea.status);
    }
    if (idea.reviewedDate !== undefined) {
      updateFields.push('reviewedDate = @reviewedDate');
      request.input('reviewedDate', sql.DateTime2, idea.reviewedDate || null);
    }
    if (idea.implementedDate !== undefined) {
      updateFields.push('implementedDate = @implementedDate');
      request.input('implementedDate', sql.DateTime2, idea.implementedDate || null);
    }
    if (idea.reviewComments !== undefined) {
      updateFields.push('reviewComments = @reviewComments');
      request.input('reviewComments', sql.NVarChar, idea.reviewComments || null);
    }
    if (idea.reviewedBy !== undefined) {
      updateFields.push('reviewedBy = @reviewedBy');
      request.input('reviewedBy', sql.Int, idea.reviewedBy || null);
    }
    if (idea.implementationNotes !== undefined) {
      updateFields.push('implementationNotes = @implementationNotes');
      request.input('implementationNotes', sql.NVarChar, idea.implementationNotes || null);
    }
    if (idea.estimatedCost !== undefined) {
      updateFields.push('estimatedCost = @estimatedCost');
      request.input('estimatedCost', sql.Decimal(18, 2), idea.estimatedCost || null);
    }
    if (idea.estimatedBenefit !== undefined) {
      updateFields.push('estimatedBenefit = @estimatedBenefit');
      request.input('estimatedBenefit', sql.NVarChar, idea.estimatedBenefit || null);
    }

    updateFields.push('updatedAt = GETDATE()');

    if (updateFields.length === 1) {
      return true; // Only updatedAt, no real changes
    }

    const result = await request.query(`
      UPDATE ImprovementIdeas
      SET ${updateFields.join(', ')}
      WHERE id = @id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete improvement idea
   */
  static async delete(id: number): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ImprovementIdeas WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Get statistics for improvement ideas
   */
  static async getStatistics(): Promise<any> {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalIdeas,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as underReview,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'implemented' THEN 1 ELSE 0 END) as implemented,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM ImprovementIdeas
    `);

    const categoryResult = await pool.request().query(`
      SELECT category, COUNT(*) as count
      FROM ImprovementIdeas
      GROUP BY category
    `);

    const impactAreaResult = await pool.request().query(`
      SELECT impactArea, COUNT(*) as count
      FROM ImprovementIdeas
      WHERE impactArea IS NOT NULL
      GROUP BY impactArea
    `);

    const byCategory: Record<string, number> = {};
    categoryResult.recordset.forEach((row: any) => {
      byCategory[row.category] = row.count;
    });

    const byImpactArea: Record<string, number> = {};
    impactAreaResult.recordset.forEach((row: any) => {
      byImpactArea[row.impactArea] = row.count;
    });

    return {
      ...result.recordset[0],
      byCategory,
      byImpactArea,
    };
  }
}
