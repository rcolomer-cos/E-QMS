import { getConnection, sql } from '../config/database';

export interface ImplementationTask {
  id?: number;
  improvementIdeaId: number;
  taskName: string;
  taskDescription?: string;
  assignedTo?: number;
  deadline?: Date;
  startedDate?: Date;
  completedDate?: Date;
  status: string;
  progressPercentage: number;
  completionEvidence?: string;
  createdAt?: Date;
  createdBy: number;
  updatedAt?: Date;
  updatedBy?: number;
  // Joined fields from Users
  assignedToFirstName?: string;
  assignedToLastName?: string;
  assignedToEmail?: string;
  createdByFirstName?: string;
  createdByLastName?: string;
  createdByEmail?: string;
}

export interface ImplementationTaskFilters {
  improvementIdeaId?: number;
  status?: string;
  assignedTo?: number;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
}

export interface ImplementationTaskSortOptions {
  sortBy?: 'deadline' | 'createdAt' | 'completedDate' | 'taskName';
  sortOrder?: 'ASC' | 'DESC';
}

export class ImplementationTaskModel {
  /**
   * Create a new implementation task
   */
  static async create(task: ImplementationTask): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('improvementIdeaId', sql.Int, task.improvementIdeaId)
      .input('taskName', sql.NVarChar, task.taskName)
      .input('taskDescription', sql.NVarChar, task.taskDescription || null)
      .input('assignedTo', sql.Int, task.assignedTo || null)
      .input('deadline', sql.DateTime2, task.deadline || null)
      .input('status', sql.NVarChar, task.status)
      .input('progressPercentage', sql.Int, task.progressPercentage || 0)
      .input('createdBy', sql.Int, task.createdBy)
      .query(`
        INSERT INTO ImplementationTasks (
          improvementIdeaId, taskName, taskDescription, assignedTo, deadline,
          status, progressPercentage, createdBy, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @improvementIdeaId, @taskName, @taskDescription, @assignedTo, @deadline,
          @status, @progressPercentage, @createdBy, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get all implementation tasks with filtering and sorting
   */
  static async findAll(
    filters: ImplementationTaskFilters = {},
    sortOptions: ImplementationTaskSortOptions = {},
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: ImplementationTask[]; total: number; page: number; limit: number }> {
    const pool = await getConnection();
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    const request = pool.request();

    // Apply filters
    if (filters.improvementIdeaId !== undefined) {
      whereConditions.push('t.improvementIdeaId = @improvementIdeaId');
      request.input('improvementIdeaId', sql.Int, filters.improvementIdeaId);
    }
    if (filters.status) {
      whereConditions.push('t.status = @status');
      request.input('status', sql.NVarChar, filters.status);
    }
    if (filters.assignedTo !== undefined) {
      whereConditions.push('t.assignedTo = @assignedTo');
      request.input('assignedTo', sql.Int, filters.assignedTo);
    }
    if (filters.deadlineBefore) {
      whereConditions.push('t.deadline < @deadlineBefore');
      request.input('deadlineBefore', sql.DateTime2, filters.deadlineBefore);
    }
    if (filters.deadlineAfter) {
      whereConditions.push('t.deadline > @deadlineAfter');
      request.input('deadlineAfter', sql.DateTime2, filters.deadlineAfter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Determine sort field and order
    const sortBy = sortOptions.sortBy || 'deadline';
    const sortOrder = sortOptions.sortOrder || 'ASC';
    const orderByClause = `ORDER BY t.${sortBy} ${sortOrder}`;

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total
      FROM ImplementationTasks t
      ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated data
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT 
        t.*,
        u1.firstName as assignedToFirstName,
        u1.lastName as assignedToLastName,
        u1.email as assignedToEmail,
        u2.firstName as createdByFirstName,
        u2.lastName as createdByLastName,
        u2.email as createdByEmail
      FROM ImplementationTasks t
      LEFT JOIN Users u1 ON t.assignedTo = u1.id
      LEFT JOIN Users u2 ON t.createdBy = u2.id
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
   * Get implementation task by ID
   */
  static async findById(id: number): Promise<ImplementationTask | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          t.*,
          u1.firstName as assignedToFirstName,
          u1.lastName as assignedToLastName,
          u1.email as assignedToEmail,
          u2.firstName as createdByFirstName,
          u2.lastName as createdByLastName,
          u2.email as createdByEmail
        FROM ImplementationTasks t
        LEFT JOIN Users u1 ON t.assignedTo = u1.id
        LEFT JOIN Users u2 ON t.createdBy = u2.id
        WHERE t.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get tasks for a specific improvement idea
   */
  static async findByImprovementIdeaId(improvementIdeaId: number): Promise<ImplementationTask[]> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('improvementIdeaId', sql.Int, improvementIdeaId)
      .query(`
        SELECT 
          t.*,
          u1.firstName as assignedToFirstName,
          u1.lastName as assignedToLastName,
          u1.email as assignedToEmail,
          u2.firstName as createdByFirstName,
          u2.lastName as createdByLastName,
          u2.email as createdByEmail
        FROM ImplementationTasks t
        LEFT JOIN Users u1 ON t.assignedTo = u1.id
        LEFT JOIN Users u2 ON t.createdBy = u2.id
        WHERE t.improvementIdeaId = @improvementIdeaId
        ORDER BY t.deadline ASC, t.createdAt ASC
      `);

    return result.recordset;
  }

  /**
   * Update implementation task
   */
  static async update(id: number, task: Partial<ImplementationTask>): Promise<boolean> {
    const pool = await getConnection();

    let updateFields: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (task.taskName !== undefined) {
      updateFields.push('taskName = @taskName');
      request.input('taskName', sql.NVarChar, task.taskName);
    }
    if (task.taskDescription !== undefined) {
      updateFields.push('taskDescription = @taskDescription');
      request.input('taskDescription', sql.NVarChar, task.taskDescription || null);
    }
    if (task.assignedTo !== undefined) {
      updateFields.push('assignedTo = @assignedTo');
      request.input('assignedTo', sql.Int, task.assignedTo || null);
    }
    if (task.deadline !== undefined) {
      updateFields.push('deadline = @deadline');
      request.input('deadline', sql.DateTime2, task.deadline || null);
    }
    if (task.startedDate !== undefined) {
      updateFields.push('startedDate = @startedDate');
      request.input('startedDate', sql.DateTime2, task.startedDate || null);
    }
    if (task.completedDate !== undefined) {
      updateFields.push('completedDate = @completedDate');
      request.input('completedDate', sql.DateTime2, task.completedDate || null);
    }
    if (task.status !== undefined) {
      updateFields.push('status = @status');
      request.input('status', sql.NVarChar, task.status);
    }
    if (task.progressPercentage !== undefined) {
      updateFields.push('progressPercentage = @progressPercentage');
      request.input('progressPercentage', sql.Int, task.progressPercentage);
    }
    if (task.completionEvidence !== undefined) {
      updateFields.push('completionEvidence = @completionEvidence');
      request.input('completionEvidence', sql.NVarChar, task.completionEvidence || null);
    }
    if (task.updatedBy !== undefined) {
      updateFields.push('updatedBy = @updatedBy');
      request.input('updatedBy', sql.Int, task.updatedBy);
    }

    updateFields.push('updatedAt = GETDATE()');

    if (updateFields.length === 1) {
      return true; // Only updatedAt, no real changes
    }

    const result = await request.query(`
      UPDATE ImplementationTasks
      SET ${updateFields.join(', ')}
      WHERE id = @id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete implementation task
   */
  static async delete(id: number): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ImplementationTasks WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Get task statistics for an improvement idea
   */
  static async getTaskStatistics(improvementIdeaId: number): Promise<any> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('improvementIdeaId', sql.Int, improvementIdeaId)
      .query(`
        SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          AVG(CAST(progressPercentage AS FLOAT)) as avgProgress,
          SUM(CASE WHEN deadline < GETDATE() AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdueTasks
        FROM ImplementationTasks
        WHERE improvementIdeaId = @improvementIdeaId
      `);

    return result.recordset[0];
  }
}
