import { getConnection, sql } from '../config/database';
import { AuditStatus } from '../types';

export interface Audit {
  id?: number;
  auditNumber: string;
  title: string;
  description?: string;
  auditType: string;
  scope: string;
  status: AuditStatus;
  scheduledDate: Date;
  completedDate?: Date;
  leadAuditorId: number;
  department?: string;
  auditCriteria?: string;
  relatedProcesses?: string;
  findings?: string;
  conclusions?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditModel {
  static async create(audit: Audit): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('auditNumber', sql.NVarChar, audit.auditNumber)
      .input('title', sql.NVarChar, audit.title)
      .input('description', sql.NVarChar, audit.description)
      .input('auditType', sql.NVarChar, audit.auditType)
      .input('scope', sql.NVarChar, audit.scope)
      .input('status', sql.NVarChar, audit.status)
      .input('scheduledDate', sql.DateTime, audit.scheduledDate)
      .input('leadAuditorId', sql.Int, audit.leadAuditorId)
      .input('department', sql.NVarChar, audit.department)
      .input('auditCriteria', sql.NVarChar, audit.auditCriteria)
      .input('relatedProcesses', sql.NVarChar, audit.relatedProcesses)
      .input('createdBy', sql.Int, audit.createdBy)
      .query(`
        INSERT INTO Audits (auditNumber, title, description, auditType, scope, status, scheduledDate, leadAuditorId, department, auditCriteria, relatedProcesses, createdBy)
        OUTPUT INSERTED.id
        VALUES (@auditNumber, @title, @description, @auditType, @scope, @status, @scheduledDate, @leadAuditorId, @department, @auditCriteria, @relatedProcesses, @createdBy)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<Audit | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Audits WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: { status?: AuditStatus; auditType?: string }): Promise<Audit[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Audits WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.auditType) {
      request.input('auditType', sql.NVarChar, filters.auditType);
      query += ' AND auditType = @auditType';
    }

    query += ' ORDER BY scheduledDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<Audit>): Promise<void> {
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
      await request.query(`UPDATE Audits SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Audits WHERE id = @id');
  }
}
