import sql from 'mssql';
import pool from '../config/database';

export interface InspectionPlan {
  id?: number;
  planNumber: string;
  planName: string;
  description?: string;
  equipmentId: number;
  equipmentName?: string;
  equipmentNumber?: string;
  inspectionType: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  planType: 'recurring' | 'one_time';
  frequency?: string;
  frequencyInterval?: number;
  startDate: Date | string;
  endDate?: Date | string;
  nextDueDate: Date | string;
  lastInspectionDate?: Date | string;
  reminderDays?: number;
  responsibleInspectorId: number;
  responsibleInspectorName?: string;
  backupInspectorId?: number;
  backupInspectorName?: string;
  checklistReference?: string;
  inspectionStandard?: string;
  requiredCompetencies?: string;
  estimatedDuration?: number;
  requiredTools?: string;
  status: 'active' | 'inactive' | 'on_hold' | 'completed' | 'cancelled';
  regulatoryRequirement?: boolean;
  complianceReference?: string;
  autoSchedule?: boolean;
  notifyOnOverdue?: boolean;
  escalationDays?: number;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  safetyRelated?: boolean;
  qualityImpact?: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
}

export interface InspectionPlanFilters {
  equipmentId?: number;
  inspectionType?: string;
  status?: string;
  priority?: string;
  responsibleInspectorId?: number;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export class InspectionPlanModel {
  static async create(plan: InspectionPlan): Promise<number> {
    const connection = await pool;
    const result = await connection.request()
      .input('planNumber', sql.NVarChar, plan.planNumber)
      .input('planName', sql.NVarChar, plan.planName)
      .input('description', sql.NVarChar, plan.description)
      .input('equipmentId', sql.Int, plan.equipmentId)
      .input('inspectionType', sql.NVarChar, plan.inspectionType)
      .input('priority', sql.NVarChar, plan.priority)
      .input('planType', sql.NVarChar, plan.planType)
      .input('frequency', sql.NVarChar, plan.frequency)
      .input('frequencyInterval', sql.Int, plan.frequencyInterval)
      .input('startDate', sql.DateTime2, plan.startDate)
      .input('endDate', sql.DateTime2, plan.endDate)
      .input('nextDueDate', sql.DateTime2, plan.nextDueDate)
      .input('lastInspectionDate', sql.DateTime2, plan.lastInspectionDate)
      .input('reminderDays', sql.Int, plan.reminderDays || 7)
      .input('responsibleInspectorId', sql.Int, plan.responsibleInspectorId)
      .input('backupInspectorId', sql.Int, plan.backupInspectorId)
      .input('checklistReference', sql.NVarChar, plan.checklistReference)
      .input('inspectionStandard', sql.NVarChar, plan.inspectionStandard)
      .input('requiredCompetencies', sql.NVarChar, plan.requiredCompetencies)
      .input('estimatedDuration', sql.Int, plan.estimatedDuration)
      .input('requiredTools', sql.NVarChar, plan.requiredTools)
      .input('status', sql.NVarChar, plan.status || 'active')
      .input('regulatoryRequirement', sql.Bit, plan.regulatoryRequirement || false)
      .input('complianceReference', sql.NVarChar, plan.complianceReference)
      .input('autoSchedule', sql.Bit, plan.autoSchedule !== false)
      .input('notifyOnOverdue', sql.Bit, plan.notifyOnOverdue !== false)
      .input('escalationDays', sql.Int, plan.escalationDays || 3)
      .input('criticality', sql.NVarChar, plan.criticality)
      .input('safetyRelated', sql.Bit, plan.safetyRelated || false)
      .input('qualityImpact', sql.NVarChar, plan.qualityImpact)
      .input('notes', sql.NVarChar, plan.notes)
      .input('createdBy', sql.Int, plan.createdBy)
      .query(`
        INSERT INTO InspectionPlans (
          planNumber, planName, description, equipmentId, inspectionType, priority,
          planType, frequency, frequencyInterval, startDate, endDate, nextDueDate,
          lastInspectionDate, reminderDays, responsibleInspectorId, backupInspectorId,
          checklistReference, inspectionStandard, requiredCompetencies, estimatedDuration,
          requiredTools, status, regulatoryRequirement, complianceReference, autoSchedule,
          notifyOnOverdue, escalationDays, criticality, safetyRelated, qualityImpact,
          notes, createdBy, createdAt, updatedAt
        )
        OUTPUT INSERTED.id
        VALUES (
          @planNumber, @planName, @description, @equipmentId, @inspectionType, @priority,
          @planType, @frequency, @frequencyInterval, @startDate, @endDate, @nextDueDate,
          @lastInspectionDate, @reminderDays, @responsibleInspectorId, @backupInspectorId,
          @checklistReference, @inspectionStandard, @requiredCompetencies, @estimatedDuration,
          @requiredTools, @status, @regulatoryRequirement, @complianceReference, @autoSchedule,
          @notifyOnOverdue, @escalationDays, @criticality, @safetyRelated, @qualityImpact,
          @notes, @createdBy, GETDATE(), GETDATE()
        )
      `);
    return result.recordset[0].id;
  }

  static async findAll(filters?: InspectionPlanFilters): Promise<InspectionPlan[]> {
    const connection = await pool;
    let query = `
      SELECT 
        ip.*,
        e.equipmentNumber, e.name as equipmentName,
        u1.username as responsibleInspectorName,
        u2.username as backupInspectorName,
        u3.username as createdByName,
        u4.username as updatedByName
      FROM InspectionPlans ip
      LEFT JOIN Equipment e ON ip.equipmentId = e.id
      LEFT JOIN Users u1 ON ip.responsibleInspectorId = u1.id
      LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
      LEFT JOIN Users u3 ON ip.createdBy = u3.id
      LEFT JOIN Users u4 ON ip.updatedBy = u4.id
      WHERE 1=1
    `;

    const request = connection.request();

    if (filters?.equipmentId) {
      query += ' AND ip.equipmentId = @equipmentId';
      request.input('equipmentId', sql.Int, filters.equipmentId);
    }

    if (filters?.inspectionType) {
      query += ' AND ip.inspectionType = @inspectionType';
      request.input('inspectionType', sql.NVarChar, filters.inspectionType);
    }

    if (filters?.status) {
      query += ' AND ip.status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }

    if (filters?.priority) {
      query += ' AND ip.priority = @priority';
      request.input('priority', sql.NVarChar, filters.priority);
    }

    if (filters?.responsibleInspectorId) {
      query += ' AND ip.responsibleInspectorId = @responsibleInspectorId';
      request.input('responsibleInspectorId', sql.Int, filters.responsibleInspectorId);
    }

    if (filters?.overdue) {
      query += ' AND ip.nextDueDate < GETDATE() AND ip.status = \'active\'';
    }

    if (filters?.dueDateFrom) {
      query += ' AND ip.nextDueDate >= @dueDateFrom';
      request.input('dueDateFrom', sql.DateTime2, filters.dueDateFrom);
    }

    if (filters?.dueDateTo) {
      query += ' AND ip.nextDueDate <= @dueDateTo';
      request.input('dueDateTo', sql.DateTime2, filters.dueDateTo);
    }

    query += ' ORDER BY ip.nextDueDate ASC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findById(id: number): Promise<InspectionPlan | null> {
    const connection = await pool;
    const result = await connection.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          ip.*,
          e.equipmentNumber, e.name as equipmentName,
          u1.username as responsibleInspectorName,
          u2.username as backupInspectorName,
          u3.username as createdByName,
          u4.username as updatedByName
        FROM InspectionPlans ip
        LEFT JOIN Equipment e ON ip.equipmentId = e.id
        LEFT JOIN Users u1 ON ip.responsibleInspectorId = u1.id
        LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
        LEFT JOIN Users u3 ON ip.createdBy = u3.id
        LEFT JOIN Users u4 ON ip.updatedBy = u4.id
        WHERE ip.id = @id
      `);
    return result.recordset[0] || null;
  }

  static async findByPlanNumber(planNumber: string): Promise<InspectionPlan | null> {
    const connection = await pool;
    const result = await connection.request()
      .input('planNumber', sql.NVarChar, planNumber)
      .query(`
        SELECT 
          ip.*,
          e.equipmentNumber, e.name as equipmentName,
          u1.username as responsibleInspectorName,
          u2.username as backupInspectorName
        FROM InspectionPlans ip
        LEFT JOIN Equipment e ON ip.equipmentId = e.id
        LEFT JOIN Users u1 ON ip.responsibleInspectorId = u1.id
        LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
        WHERE ip.planNumber = @planNumber
      `);
    return result.recordset[0] || null;
  }

  static async update(id: number, plan: Partial<InspectionPlan>): Promise<void> {
    const connection = await pool;
    const fields: string[] = [];
    const request = connection.request();

    request.input('id', sql.Int, id);

    if (plan.planNumber !== undefined) {
      fields.push('planNumber = @planNumber');
      request.input('planNumber', sql.NVarChar, plan.planNumber);
    }
    if (plan.planName !== undefined) {
      fields.push('planName = @planName');
      request.input('planName', sql.NVarChar, plan.planName);
    }
    if (plan.description !== undefined) {
      fields.push('description = @description');
      request.input('description', sql.NVarChar, plan.description);
    }
    if (plan.equipmentId !== undefined) {
      fields.push('equipmentId = @equipmentId');
      request.input('equipmentId', sql.Int, plan.equipmentId);
    }
    if (plan.inspectionType !== undefined) {
      fields.push('inspectionType = @inspectionType');
      request.input('inspectionType', sql.NVarChar, plan.inspectionType);
    }
    if (plan.priority !== undefined) {
      fields.push('priority = @priority');
      request.input('priority', sql.NVarChar, plan.priority);
    }
    if (plan.planType !== undefined) {
      fields.push('planType = @planType');
      request.input('planType', sql.NVarChar, plan.planType);
    }
    if (plan.frequency !== undefined) {
      fields.push('frequency = @frequency');
      request.input('frequency', sql.NVarChar, plan.frequency);
    }
    if (plan.frequencyInterval !== undefined) {
      fields.push('frequencyInterval = @frequencyInterval');
      request.input('frequencyInterval', sql.Int, plan.frequencyInterval);
    }
    if (plan.startDate !== undefined) {
      fields.push('startDate = @startDate');
      request.input('startDate', sql.DateTime2, plan.startDate);
    }
    if (plan.endDate !== undefined) {
      fields.push('endDate = @endDate');
      request.input('endDate', sql.DateTime2, plan.endDate);
    }
    if (plan.nextDueDate !== undefined) {
      fields.push('nextDueDate = @nextDueDate');
      request.input('nextDueDate', sql.DateTime2, plan.nextDueDate);
    }
    if (plan.lastInspectionDate !== undefined) {
      fields.push('lastInspectionDate = @lastInspectionDate');
      request.input('lastInspectionDate', sql.DateTime2, plan.lastInspectionDate);
    }
    if (plan.reminderDays !== undefined) {
      fields.push('reminderDays = @reminderDays');
      request.input('reminderDays', sql.Int, plan.reminderDays);
    }
    if (plan.responsibleInspectorId !== undefined) {
      fields.push('responsibleInspectorId = @responsibleInspectorId');
      request.input('responsibleInspectorId', sql.Int, plan.responsibleInspectorId);
    }
    if (plan.backupInspectorId !== undefined) {
      fields.push('backupInspectorId = @backupInspectorId');
      request.input('backupInspectorId', sql.Int, plan.backupInspectorId);
    }
    if (plan.checklistReference !== undefined) {
      fields.push('checklistReference = @checklistReference');
      request.input('checklistReference', sql.NVarChar, plan.checklistReference);
    }
    if (plan.inspectionStandard !== undefined) {
      fields.push('inspectionStandard = @inspectionStandard');
      request.input('inspectionStandard', sql.NVarChar, plan.inspectionStandard);
    }
    if (plan.requiredCompetencies !== undefined) {
      fields.push('requiredCompetencies = @requiredCompetencies');
      request.input('requiredCompetencies', sql.NVarChar, plan.requiredCompetencies);
    }
    if (plan.estimatedDuration !== undefined) {
      fields.push('estimatedDuration = @estimatedDuration');
      request.input('estimatedDuration', sql.Int, plan.estimatedDuration);
    }
    if (plan.requiredTools !== undefined) {
      fields.push('requiredTools = @requiredTools');
      request.input('requiredTools', sql.NVarChar, plan.requiredTools);
    }
    if (plan.status !== undefined) {
      fields.push('status = @status');
      request.input('status', sql.NVarChar, plan.status);
    }
    if (plan.regulatoryRequirement !== undefined) {
      fields.push('regulatoryRequirement = @regulatoryRequirement');
      request.input('regulatoryRequirement', sql.Bit, plan.regulatoryRequirement);
    }
    if (plan.complianceReference !== undefined) {
      fields.push('complianceReference = @complianceReference');
      request.input('complianceReference', sql.NVarChar, plan.complianceReference);
    }
    if (plan.autoSchedule !== undefined) {
      fields.push('autoSchedule = @autoSchedule');
      request.input('autoSchedule', sql.Bit, plan.autoSchedule);
    }
    if (plan.notifyOnOverdue !== undefined) {
      fields.push('notifyOnOverdue = @notifyOnOverdue');
      request.input('notifyOnOverdue', sql.Bit, plan.notifyOnOverdue);
    }
    if (plan.escalationDays !== undefined) {
      fields.push('escalationDays = @escalationDays');
      request.input('escalationDays', sql.Int, plan.escalationDays);
    }
    if (plan.criticality !== undefined) {
      fields.push('criticality = @criticality');
      request.input('criticality', sql.NVarChar, plan.criticality);
    }
    if (plan.safetyRelated !== undefined) {
      fields.push('safetyRelated = @safetyRelated');
      request.input('safetyRelated', sql.Bit, plan.safetyRelated);
    }
    if (plan.qualityImpact !== undefined) {
      fields.push('qualityImpact = @qualityImpact');
      request.input('qualityImpact', sql.NVarChar, plan.qualityImpact);
    }
    if (plan.notes !== undefined) {
      fields.push('notes = @notes');
      request.input('notes', sql.NVarChar, plan.notes);
    }
    if (plan.updatedBy !== undefined) {
      fields.push('updatedBy = @updatedBy');
      request.input('updatedBy', sql.Int, plan.updatedBy);
    }

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      const query = `UPDATE InspectionPlans SET ${fields.join(', ')} WHERE id = @id`;
      await request.query(query);
    }
  }

  static async delete(id: number): Promise<void> {
    const connection = await pool;
    await connection.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM InspectionPlans WHERE id = @id');
  }

  static async getUpcomingInspections(daysAhead: number = 30): Promise<InspectionPlan[]> {
    const connection = await pool;
    const result = await connection.request()
      .input('daysAhead', sql.Int, daysAhead)
      .query(`
        SELECT 
          ip.*,
          e.equipmentNumber, e.name as equipmentName,
          u1.username as responsibleInspectorName,
          u2.username as backupInspectorName
        FROM InspectionPlans ip
        LEFT JOIN Equipment e ON ip.equipmentId = e.id
        LEFT JOIN Users u1 ON ip.responsibleInspectorId = u1.id
        LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
        WHERE ip.status = 'active'
          AND ip.nextDueDate <= DATEADD(day, @daysAhead, GETDATE())
          AND ip.nextDueDate >= GETDATE()
        ORDER BY ip.nextDueDate ASC
      `);
    return result.recordset;
  }

  static async getOverdueInspections(): Promise<InspectionPlan[]> {
    const connection = await pool;
    const result = await connection.request()
      .query(`
        SELECT 
          ip.*,
          e.equipmentNumber, e.name as equipmentName,
          u1.username as responsibleInspectorName,
          u2.username as backupInspectorName,
          DATEDIFF(day, ip.nextDueDate, GETDATE()) as daysOverdue
        FROM InspectionPlans ip
        LEFT JOIN Equipment e ON ip.equipmentId = e.id
        LEFT JOIN Users u1 ON ip.responsibleInspectorId = u1.id
        LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
        WHERE ip.status = 'active'
          AND ip.nextDueDate < GETDATE()
        ORDER BY ip.nextDueDate ASC
      `);
    return result.recordset;
  }

  static async getInspectionsByInspector(inspectorId: number): Promise<InspectionPlan[]> {
    const connection = await pool;
    const result = await connection.request()
      .input('inspectorId', sql.Int, inspectorId)
      .query(`
        SELECT 
          ip.*,
          e.equipmentNumber, e.name as equipmentName,
          u2.username as backupInspectorName
        FROM InspectionPlans ip
        LEFT JOIN Equipment e ON ip.equipmentId = e.id
        LEFT JOIN Users u2 ON ip.backupInspectorId = u2.id
        WHERE (ip.responsibleInspectorId = @inspectorId OR ip.backupInspectorId = @inspectorId)
          AND ip.status = 'active'
        ORDER BY ip.nextDueDate ASC
      `);
    return result.recordset;
  }

  static async getInspectionTypes(): Promise<string[]> {
    const connection = await pool;
    const result = await connection.request()
      .query(`
        SELECT DISTINCT inspectionType
        FROM InspectionPlans
        WHERE inspectionType IS NOT NULL
        ORDER BY inspectionType
      `);
    return result.recordset.map((row) => row.inspectionType);
  }
}
