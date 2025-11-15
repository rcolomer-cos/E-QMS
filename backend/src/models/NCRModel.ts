import { getConnection, sql } from '../config/database';
import { NCRStatus } from '../types';

export interface NCR {
  id?: number;
  ncrNumber: string;
  title: string;
  description: string;
  source: string;
  category: string;
  status: NCRStatus;
  severity: string;
  detectedDate: Date;
  reportedBy: number;
  assignedTo?: number;
  rootCause?: string;
  containmentAction?: string;
  correctiveAction?: string;
  verifiedBy?: number;
  verifiedDate?: Date;
  closedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NCRModel {
  static async create(ncr: NCR): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('ncrNumber', sql.NVarChar, ncr.ncrNumber)
      .input('title', sql.NVarChar, ncr.title)
      .input('description', sql.NVarChar, ncr.description)
      .input('source', sql.NVarChar, ncr.source)
      .input('category', sql.NVarChar, ncr.category)
      .input('status', sql.NVarChar, ncr.status)
      .input('severity', sql.NVarChar, ncr.severity)
      .input('detectedDate', sql.DateTime, ncr.detectedDate)
      .input('reportedBy', sql.Int, ncr.reportedBy)
      .query(`
        INSERT INTO NCRs (ncrNumber, title, description, source, category, status, severity, detectedDate, reportedBy)
        OUTPUT INSERTED.id
        VALUES (@ncrNumber, @title, @description, @source, @category, @status, @severity, @detectedDate, @reportedBy)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<NCR | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM NCRs WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: { status?: NCRStatus; severity?: string }): Promise<NCR[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM NCRs WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.severity) {
      request.input('severity', sql.NVarChar, filters.severity);
      query += ' AND severity = @severity';
    }

    query += ' ORDER BY detectedDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<NCR>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        request.input(key, value);
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE NCRs SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM NCRs WHERE id = @id');
  }
}
