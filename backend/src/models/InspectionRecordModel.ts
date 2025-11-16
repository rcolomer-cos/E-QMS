import { getConnection, sql } from '../config/database';

export interface InspectionRecord {
  id?: number;
  equipmentId: number;
  inspectionDate: Date;
  dueDate?: Date;
  nextDueDate?: Date;
  inspectedBy: number;
  reviewedBy?: number;
  inspectionType: string;
  inspectionChecklist?: string;
  result: InspectionResult;
  findings?: string;
  defectsFound?: string;
  passed: boolean;
  safetyCompliant?: boolean;
  operationalCompliant?: boolean;
  measurementsTaken?: string;
  parameters?: string;
  correctiveAction?: string;
  recommendedAction?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  attachments?: string;
  status: InspectionStatus;
  severity?: InspectionSeverity;
  duration?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export enum InspectionResult {
  PENDING = 'pending',
  PASSED = 'passed',
  PASSED_WITH_OBSERVATIONS = 'passed_with_observations',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InspectionSeverity {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export class InspectionRecordModel {
  static async create(record: InspectionRecord): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('equipmentId', sql.Int, record.equipmentId)
      .input('inspectionDate', sql.DateTime2, record.inspectionDate)
      .input('dueDate', sql.DateTime2, record.dueDate)
      .input('nextDueDate', sql.DateTime2, record.nextDueDate)
      .input('inspectedBy', sql.Int, record.inspectedBy)
      .input('reviewedBy', sql.Int, record.reviewedBy)
      .input('inspectionType', sql.NVarChar, record.inspectionType)
      .input('inspectionChecklist', sql.NVarChar, record.inspectionChecklist)
      .input('result', sql.NVarChar, record.result)
      .input('findings', sql.NVarChar, record.findings)
      .input('defectsFound', sql.NVarChar, record.defectsFound)
      .input('passed', sql.Bit, record.passed)
      .input('safetyCompliant', sql.Bit, record.safetyCompliant ?? true)
      .input('operationalCompliant', sql.Bit, record.operationalCompliant ?? true)
      .input('measurementsTaken', sql.NVarChar, record.measurementsTaken)
      .input('parameters', sql.NVarChar, record.parameters)
      .input('correctiveAction', sql.NVarChar, record.correctiveAction)
      .input('recommendedAction', sql.NVarChar, record.recommendedAction)
      .input('followUpRequired', sql.Bit, record.followUpRequired ?? false)
      .input('followUpDate', sql.DateTime2, record.followUpDate)
      .input('attachments', sql.NVarChar, record.attachments)
      .input('status', sql.NVarChar, record.status)
      .input('severity', sql.NVarChar, record.severity)
      .input('duration', sql.Int, record.duration)
      .input('notes', sql.NVarChar, record.notes)
      .input('createdBy', sql.Int, record.createdBy)
      .query(`
        INSERT INTO InspectionRecords (
          equipmentId, inspectionDate, dueDate, nextDueDate, inspectedBy, reviewedBy,
          inspectionType, inspectionChecklist, result, findings, defectsFound, passed,
          safetyCompliant, operationalCompliant, measurementsTaken, parameters,
          correctiveAction, recommendedAction, followUpRequired, followUpDate,
          attachments, status, severity, duration, notes, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @equipmentId, @inspectionDate, @dueDate, @nextDueDate, @inspectedBy, @reviewedBy,
          @inspectionType, @inspectionChecklist, @result, @findings, @defectsFound, @passed,
          @safetyCompliant, @operationalCompliant, @measurementsTaken, @parameters,
          @correctiveAction, @recommendedAction, @followUpRequired, @followUpDate,
          @attachments, @status, @severity, @duration, @notes, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<InspectionRecord | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM InspectionRecords WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByEquipmentId(equipmentId: number): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT * FROM InspectionRecords WHERE equipmentId = @equipmentId ORDER BY inspectionDate DESC');

    return result.recordset;
  }

  static async findAll(filters?: {
    equipmentId?: number;
    status?: InspectionStatus;
    result?: InspectionResult;
    inspectionType?: string;
    severity?: InspectionSeverity;
    inspectedBy?: number;
  }): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM InspectionRecords WHERE 1=1';

    if (filters?.equipmentId) {
      request.input('equipmentId', sql.Int, filters.equipmentId);
      query += ' AND equipmentId = @equipmentId';
    }
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.result) {
      request.input('result', sql.NVarChar, filters.result);
      query += ' AND result = @result';
    }
    if (filters?.inspectionType) {
      request.input('inspectionType', sql.NVarChar, filters.inspectionType);
      query += ' AND inspectionType = @inspectionType';
    }
    if (filters?.severity) {
      request.input('severity', sql.NVarChar, filters.severity);
      query += ' AND severity = @severity';
    }
    if (filters?.inspectedBy) {
      request.input('inspectedBy', sql.Int, filters.inspectedBy);
      query += ' AND inspectedBy = @inspectedBy';
    }

    query += ' ORDER BY inspectionDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findRequiringFollowUp(): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM InspectionRecords 
        WHERE followUpRequired = 1 
        AND (followUpDate IS NULL OR followUpDate >= GETDATE())
        ORDER BY severity DESC, followUpDate ASC
      `);

    return result.recordset;
  }

  static async findBySeverity(severity: InspectionSeverity): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('severity', sql.NVarChar, severity)
      .query('SELECT * FROM InspectionRecords WHERE severity = @severity ORDER BY inspectionDate DESC');

    return result.recordset;
  }

  static async findFailed(): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM InspectionRecords 
        WHERE passed = 0 
        ORDER BY inspectionDate DESC
      `);

    return result.recordset;
  }

  static async findOverdue(): Promise<InspectionRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM InspectionRecords 
        WHERE status = 'overdue' 
        OR (dueDate IS NOT NULL AND dueDate < GETDATE() AND status NOT IN ('completed', 'cancelled'))
        ORDER BY dueDate ASC
      `);

    return result.recordset;
  }

  static async update(id: number, updates: Partial<InspectionRecord>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        if (['passed', 'safetyCompliant', 'operationalCompliant', 'followUpRequired'].includes(key)) {
          request.input(key, sql.Bit, value);
        } else if (key.includes('Date')) {
          request.input(key, sql.DateTime2, value);
        } else if (['equipmentId', 'inspectedBy', 'reviewedBy', 'duration'].includes(key)) {
          request.input(key, sql.Int, value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE InspectionRecords SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM InspectionRecords WHERE id = @id');
  }
}
