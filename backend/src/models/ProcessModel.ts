import { getConnection, sql } from '../config/database';

export interface Process {
  id?: number;
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  departmentName?: string; // Populated when fetched with department info
  processCategory?: string;
  processType?: 'main' | 'sub' | 'support';
  parentProcessId?: number | null;
  displayOrder?: number;
  objective?: string;
  scope?: string;
  flowchartSvg?: string | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export interface CreateProcessData {
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  processCategory?: string;
  processType?: 'main' | 'sub' | 'support';
  parentProcessId?: number | null;
  displayOrder?: number;
  objective?: string;
  scope?: string;
  flowchartSvg?: string | null;
  createdBy: number;
}

export class ProcessModel {
  /**
   * Create a new process
   */
  static async create(processData: CreateProcessData): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('name', sql.NVarChar, processData.name)
      .input('code', sql.NVarChar, processData.code.toUpperCase())
      .input('description', sql.NVarChar, processData.description)
      .input('departmentId', sql.Int, processData.departmentId)
      .input('processCategory', sql.NVarChar, processData.processCategory)
      .input('processType', sql.NVarChar, processData.processType)
      .input('parentProcessId', sql.Int, processData.parentProcessId)
      .input('objective', sql.NVarChar, processData.objective)
      .input('scope', sql.NVarChar, processData.scope)
      .input('flowchartSvg', sql.NVarChar(sql.MAX), processData.flowchartSvg)
      .input('displayOrder', sql.Int, processData.displayOrder)
      .input('createdBy', sql.Int, processData.createdBy)
      .query(`
        INSERT INTO Processes (name, code, description, departmentId, processCategory, processType, parentProcessId, displayOrder, objective, scope, flowchartSvg, active, createdBy)
        OUTPUT INSERTED.id
        VALUES (@name, @code, @description, @departmentId, @processCategory, @processType, @parentProcessId, @displayOrder, @objective, @scope, @flowchartSvg, 1, @createdBy)
      `);

    return result.recordset[0].id;
  }

  /**
   * Find process by ID
   */
  static async findById(id: number): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.description,
          p.departmentId,
          d.name as departmentName,
          p.processCategory,
          COALESCE(p.processType, 'main') as processType,
          p.parentProcessId,
          COALESCE(p.displayOrder, 0) as displayOrder,
          p.objective,
          p.scope,
          p.flowchartSvg,
          p.active,
          p.createdAt,
          p.updatedAt,
          p.createdBy
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.id = @id AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find process by code
   */
  static async findByCode(code: string): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.description,
          p.departmentId,
          d.name as departmentName,
          p.processCategory,
          COALESCE(p.processType, 'main') as processType,
          p.parentProcessId,
          COALESCE(p.displayOrder, 0) as displayOrder,
          p.objective,
          p.scope,
          p.flowchartSvg,
          p.active,
          p.createdAt,
          p.updatedAt,
          p.createdBy
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.code = @code AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Find process by name
   */
  static async findByName(name: string): Promise<Process | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query(`
        SELECT 
          p.*,
          d.name as departmentName
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.name = @name AND p.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  /**
   * Get all active processes
   */
  static async findAll(): Promise<Process[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.description,
          p.departmentId,
          d.name as departmentName,
          p.processCategory,
          COALESCE(p.processType, 'main') as processType,
          p.parentProcessId,
          COALESCE(p.displayOrder, 0) as displayOrder,
          p.objective,
          p.scope,
          p.flowchartSvg,
          p.active,
          p.createdAt,
          p.updatedAt,
          p.createdBy
        FROM Processes p
        LEFT JOIN Departments d ON p.departmentId = d.id
        WHERE p.active = 1
        ORDER BY 
          CASE 
            WHEN COALESCE(p.processType, 'main') = 'main' THEN 1 
            WHEN COALESCE(p.processType, 'main') = 'support' THEN 2 
            WHEN COALESCE(p.processType, 'main') = 'sub' THEN 3 
            ELSE 4 
          END,
          ISNULL(p.displayOrder, 999999),
          p.name
      `);

    return result.recordset;
  }

  /**
   * Update process information
   */
  static async update(id: number, updates: Partial<Process>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    if (updates.name) {
      request.input('name', sql.NVarChar, updates.name);
      fields.push('name = @name');
    }
    if (updates.code) {
      request.input('code', sql.NVarChar, updates.code.toUpperCase());
      fields.push('code = @code');
    }
    if (updates.description !== undefined) {
      request.input('description', sql.NVarChar, updates.description);
      fields.push('description = @description');
    }
    if (updates.departmentId !== undefined) {
      request.input('departmentId', sql.Int, updates.departmentId);
      fields.push('departmentId = @departmentId');
    }
    if (updates.processCategory !== undefined) {
      request.input('processCategory', sql.NVarChar, updates.processCategory);
      fields.push('processCategory = @processCategory');
    }
    if (updates.processType !== undefined) {
      request.input('processType', sql.NVarChar, updates.processType);
      fields.push('processType = @processType');
    }
    if (updates.parentProcessId !== undefined) {
      request.input('parentProcessId', sql.Int, updates.parentProcessId as number | null);
      fields.push('parentProcessId = @parentProcessId');
    }
    if (updates.objective !== undefined) {
      request.input('objective', sql.NVarChar, updates.objective);
      fields.push('objective = @objective');
    }
    if (updates.scope !== undefined) {
      request.input('scope', sql.NVarChar, updates.scope);
      fields.push('scope = @scope');
    }
    if (updates.flowchartSvg !== undefined) {
      request.input('flowchartSvg', sql.NVarChar(sql.MAX), updates.flowchartSvg);
      fields.push('flowchartSvg = @flowchartSvg');
    }
    if (updates.displayOrder !== undefined) {
      request.input('displayOrder', sql.Int, updates.displayOrder);
      fields.push('displayOrder = @displayOrder');
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Processes SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Soft delete process
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Processes SET active = 0, updatedAt = GETDATE() WHERE id = @id');
  }

  /**
   * Check if process code exists
   */
  static async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('code', sql.NVarChar, code.toUpperCase());
    
    let query = 'SELECT COUNT(*) as count FROM Processes WHERE code = @code AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Check if process name exists
   */
  static async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request().input('name', sql.NVarChar, name);
    
    let query = 'SELECT COUNT(*) as count FROM Processes WHERE name = @name AND active = 1';
    
    if (excludeId) {
      request.input('excludeId', sql.Int, excludeId);
      query += ' AND id != @excludeId';
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Get all documents linked to a process
   */
  static async getLinkedDocuments(processId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('processId', sql.Int, processId)
      .query(`
        SELECT 
          d.id,
          d.title,
          d.documentType,
          d.category,
          d.version,
          d.status,
          d.createdAt,
          pd.linkedAt,
          u.firstName + ' ' + u.lastName as linkedByName
        FROM ProcessDocuments pd
        INNER JOIN Documents d ON pd.documentId = d.id
        LEFT JOIN Users u ON pd.linkedBy = u.id
        WHERE pd.processId = @processId
        ORDER BY pd.linkedAt DESC
      `);

    return result.recordset;
  }

  /**
   * Check if a document is already linked to a process
   */
  static async documentLinkExists(processId: number, documentId: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('processId', sql.Int, processId)
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT COUNT(*) as count 
        FROM ProcessDocuments 
        WHERE processId = @processId AND documentId = @documentId
      `);

    return result.recordset[0].count > 0;
  }

  /**
   * Link a document to a process
   */
  static async linkDocument(processId: number, documentId: number, linkedBy: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('processId', sql.Int, processId)
      .input('documentId', sql.Int, documentId)
      .input('linkedBy', sql.Int, linkedBy)
      .query(`
        INSERT INTO ProcessDocuments (processId, documentId, linkedBy, linkedAt)
        VALUES (@processId, @documentId, @linkedBy, GETDATE())
      `);
  }

  /**
   * Unlink a document from a process
   */
  static async unlinkDocument(processId: number, documentId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('processId', sql.Int, processId)
      .input('documentId', sql.Int, documentId)
      .query(`
        DELETE FROM ProcessDocuments 
        WHERE processId = @processId AND documentId = @documentId
      `);
  }
}
