import { getConnection, sql } from '../config/database';

export interface InspectionItem {
  id?: number;
  inspectionRecordId: number;
  acceptanceCriteriaId: number;
  measuredValue?: string;
  measurementUnit?: string;
  passed: boolean;
  autoScored: boolean;
  validationMessage?: string;
  overridden?: boolean;
  overrideReason?: string;
  overriddenBy?: number;
  overriddenAt?: Date;
  status: InspectionItemStatus;
  severity?: string;
  mandatory?: boolean;
  notes?: string;
  photoAttachments?: string;
  itemOrder?: number;
  sectionName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}

export enum InspectionItemStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  NOT_APPLICABLE = 'not_applicable',
}

export interface InspectionItemWithCriteria extends InspectionItem {
  criteriaCode?: string;
  criteriaName?: string;
  parameterName?: string;
  ruleType?: string;
  failureAction?: string;
}

export class InspectionItemModel {
  static async create(item: InspectionItem): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, item.inspectionRecordId)
      .input('acceptanceCriteriaId', sql.Int, item.acceptanceCriteriaId)
      .input('measuredValue', sql.NVarChar, item.measuredValue)
      .input('measurementUnit', sql.NVarChar, item.measurementUnit)
      .input('passed', sql.Bit, item.passed)
      .input('autoScored', sql.Bit, item.autoScored)
      .input('validationMessage', sql.NVarChar, item.validationMessage)
      .input('overridden', sql.Bit, item.overridden ?? false)
      .input('overrideReason', sql.NVarChar, item.overrideReason)
      .input('overriddenBy', sql.Int, item.overriddenBy)
      .input('overriddenAt', sql.DateTime2, item.overriddenAt)
      .input('status', sql.NVarChar, item.status)
      .input('severity', sql.NVarChar, item.severity)
      .input('mandatory', sql.Bit, item.mandatory)
      .input('notes', sql.NVarChar, item.notes)
      .input('photoAttachments', sql.NVarChar, item.photoAttachments)
      .input('itemOrder', sql.Int, item.itemOrder)
      .input('sectionName', sql.NVarChar, item.sectionName)
      .input('createdBy', sql.Int, item.createdBy)
      .query(`
        INSERT INTO InspectionItems (
          inspectionRecordId, acceptanceCriteriaId, measuredValue, measurementUnit,
          passed, autoScored, validationMessage, overridden, overrideReason,
          overriddenBy, overriddenAt, status, severity, mandatory, notes,
          photoAttachments, itemOrder, sectionName, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @inspectionRecordId, @acceptanceCriteriaId, @measuredValue, @measurementUnit,
          @passed, @autoScored, @validationMessage, @overridden, @overrideReason,
          @overriddenBy, @overriddenAt, @status, @severity, @mandatory, @notes,
          @photoAttachments, @itemOrder, @sectionName, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<InspectionItem | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM InspectionItems WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByInspectionRecordId(inspectionRecordId: number): Promise<InspectionItem[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query(`
        SELECT * FROM InspectionItems 
        WHERE inspectionRecordId = @inspectionRecordId 
        ORDER BY itemOrder ASC, id ASC
      `);

    return result.recordset;
  }

  static async findByInspectionRecordIdWithCriteria(
    inspectionRecordId: number
  ): Promise<InspectionItemWithCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query(`
        SELECT 
          ii.*,
          ac.criteriaCode,
          ac.criteriaName,
          ac.parameterName,
          ac.ruleType,
          ac.failureAction
        FROM InspectionItems ii
        INNER JOIN AcceptanceCriteria ac ON ii.acceptanceCriteriaId = ac.id
        WHERE ii.inspectionRecordId = @inspectionRecordId 
        ORDER BY ii.itemOrder ASC, ii.id ASC
      `);

    return result.recordset;
  }

  static async findFailedItems(inspectionRecordId: number): Promise<InspectionItem[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query(`
        SELECT * FROM InspectionItems 
        WHERE inspectionRecordId = @inspectionRecordId 
        AND passed = 0 
        AND status = 'completed'
        ORDER BY severity DESC, itemOrder ASC
      `);

    return result.recordset;
  }

  static async findMandatoryFailedItems(inspectionRecordId: number): Promise<InspectionItem[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query(`
        SELECT * FROM InspectionItems 
        WHERE inspectionRecordId = @inspectionRecordId 
        AND passed = 0 
        AND mandatory = 1
        AND status = 'completed'
        ORDER BY severity DESC, itemOrder ASC
      `);

    return result.recordset;
  }

  static async findAll(filters?: {
    inspectionRecordId?: number;
    acceptanceCriteriaId?: number;
    passed?: boolean;
    status?: InspectionItemStatus;
    severity?: string;
    mandatory?: boolean;
    autoScored?: boolean;
    overridden?: boolean;
  }): Promise<InspectionItem[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM InspectionItems WHERE 1=1';

    if (filters?.inspectionRecordId !== undefined) {
      request.input('inspectionRecordId', sql.Int, filters.inspectionRecordId);
      query += ' AND inspectionRecordId = @inspectionRecordId';
    }
    if (filters?.acceptanceCriteriaId !== undefined) {
      request.input('acceptanceCriteriaId', sql.Int, filters.acceptanceCriteriaId);
      query += ' AND acceptanceCriteriaId = @acceptanceCriteriaId';
    }
    if (filters?.passed !== undefined) {
      request.input('passed', sql.Bit, filters.passed);
      query += ' AND passed = @passed';
    }
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.severity) {
      request.input('severity', sql.NVarChar, filters.severity);
      query += ' AND severity = @severity';
    }
    if (filters?.mandatory !== undefined) {
      request.input('mandatory', sql.Bit, filters.mandatory);
      query += ' AND mandatory = @mandatory';
    }
    if (filters?.autoScored !== undefined) {
      request.input('autoScored', sql.Bit, filters.autoScored);
      query += ' AND autoScored = @autoScored';
    }
    if (filters?.overridden !== undefined) {
      request.input('overridden', sql.Bit, filters.overridden);
      query += ' AND overridden = @overridden';
    }

    query += ' ORDER BY inspectionRecordId DESC, itemOrder ASC, id ASC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<InspectionItem>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value !== undefined &&
        key !== 'id' &&
        key !== 'createdAt' &&
        key !== 'createdBy' &&
        key !== 'inspectionRecordId' &&
        key !== 'acceptanceCriteriaId'
      ) {
        if (['passed', 'autoScored', 'overridden', 'mandatory'].includes(key)) {
          request.input(key, sql.Bit, value);
        } else if (key === 'overriddenAt') {
          request.input(key, sql.DateTime2, value);
        } else if (['overriddenBy', 'itemOrder', 'updatedBy'].includes(key)) {
          request.input(key, sql.Int, value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE InspectionItems SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM InspectionItems WHERE id = @id');
  }

  static async deleteByInspectionRecordId(inspectionRecordId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query('DELETE FROM InspectionItems WHERE inspectionRecordId = @inspectionRecordId');
  }

  /**
   * Calculate statistics for an inspection record based on its items
   */
  static async getInspectionStatistics(inspectionRecordId: number): Promise<{
    totalItems: number;
    completedItems: number;
    passedItems: number;
    failedItems: number;
    mandatoryFailedItems: number;
    criticalFailedItems: number;
    majorFailedItems: number;
    minorFailedItems: number;
    pendingItems: number;
    autoScoredItems: number;
    overriddenItems: number;
  }> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionRecordId', sql.Int, inspectionRecordId)
      .query(`
        SELECT 
          COUNT(*) as totalItems,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedItems,
          SUM(CASE WHEN passed = 1 AND status = 'completed' THEN 1 ELSE 0 END) as passedItems,
          SUM(CASE WHEN passed = 0 AND status = 'completed' THEN 1 ELSE 0 END) as failedItems,
          SUM(CASE WHEN passed = 0 AND mandatory = 1 AND status = 'completed' THEN 1 ELSE 0 END) as mandatoryFailedItems,
          SUM(CASE WHEN passed = 0 AND severity = 'critical' AND status = 'completed' THEN 1 ELSE 0 END) as criticalFailedItems,
          SUM(CASE WHEN passed = 0 AND severity = 'major' AND status = 'completed' THEN 1 ELSE 0 END) as majorFailedItems,
          SUM(CASE WHEN passed = 0 AND severity = 'minor' AND status = 'completed' THEN 1 ELSE 0 END) as minorFailedItems,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingItems,
          SUM(CASE WHEN autoScored = 1 THEN 1 ELSE 0 END) as autoScoredItems,
          SUM(CASE WHEN overridden = 1 THEN 1 ELSE 0 END) as overriddenItems
        FROM InspectionItems 
        WHERE inspectionRecordId = @inspectionRecordId
      `);

    return result.recordset[0] || {
      totalItems: 0,
      completedItems: 0,
      passedItems: 0,
      failedItems: 0,
      mandatoryFailedItems: 0,
      criticalFailedItems: 0,
      majorFailedItems: 0,
      minorFailedItems: 0,
      pendingItems: 0,
      autoScoredItems: 0,
      overriddenItems: 0,
    };
  }
}
