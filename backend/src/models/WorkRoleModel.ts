import { getConnection, sql } from '../config/database';

export interface WorkRole {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  category?: string;
  level?: string;
  status: string;
  displayOrder?: number;
  active?: boolean;
  responsibilitiesAndAuthorities?: string;
  requiredQualifications?: string;
  experienceYears?: number;
  notes?: string;
  attachmentPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
}

export interface WorkRoleFilters {
  status?: string;
  category?: string;
  level?: string;
  departmentId?: number;
  active?: boolean;
  searchTerm?: string;
}

export interface WorkRoleSortOptions {
  sortBy?: 'name' | 'code' | 'category' | 'level' | 'displayOrder' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

class WorkRoleModel {
  /**
   * Get all work roles with optional filtering and sorting
   */
  async getAll(
    filters?: WorkRoleFilters,
    sortOptions?: WorkRoleSortOptions
  ): Promise<WorkRole[]> {
    const pool = await getConnection();
    
    let query = `
      SELECT 
        wr.id,
        wr.name,
        wr.code,
        wr.description,
        wr.departmentId,
        d.name as departmentName,
        wr.category,
        wr.level,
        wr.status,
        wr.displayOrder,
        wr.active,
        wr.responsibilitiesAndAuthorities,
        wr.requiredQualifications,
        wr.experienceYears,
        wr.notes,
        wr.attachmentPath,
        wr.createdAt,
        wr.updatedAt,
        wr.createdBy,
        wr.updatedBy,
        creator.firstName + ' ' + creator.lastName as createdByName,
        updater.firstName + ' ' + updater.lastName as updatedByName
      FROM WorkRoles wr
      LEFT JOIN Departments d ON wr.departmentId = d.id
      LEFT JOIN Users creator ON wr.createdBy = creator.id
      LEFT JOIN Users updater ON wr.updatedBy = updater.id
      WHERE 1=1
    `;

    const conditions: string[] = [];
    const request = pool.request();

    // Apply filters
    if (filters) {
      if (filters.status) {
        conditions.push('wr.status = @status');
        request.input('status', sql.NVarChar(50), filters.status);
      }

      if (filters.category) {
        conditions.push('wr.category = @category');
        request.input('category', sql.NVarChar(100), filters.category);
      }

      if (filters.level) {
        conditions.push('wr.level = @level');
        request.input('level', sql.NVarChar(50), filters.level);
      }

      if (filters.departmentId !== undefined) {
        conditions.push('wr.departmentId = @departmentId');
        request.input('departmentId', sql.Int, filters.departmentId);
      }

      if (filters.active !== undefined) {
        conditions.push('wr.active = @active');
        request.input('active', sql.Bit, filters.active);
      }

      if (filters.searchTerm) {
        conditions.push(
          '(wr.name LIKE @searchTerm OR wr.code LIKE @searchTerm OR wr.description LIKE @searchTerm)'
        );
        request.input('searchTerm', sql.NVarChar, `%${filters.searchTerm}%`);
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Apply sorting
    const sortBy = sortOptions?.sortBy || 'displayOrder';
    const sortOrder = sortOptions?.sortOrder || 'ASC';
    query += ` ORDER BY wr.${sortBy} ${sortOrder}`;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get a single work role by ID
   */
  async getById(id: number): Promise<WorkRole | null> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          wr.id,
          wr.name,
          wr.code,
          wr.description,
          wr.departmentId,
          d.name as departmentName,
          wr.category,
          wr.level,
          wr.status,
          wr.displayOrder,
          wr.active,
          wr.responsibilitiesAndAuthorities,
          wr.requiredQualifications,
          wr.experienceYears,
          wr.notes,
          wr.attachmentPath,
          wr.createdAt,
          wr.updatedAt,
          wr.createdBy,
          wr.updatedBy,
          creator.firstName + ' ' + creator.lastName as createdByName,
          updater.firstName + ' ' + updater.lastName as updatedByName
        FROM WorkRoles wr
        LEFT JOIN Departments d ON wr.departmentId = d.id
        LEFT JOIN Users creator ON wr.createdBy = creator.id
        LEFT JOIN Users updater ON wr.updatedBy = updater.id
        WHERE wr.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create a new work role
   */
  async create(workRole: WorkRole): Promise<WorkRole> {
    const pool = await getConnection();
    
    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      return value;
    };

    const result = await pool
      .request()
      .input('name', sql.NVarChar(200), workRole.name)
      .input('code', sql.NVarChar(50), toNullIfEmpty(workRole.code))
      .input('description', sql.NVarChar(2000), toNullIfEmpty(workRole.description))
      .input('departmentId', sql.Int, workRole.departmentId || null)
      .input('category', sql.NVarChar(100), toNullIfEmpty(workRole.category))
      .input('level', sql.NVarChar(50), toNullIfEmpty(workRole.level))
      .input('status', sql.NVarChar(50), workRole.status || 'active')
      .input('displayOrder', sql.Int, workRole.displayOrder || 0)
      .input('active', sql.Bit, workRole.active !== undefined ? workRole.active : true)
      .input('responsibilitiesAndAuthorities', sql.NVarChar(sql.MAX), toNullIfEmpty(workRole.responsibilitiesAndAuthorities))
      .input('requiredQualifications', sql.NVarChar(2000), toNullIfEmpty(workRole.requiredQualifications))
      .input('experienceYears', sql.Int, workRole.experienceYears || null)
      .input('notes', sql.NVarChar(2000), toNullIfEmpty(workRole.notes))
      .input('attachmentPath', sql.NVarChar(500), toNullIfEmpty(workRole.attachmentPath))
      .input('createdBy', sql.Int, workRole.createdBy)
      .query(`
        INSERT INTO WorkRoles (
          name, code, description, departmentId, category, level,
          status, displayOrder, active, responsibilitiesAndAuthorities,
          requiredQualifications, experienceYears, notes, attachmentPath,
          createdBy, createdAt, updatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @code, @description, @departmentId, @category, @level,
          @status, @displayOrder, @active, @responsibilitiesAndAuthorities,
          @requiredQualifications, @experienceYears, @notes, @attachmentPath,
          @createdBy, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Update an existing work role
   */
  async update(id: number, workRole: Partial<WorkRole>): Promise<WorkRole> {
    const pool = await getConnection();
    
    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      return value;
    };

    const request = pool.request();
    const updates: string[] = [];

    // Build dynamic update query
    const fields: { [key: string]: any } = {
      name: workRole.name,
      code: workRole.code,
      description: workRole.description,
      departmentId: workRole.departmentId,
      category: workRole.category,
      level: workRole.level,
      status: workRole.status,
      displayOrder: workRole.displayOrder,
      active: workRole.active,
      responsibilitiesAndAuthorities: workRole.responsibilitiesAndAuthorities,
      requiredQualifications: workRole.requiredQualifications,
      experienceYears: workRole.experienceYears,
      notes: workRole.notes,
      attachmentPath: workRole.attachmentPath,
      updatedBy: workRole.updatedBy,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = @${key}`);
        
        // Determine SQL type
        let processedValue = value;
        if (key === 'responsibilitiesAndAuthorities') {
          processedValue = toNullIfEmpty(value);
          request.input(key, sql.NVarChar(sql.MAX), processedValue);
        } else if (key === 'name' || key === 'code' || key === 'description' || 
            key === 'category' || key === 'level' || key === 'status' ||
            key === 'notes' || key === 'attachmentPath' || key === 'requiredQualifications') {
          processedValue = toNullIfEmpty(value);
          const maxLength = key === 'description' || key === 'notes' || key === 'requiredQualifications' ? 2000 :
                           key === 'name' ? 200 :
                           key === 'attachmentPath' ? 500 :
                           key === 'category' ? 100 : 50;
          request.input(key, sql.NVarChar(maxLength), processedValue);
        } else if (key === 'departmentId' || key === 'displayOrder' || 
                   key === 'experienceYears' || key === 'updatedBy') {
          request.input(key, sql.Int, processedValue || null);
        } else if (key === 'active') {
          request.input(key, sql.Bit, processedValue);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    // Always update the updatedAt timestamp
    updates.push('updatedAt = GETDATE()');

    request.input('id', sql.Int, id);

    const result = await request.query(`
      UPDATE WorkRoles
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      throw new Error('Work role not found');
    }

    return result.recordset[0];
  }

  /**
   * Delete a work role (soft delete by setting status to 'archived' and active to false)
   */
  async delete(id: number, userId: number): Promise<void> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE WorkRoles
        SET 
          status = 'archived',
          active = 0,
          updatedBy = @userId,
          updatedAt = GETDATE()
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Work role not found');
    }
  }

  /**
   * Hard delete a work role (permanent deletion)
   * Use with caution - only when there are no dependencies
   */
  async hardDelete(id: number): Promise<void> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM WorkRoles WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Work role not found');
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT DISTINCT category
      FROM WorkRoles
      WHERE category IS NOT NULL AND active = 1
      ORDER BY category
    `);

    return result.recordset.map(row => row.category);
  }

  /**
   * Get unique levels
   */
  async getLevels(): Promise<string[]> {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT DISTINCT level
      FROM WorkRoles
      WHERE level IS NOT NULL AND active = 1
      ORDER BY 
        CASE level
          WHEN 'Entry' THEN 1
          WHEN 'Junior' THEN 2
          WHEN 'Mid' THEN 3
          WHEN 'Senior' THEN 4
          WHEN 'Lead' THEN 5
          WHEN 'Manager' THEN 6
          WHEN 'Director' THEN 7
          WHEN 'Executive' THEN 8
          ELSE 9
        END
    `);

    return result.recordset.map(row => row.level);
  }

  /**
   * Check if a work role name already exists
   */
  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    
    const request = pool.request()
      .input('name', sql.NVarChar(200), name);

    let query = 'SELECT COUNT(*) as count FROM WorkRoles WHERE name = @name';
    
    if (excludeId) {
      query += ' AND id != @excludeId';
      request.input('excludeId', sql.Int, excludeId);
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Get work roles by department
   */
  async getByDepartment(departmentId: number): Promise<WorkRole[]> {
    return this.getAll({ departmentId, active: true });
  }

  /**
   * Get work roles statistics
   */
  async getStatistics(): Promise<any> {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalRoles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeRoles,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveRoles,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archivedRoles,
        COUNT(DISTINCT category) as totalCategories,
        COUNT(DISTINCT departmentId) as departmentsWithRoles
      FROM WorkRoles
    `);

    return result.recordset[0];
  }
}

export default new WorkRoleModel();
