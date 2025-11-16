import { getConnection, sql } from '../config/database';

export interface ServiceMaintenanceRecord {
  id?: number;
  equipmentId: number;
  serviceDate: Date;
  dueDate?: Date;
  nextDueDate?: Date;
  performedBy: number;
  approvedBy?: number;
  serviceType: ServiceType;
  workOrderNumber?: string;
  priority?: ServicePriority;
  description: string;
  workPerformed?: string;
  hoursSpent?: number;
  partsUsed?: string;
  partsReplaced?: string;
  materialsCost?: number;
  laborCost?: number;
  totalCost?: number;
  externalProvider?: string;
  providerContact?: string;
  invoiceNumber?: string;
  outcome: ServiceOutcome;
  equipmentCondition?: EquipmentCondition;
  issuesResolved?: boolean;
  problemsIdentified?: string;
  rootCause?: string;
  preventiveActions?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  recommendations?: string;
  functionalTestPerformed?: boolean;
  testResults?: string;
  downtimeStart?: Date;
  downtimeEnd?: Date;
  downtimeHours?: number;
  attachments?: string;
  status: ServiceStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export enum ServiceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
  EMERGENCY = 'emergency',
  BREAKDOWN = 'breakdown',
  ROUTINE = 'routine',
  UPGRADE = 'upgrade',
  INSTALLATION = 'installation',
  DECOMMISSION = 'decommission',
}

export enum ServicePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum ServiceOutcome {
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled',
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  FAILED = 'failed',
}

export enum ServiceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export class ServiceMaintenanceRecordModel {
  static async create(record: ServiceMaintenanceRecord): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('equipmentId', sql.Int, record.equipmentId)
      .input('serviceDate', sql.DateTime2, record.serviceDate)
      .input('dueDate', sql.DateTime2, record.dueDate)
      .input('nextDueDate', sql.DateTime2, record.nextDueDate)
      .input('performedBy', sql.Int, record.performedBy)
      .input('approvedBy', sql.Int, record.approvedBy)
      .input('serviceType', sql.NVarChar, record.serviceType)
      .input('workOrderNumber', sql.NVarChar, record.workOrderNumber)
      .input('priority', sql.NVarChar, record.priority)
      .input('description', sql.NVarChar, record.description)
      .input('workPerformed', sql.NVarChar, record.workPerformed)
      .input('hoursSpent', sql.Decimal(6, 2), record.hoursSpent)
      .input('partsUsed', sql.NVarChar, record.partsUsed)
      .input('partsReplaced', sql.NVarChar, record.partsReplaced)
      .input('materialsCost', sql.Decimal(10, 2), record.materialsCost)
      .input('laborCost', sql.Decimal(10, 2), record.laborCost)
      .input('totalCost', sql.Decimal(10, 2), record.totalCost)
      .input('externalProvider', sql.NVarChar, record.externalProvider)
      .input('providerContact', sql.NVarChar, record.providerContact)
      .input('invoiceNumber', sql.NVarChar, record.invoiceNumber)
      .input('outcome', sql.NVarChar, record.outcome)
      .input('equipmentCondition', sql.NVarChar, record.equipmentCondition)
      .input('issuesResolved', sql.Bit, record.issuesResolved ?? true)
      .input('problemsIdentified', sql.NVarChar, record.problemsIdentified)
      .input('rootCause', sql.NVarChar, record.rootCause)
      .input('preventiveActions', sql.NVarChar, record.preventiveActions)
      .input('followUpRequired', sql.Bit, record.followUpRequired ?? false)
      .input('followUpDate', sql.DateTime2, record.followUpDate)
      .input('recommendations', sql.NVarChar, record.recommendations)
      .input('functionalTestPerformed', sql.Bit, record.functionalTestPerformed ?? false)
      .input('testResults', sql.NVarChar, record.testResults)
      .input('downtimeStart', sql.DateTime2, record.downtimeStart)
      .input('downtimeEnd', sql.DateTime2, record.downtimeEnd)
      .input('downtimeHours', sql.Decimal(6, 2), record.downtimeHours)
      .input('attachments', sql.NVarChar, record.attachments)
      .input('status', sql.NVarChar, record.status)
      .input('notes', sql.NVarChar, record.notes)
      .input('createdBy', sql.Int, record.createdBy)
      .query(`
        INSERT INTO ServiceMaintenanceRecords (
          equipmentId, serviceDate, dueDate, nextDueDate, performedBy, approvedBy,
          serviceType, workOrderNumber, priority, description, workPerformed, hoursSpent,
          partsUsed, partsReplaced, materialsCost, laborCost, totalCost,
          externalProvider, providerContact, invoiceNumber, outcome, equipmentCondition,
          issuesResolved, problemsIdentified, rootCause, preventiveActions,
          followUpRequired, followUpDate, recommendations, functionalTestPerformed,
          testResults, downtimeStart, downtimeEnd, downtimeHours, attachments,
          status, notes, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @equipmentId, @serviceDate, @dueDate, @nextDueDate, @performedBy, @approvedBy,
          @serviceType, @workOrderNumber, @priority, @description, @workPerformed, @hoursSpent,
          @partsUsed, @partsReplaced, @materialsCost, @laborCost, @totalCost,
          @externalProvider, @providerContact, @invoiceNumber, @outcome, @equipmentCondition,
          @issuesResolved, @problemsIdentified, @rootCause, @preventiveActions,
          @followUpRequired, @followUpDate, @recommendations, @functionalTestPerformed,
          @testResults, @downtimeStart, @downtimeEnd, @downtimeHours, @attachments,
          @status, @notes, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<ServiceMaintenanceRecord | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ServiceMaintenanceRecords WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByEquipmentId(equipmentId: number): Promise<ServiceMaintenanceRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('equipmentId', sql.Int, equipmentId)
      .query('SELECT * FROM ServiceMaintenanceRecords WHERE equipmentId = @equipmentId ORDER BY serviceDate DESC');

    return result.recordset;
  }

  static async findByWorkOrderNumber(workOrderNumber: string): Promise<ServiceMaintenanceRecord | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('workOrderNumber', sql.NVarChar, workOrderNumber)
      .query('SELECT * FROM ServiceMaintenanceRecords WHERE workOrderNumber = @workOrderNumber');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: {
    equipmentId?: number;
    status?: ServiceStatus;
    serviceType?: ServiceType;
    priority?: ServicePriority;
    outcome?: ServiceOutcome;
    performedBy?: number;
  }): Promise<ServiceMaintenanceRecord[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM ServiceMaintenanceRecords WHERE 1=1';

    if (filters?.equipmentId) {
      request.input('equipmentId', sql.Int, filters.equipmentId);
      query += ' AND equipmentId = @equipmentId';
    }
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.serviceType) {
      request.input('serviceType', sql.NVarChar, filters.serviceType);
      query += ' AND serviceType = @serviceType';
    }
    if (filters?.priority) {
      request.input('priority', sql.NVarChar, filters.priority);
      query += ' AND priority = @priority';
    }
    if (filters?.outcome) {
      request.input('outcome', sql.NVarChar, filters.outcome);
      query += ' AND outcome = @outcome';
    }
    if (filters?.performedBy) {
      request.input('performedBy', sql.Int, filters.performedBy);
      query += ' AND performedBy = @performedBy';
    }

    query += ' ORDER BY serviceDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findUnresolvedIssues(): Promise<ServiceMaintenanceRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM ServiceMaintenanceRecords 
        WHERE issuesResolved = 0 OR followUpRequired = 1
        ORDER BY followUpDate ASC, serviceDate DESC
      `);

    return result.recordset;
  }

  static async findByServiceType(serviceType: ServiceType): Promise<ServiceMaintenanceRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('serviceType', sql.NVarChar, serviceType)
      .query('SELECT * FROM ServiceMaintenanceRecords WHERE serviceType = @serviceType ORDER BY serviceDate DESC');

    return result.recordset;
  }

  static async findOverdue(): Promise<ServiceMaintenanceRecord[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM ServiceMaintenanceRecords 
        WHERE status = 'overdue' 
        OR (dueDate IS NOT NULL AND dueDate < GETDATE() AND status NOT IN ('completed', 'cancelled'))
        ORDER BY dueDate ASC
      `);

    return result.recordset;
  }

  static async getTotalCostByEquipment(equipmentId: number, startDate?: Date, endDate?: Date): Promise<number> {
    const pool = await getConnection();
    const request = pool.request().input('equipmentId', sql.Int, equipmentId);

    let query = `
      SELECT ISNULL(SUM(totalCost), 0) as totalCost
      FROM ServiceMaintenanceRecords 
      WHERE equipmentId = @equipmentId 
      AND status = 'completed'
    `;

    if (startDate) {
      request.input('startDate', sql.DateTime2, startDate);
      query += ' AND serviceDate >= @startDate';
    }
    if (endDate) {
      request.input('endDate', sql.DateTime2, endDate);
      query += ' AND serviceDate <= @endDate';
    }

    const result = await request.query(query);
    return result.recordset[0].totalCost;
  }

  static async update(id: number, updates: Partial<ServiceMaintenanceRecord>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        if (['issuesResolved', 'followUpRequired', 'functionalTestPerformed'].includes(key)) {
          request.input(key, sql.Bit, value);
        } else if (['materialsCost', 'laborCost', 'totalCost', 'hoursSpent', 'downtimeHours'].includes(key)) {
          if (key === 'hoursSpent' || key === 'downtimeHours') {
            request.input(key, sql.Decimal(6, 2), value);
          } else {
            request.input(key, sql.Decimal(10, 2), value);
          }
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
      await request.query(`UPDATE ServiceMaintenanceRecords SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM ServiceMaintenanceRecords WHERE id = @id');
  }
}
