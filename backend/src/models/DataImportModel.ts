import { getConnection } from '../config/database';

export interface DataImportLog {
  id?: number;
  importType: string;
  fileName: string;
  fileSize?: number;
  status: 'in_progress' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  successRows: number;
  failedRows: number;
  errorDetails?: string; // JSON string of errors
  importedBy: number;
  startedAt?: Date;
  completedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ImportError {
  row: number;
  field?: string;
  error: string;
}

export class DataImportModel {
  /**
   * Create a new import log entry
   */
  static async create(data: {
    importType: string;
    fileName: string;
    fileSize?: number;
    totalRows: number;
    importedBy: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DataImportLog> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('importType', data.importType)
      .input('fileName', data.fileName)
      .input('fileSize', data.fileSize || null)
      .input('totalRows', data.totalRows)
      .input('importedBy', data.importedBy)
      .input('ipAddress', data.ipAddress || null)
      .input('userAgent', data.userAgent || null)
      .query(`
        INSERT INTO DataImportLogs 
          (importType, fileName, fileSize, totalRows, importedBy, ipAddress, userAgent)
        OUTPUT INSERTED.*
        VALUES 
          (@importType, @fileName, @fileSize, @totalRows, @importedBy, @ipAddress, @userAgent)
      `);

    return result.recordset[0];
  }

  /**
   * Update import log with results
   */
  static async update(
    id: number,
    data: {
      status: 'in_progress' | 'completed' | 'failed' | 'partial';
      successRows: number;
      failedRows: number;
      errorDetails?: ImportError[];
    }
  ): Promise<void> {
    const pool = await getConnection();
    await pool.request()
      .input('id', id)
      .input('status', data.status)
      .input('successRows', data.successRows)
      .input('failedRows', data.failedRows)
      .input('errorDetails', data.errorDetails ? JSON.stringify(data.errorDetails) : null)
      .query(`
        UPDATE DataImportLogs
        SET 
          status = @status,
          successRows = @successRows,
          failedRows = @failedRows,
          errorDetails = @errorDetails,
          completedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Get import log by ID
   */
  static async findById(id: number): Promise<DataImportLog | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM DataImportLogs WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Get all import logs with pagination
   */
  static async findAll(options: {
    importType?: string;
    importedBy?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ logs: DataImportLog[]; total: number }> {
    const pool = await getConnection();
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const conditions: string[] = [];

    if (options.importType) {
      conditions.push('importType = @importType');
    }
    if (options.importedBy) {
      conditions.push('importedBy = @importedBy');
    }
    if (options.status) {
      conditions.push('status = @status');
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const request = pool.request()
      .input('limit', limit)
      .input('offset', offset);

    if (options.importType) {
      request.input('importType', options.importType);
    }
    if (options.importedBy) {
      request.input('importedBy', options.importedBy);
    }
    if (options.status) {
      request.input('status', options.status);
    }

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total 
      FROM DataImportLogs 
      ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    // Get paginated logs
    const result = await request.query(`
      SELECT 
        il.*,
        u.firstName,
        u.lastName,
        u.email
      FROM DataImportLogs il
      LEFT JOIN Users u ON il.importedBy = u.id
      ${whereClause}
      ORDER BY il.startedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    return {
      logs: result.recordset,
      total,
    };
  }

  /**
   * Delete import logs older than specified days
   */
  static async deleteOlderThan(days: number): Promise<number> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('days', days)
      .query(`
        DELETE FROM DataImportLogs
        WHERE startedAt < DATEADD(day, -@days, GETDATE())
      `);

    return result.rowsAffected[0];
  }
}
