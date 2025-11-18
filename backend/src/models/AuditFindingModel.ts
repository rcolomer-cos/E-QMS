import { getConnection, sql } from '../config/database';

export interface AuditFinding {
  id?: number;
  findingNumber: string;
  auditId: number;
  title: string;
  description: string;
  category: string;
  severity: 'observation' | 'minor' | 'major' | 'critical';
  evidence?: string;
  rootCause?: string;
  auditCriteria?: string;
  clauseReference?: string;
  recommendations?: string;
  requiresNCR: boolean;
  ncrId?: number;
  status: 'open' | 'under_review' | 'action_planned' | 'resolved' | 'closed';
  identifiedDate: Date;
  targetCloseDate?: Date;
  closedDate?: Date;
  identifiedBy: number;
  assignedTo?: number;
  verifiedBy?: number;
  verifiedDate?: Date;
  department?: string;
  processId?: number;
  affectedArea?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditFindingModel {
  static async create(finding: AuditFinding): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('findingNumber', sql.NVarChar, finding.findingNumber)
      .input('auditId', sql.Int, finding.auditId)
      .input('title', sql.NVarChar, finding.title)
      .input('description', sql.NVarChar, finding.description)
      .input('category', sql.NVarChar, finding.category)
      .input('severity', sql.NVarChar, finding.severity)
      .input('evidence', sql.NVarChar, finding.evidence)
      .input('rootCause', sql.NVarChar, finding.rootCause)
      .input('auditCriteria', sql.NVarChar, finding.auditCriteria)
      .input('clauseReference', sql.NVarChar, finding.clauseReference)
      .input('recommendations', sql.NVarChar, finding.recommendations)
      .input('requiresNCR', sql.Bit, finding.requiresNCR)
      .input('ncrId', sql.Int, finding.ncrId)
      .input('status', sql.NVarChar, finding.status)
      .input('identifiedDate', sql.DateTime, finding.identifiedDate)
      .input('targetCloseDate', sql.DateTime, finding.targetCloseDate)
      .input('identifiedBy', sql.Int, finding.identifiedBy)
      .input('assignedTo', sql.Int, finding.assignedTo)
      .input('department', sql.NVarChar, finding.department)
      .input('processId', sql.Int, finding.processId)
      .input('affectedArea', sql.NVarChar, finding.affectedArea)
      .input('createdBy', sql.Int, finding.createdBy)
      .query(`
        INSERT INTO AuditFindings (
          findingNumber, auditId, title, description, category, severity,
          evidence, rootCause, auditCriteria, clauseReference, recommendations,
          requiresNCR, ncrId, status, identifiedDate, targetCloseDate,
          identifiedBy, assignedTo, department, processId, affectedArea, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @findingNumber, @auditId, @title, @description, @category, @severity,
          @evidence, @rootCause, @auditCriteria, @clauseReference, @recommendations,
          @requiresNCR, @ncrId, @status, @identifiedDate, @targetCloseDate,
          @identifiedBy, @assignedTo, @department, @processId, @affectedArea, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<AuditFinding | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM AuditFindings WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByAuditId(auditId: number): Promise<AuditFinding[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query('SELECT * FROM AuditFindings WHERE auditId = @auditId ORDER BY identifiedDate DESC');

    return result.recordset;
  }

  static async findAll(filters?: {
    status?: string;
    severity?: string;
    auditId?: number;
    assignedTo?: number;
    category?: string;
  }): Promise<AuditFinding[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM AuditFindings WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.severity) {
      request.input('severity', sql.NVarChar, filters.severity);
      query += ' AND severity = @severity';
    }
    if (filters?.auditId) {
      request.input('auditId', sql.Int, filters.auditId);
      query += ' AND auditId = @auditId';
    }
    if (filters?.assignedTo) {
      request.input('assignedTo', sql.Int, filters.assignedTo);
      query += ' AND assignedTo = @assignedTo';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }

    query += ' ORDER BY identifiedDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<AuditFinding>): Promise<void> {
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
      await request.query(`UPDATE AuditFindings SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM AuditFindings WHERE id = @id');
  }

  static async linkToNCR(id: number, ncrId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('ncrId', sql.Int, ncrId)
      .query('UPDATE AuditFindings SET ncrId = @ncrId, requiresNCR = 1, updatedAt = GETDATE() WHERE id = @id');
  }

  static async getFindingStatsByAudit(auditId: number): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query(`
        SELECT 
          COUNT(*) as total,
          severity,
          status
        FROM AuditFindings 
        WHERE auditId = @auditId
        GROUP BY severity, status
      `);

    const stats = {
      total: 0,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    result.recordset.forEach((row: { total: number; severity: string; status: string }) => {
      stats.total += row.total;
      stats.bySeverity[row.severity] = (stats.bySeverity[row.severity] || 0) + row.total;
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.total;
    });

    return stats;
  }

  static async getFindingsSummary(filters?: {
    startDate?: Date;
    endDate?: Date;
    processId?: number;
  }): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byProcess: Record<string, number>;
    byStatus: Record<string, number>;
    overTime: Array<{ month: string; count: number }>;
  }> {
    const pool = await getConnection();
    const request = pool.request();
    let whereConditions = '1=1';

    if (filters?.startDate) {
      request.input('startDate', sql.DateTime, filters.startDate);
      whereConditions += ' AND identifiedDate >= @startDate';
    }
    if (filters?.endDate) {
      request.input('endDate', sql.DateTime, filters.endDate);
      whereConditions += ' AND identifiedDate <= @endDate';
    }
    if (filters?.processId) {
      request.input('processId', sql.Int, filters.processId);
      whereConditions += ' AND processId = @processId';
    }

    // Get aggregated statistics
    const result = await request.query(`
      SELECT 
        COUNT(*) as total,
        category,
        severity,
        status,
        ISNULL(CAST(processId AS NVARCHAR), 'Unassigned') as processName
      FROM AuditFindings 
      WHERE ${whereConditions}
      GROUP BY category, severity, status, processId
    `);

    // Get time-series data (monthly aggregation)
    const timeSeriesResult = await pool
      .request()
      .input('startDate', sql.DateTime, filters?.startDate)
      .input('endDate', sql.DateTime, filters?.endDate)
      .input('processId', sql.Int, filters?.processId)
      .query(`
        SELECT 
          FORMAT(identifiedDate, 'yyyy-MM') as month,
          COUNT(*) as count
        FROM AuditFindings 
        WHERE ${whereConditions}
        GROUP BY FORMAT(identifiedDate, 'yyyy-MM')
        ORDER BY FORMAT(identifiedDate, 'yyyy-MM')
      `);

    const summary = {
      total: 0,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byProcess: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      overTime: [] as Array<{ month: string; count: number }>,
    };

    result.recordset.forEach((row: {
      total: number;
      category: string;
      severity: string;
      status: string;
      processName: string;
    }) => {
      summary.total += row.total;
      summary.byCategory[row.category] = (summary.byCategory[row.category] || 0) + row.total;
      summary.bySeverity[row.severity] = (summary.bySeverity[row.severity] || 0) + row.total;
      summary.byProcess[row.processName] = (summary.byProcess[row.processName] || 0) + row.total;
      summary.byStatus[row.status] = (summary.byStatus[row.status] || 0) + row.total;
    });

    summary.overTime = timeSeriesResult.recordset.map((row: { month: string; count: number }) => ({
      month: row.month,
      count: row.count,
    }));

    return summary;
  }
}
