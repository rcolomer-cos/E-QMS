import { getConnection, sql } from '../config/database';
import { CAPAStatus } from '../types';

export interface CAPA {
  id?: number;
  capaNumber: string;
  title: string;
  description: string;
  type: string;
  source: string;
  status: CAPAStatus;
  priority: string;
  ncrId?: number;
  auditId?: number;
  rootCause?: string;
  proposedAction: string;
  actionOwner: number;
  targetDate: Date;
  completedDate?: Date;
  effectiveness?: string;
  verifiedBy?: number;
  verifiedDate?: Date;
  closedDate?: Date;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CAPAModel {
  static async create(capa: CAPA): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('capaNumber', sql.NVarChar, capa.capaNumber)
      .input('title', sql.NVarChar, capa.title)
      .input('description', sql.NVarChar, capa.description)
      .input('type', sql.NVarChar, capa.type)
      .input('source', sql.NVarChar, capa.source)
      .input('status', sql.NVarChar, capa.status)
      .input('priority', sql.NVarChar, capa.priority)
      .input('ncrId', sql.Int, capa.ncrId)
      .input('auditId', sql.Int, capa.auditId)
      .input('proposedAction', sql.NVarChar, capa.proposedAction)
      .input('actionOwner', sql.Int, capa.actionOwner)
      .input('targetDate', sql.DateTime, capa.targetDate)
      .input('createdBy', sql.Int, capa.createdBy)
      .query(`
        INSERT INTO CAPAs (capaNumber, title, description, type, source, status, priority, ncrId, auditId, proposedAction, actionOwner, targetDate, createdBy)
        OUTPUT INSERTED.id
        VALUES (@capaNumber, @title, @description, @type, @source, @status, @priority, @ncrId, @auditId, @proposedAction, @actionOwner, @targetDate, @createdBy)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<CAPA | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM CAPAs WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: { status?: CAPAStatus; priority?: string }): Promise<CAPA[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM CAPAs WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.priority) {
      request.input('priority', sql.NVarChar, filters.priority);
      query += ' AND priority = @priority';
    }

    query += ' ORDER BY targetDate ASC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<CAPA>): Promise<void> {
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
      await request.query(`UPDATE CAPAs SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM CAPAs WHERE id = @id');
  }

  static async findByActionOwner(actionOwner: number): Promise<CAPA[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('actionOwner', sql.Int, actionOwner)
      .query(`
        SELECT c.*, 
               CONCAT(u.firstName, ' ', u.lastName) as actionOwnerName,
               CONCAT(v.firstName, ' ', v.lastName) as verifiedByName
        FROM CAPAs c
        LEFT JOIN Users u ON c.actionOwner = u.id
        LEFT JOIN Users v ON c.verifiedBy = v.id
        WHERE c.actionOwner = @actionOwner
        ORDER BY c.targetDate ASC
      `);

    return result.recordset;
  }

  static async findOverdue(): Promise<CAPA[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT c.*, 
               CONCAT(u.firstName, ' ', u.lastName) as actionOwnerName,
               CONCAT(v.firstName, ' ', v.lastName) as verifiedByName
        FROM CAPAs c
        LEFT JOIN Users u ON c.actionOwner = u.id
        LEFT JOIN Users v ON c.verifiedBy = v.id
        WHERE c.targetDate < GETDATE() 
          AND c.status NOT IN ('completed', 'verified', 'closed')
        ORDER BY c.targetDate ASC
      `);

    return result.recordset;
  }
}
