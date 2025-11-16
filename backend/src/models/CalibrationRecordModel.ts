import { getConnection, sql } from '../config/database';

export interface CalibrationRecord {
  id?: number;
  equipmentId: number;
  calibrationDate: Date;
  dueDate?: Date;
  nextDueDate?: Date;
  performedBy: number;
  approvedBy?: number;
  calibrationType?: string;
  calibrationStandard?: string;
  certificateNumber?: string;
  result: CalibrationResult;
  resultValue?: string;
  toleranceMin?: string;
  toleranceMax?: string;
  passed: boolean;
  findings?: string;
  correctiveAction?: string;
  attachments?: string;
  status: CalibrationStatus;
  externalProvider?: string;
  providerCertification?: string;
  cost?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export enum CalibrationResult {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum CalibrationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export class CalibrationRecordModel {
  static async create(record: CalibrationRecord): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('equipmentId', sql.Int, record.equipmentId)
      .input('calibrationDate', sql.DateTime2, record.calibrationDate)
      .input('dueDate', sql.DateTime2, record.dueDate)
      .input('nextDueDate', sql.DateTime2, record.nextDueDate)
      .input('performedBy', sql.Int, record.performedBy)
      .input('approvedBy', sql.Int, record.approvedBy)
      .input('calibrationType', sql.NVarChar, record.calibrationType)
      .input('calibrationStandard', sql.NVarChar, record.calibrationStandard)
      .input('certificateNumber', sql.NVarChar, record.certificateNumber)
      .input('result', sql.NVarChar, record.result)
      .input('resultValue', sql.NVarChar, record.resultValue)
      .input('toleranceMin', sql.NVarChar, record.toleranceMin)
      .input('toleranceMax', sql.NVarChar, record.toleranceMax)
      .input('passed', sql.Bit, record.passed)
      .input('findings', sql.NVarChar, record.findings)
      .input('correctiveAction', sql.NVarChar, record.correctiveAction)
      .input('attachments', sql.NVarChar, record.attachments)
      .input('status', sql.NVarChar, record.status)
      .input('externalProvider', sql.NVarChar, record.externalProvider)
      .input('providerCertification', sql.NVarChar, record.providerCertification)
      .input('cost', sql.Decimal(10, 2), record.cost)
      .input('createdBy', sql.Int, record.createdBy)
      .query(`
        INSERT INTO CalibrationRecords (
          equipmentId, calibrationDate, dueDate, nextDueDate, performedBy, approvedBy,
          calibrationType, calibrationStandard, certificateNumber, result, resultValue,
          toleranceMin, toleranceMax, passed, findings, correctiveAction, attachments,
          status, externalProvider, providerCertification, cost, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @equipmentId, @calibrationDate, @dueDate, @nextDueDate, @performedBy, @approvedBy,
          @calibrationType, @calibrationStandard, @certificateNumber, @result, @resultValue,
          @toleranceMin, @toleranceMax, @passed, @findings, @correctiveAction, @attachments,
          @status, @externalProvider, @providerCertification, @cost, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<CalibrationRecord | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM CalibrationRecords WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByEquipmentId(equipmentId: number): Promise<CalibrationRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT * FROM CalibrationRecords WHERE equipmentId = @equipmentId ORDER BY calibrationDate DESC');

    return result.recordset;
  }

  static async findByCertificateNumber(certificateNumber: string): Promise<CalibrationRecord | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('certificateNumber', sql.NVarChar, certificateNumber)
      .query('SELECT * FROM CalibrationRecords WHERE certificateNumber = @certificateNumber');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: {
    equipmentId?: number;
    status?: CalibrationStatus;
    result?: CalibrationResult;
    performedBy?: number;
  }): Promise<CalibrationRecord[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM CalibrationRecords WHERE 1=1';

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
    if (filters?.performedBy) {
      request.input('performedBy', sql.Int, filters.performedBy);
      query += ' AND performedBy = @performedBy';
    }

    query += ' ORDER BY calibrationDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findFailed(): Promise<CalibrationRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM CalibrationRecords 
        WHERE passed = 0 
        ORDER BY calibrationDate DESC
      `);

    return result.recordset;
  }

  static async findOverdue(): Promise<CalibrationRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM CalibrationRecords 
        WHERE status = 'overdue' 
        OR (dueDate IS NOT NULL AND dueDate < GETDATE() AND status NOT IN ('completed', 'cancelled'))
        ORDER BY dueDate ASC
      `);

    return result.recordset;
  }

  static async update(id: number, updates: Partial<CalibrationRecord>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        if (key === 'cost') {
          request.input(key, sql.Decimal(10, 2), value);
        } else if (key === 'passed') {
          request.input(key, sql.Bit, value);
        } else if (key.includes('Date')) {
          request.input(key, sql.DateTime2, value);
        } else if (['equipmentId', 'performedBy', 'approvedBy'].includes(key)) {
          request.input(key, sql.Int, value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE CalibrationRecords SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM CalibrationRecords WHERE id = @id');
  }
}
