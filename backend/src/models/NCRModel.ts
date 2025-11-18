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
  inspectionRecordId?: number;
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
      .input('inspectionRecordId', sql.Int, ncr.inspectionRecordId)
      .query(`
        INSERT INTO NCRs (ncrNumber, title, description, source, category, status, severity, detectedDate, reportedBy, inspectionRecordId)
        OUTPUT INSERTED.id
        VALUES (@ncrNumber, @title, @description, @source, @category, @status, @severity, @detectedDate, @reportedBy, @inspectionRecordId)
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

  static async findByInspectionRecordId(inspectionRecordId: number): Promise<NCR[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query('SELECT * FROM NCRs WHERE inspectionRecordId = @inspectionRecordId ORDER BY detectedDate DESC');

    return result.recordset;
  }

  static async getMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalOpen: number;
    totalInProgress: number;
    totalResolved: number;
    totalClosed: number;
    totalRejected: number;
    bySeverity: { severity: string; count: number }[];
    byCategory: { category: string; count: number }[];
    bySource: { source: string; count: number }[];
    monthlyTrend: { month: string; count: number }[];
    averageClosureTime: number;
  }> {
    const pool = await getConnection();
    const request = pool.request();
    let whereConditions = '1=1';

    // Apply date filters
    if (filters?.startDate) {
      request.input('startDate', sql.DateTime, filters.startDate);
      whereConditions += ' AND detectedDate >= @startDate';
    }
    if (filters?.endDate) {
      request.input('endDate', sql.DateTime, filters.endDate);
      whereConditions += ' AND detectedDate <= @endDate';
    }
    
    // Get status counts
    const statusResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT 
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as totalOpen,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as totalInProgress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as totalResolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as totalRejected
      FROM NCRs
      WHERE ${whereConditions}
    `);

    // Get severity breakdown
    const severityResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT severity, COUNT(*) as count
      FROM NCRs
      WHERE status NOT IN ('closed', 'rejected') AND ${whereConditions}
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'major' THEN 2
          WHEN 'minor' THEN 3
        END
    `);

    // Get category breakdown
    const categoryResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT category, COUNT(*) as count
      FROM NCRs
      WHERE status NOT IN ('closed', 'rejected') AND ${whereConditions}
      GROUP BY category
      ORDER BY count DESC
    `);

    // Get source breakdown
    const sourceResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT source, COUNT(*) as count
      FROM NCRs
      WHERE status NOT IN ('closed', 'rejected') AND ${whereConditions}
      GROUP BY source
      ORDER BY count DESC
    `);

    // Get monthly trend (last 12 months by default, or within filter range)
    const monthlyTrendResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT 
        FORMAT(detectedDate, 'yyyy-MM') as month,
        COUNT(*) as count
      FROM NCRs
      WHERE ${whereConditions}${!filters?.startDate ? ' AND detectedDate >= DATEADD(MONTH, -12, GETDATE())' : ''}
      GROUP BY FORMAT(detectedDate, 'yyyy-MM')
      ORDER BY FORMAT(detectedDate, 'yyyy-MM')
    `);

    // Get average closure time (in days)
    const closureTimeResult = await pool.request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .query(`
      SELECT 
        AVG(DATEDIFF(DAY, detectedDate, closedDate)) as avgClosureTime
      FROM NCRs
      WHERE closedDate IS NOT NULL AND ${whereConditions}
    `);

    const stats = statusResult.recordset[0];
    const avgClosureTime = closureTimeResult.recordset[0]?.avgClosureTime || 0;
    
    return {
      totalOpen: stats.totalOpen || 0,
      totalInProgress: stats.totalInProgress || 0,
      totalResolved: stats.totalResolved || 0,
      totalClosed: stats.totalClosed || 0,
      totalRejected: stats.totalRejected || 0,
      bySeverity: severityResult.recordset.map(r => ({ severity: r.severity, count: r.count })),
      byCategory: categoryResult.recordset.map(r => ({ category: r.category, count: r.count })),
      bySource: sourceResult.recordset.map(r => ({ source: r.source, count: r.count })),
      monthlyTrend: monthlyTrendResult.recordset.map(r => ({ month: r.month, count: r.count })),
      averageClosureTime: Math.round(avgClosureTime) || 0,
    };
  }
}
