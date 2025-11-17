import { getConnection, sql } from '../config/database';

export interface AcceptanceCriteria {
  id?: number;
  criteriaCode: string;
  criteriaName: string;
  description?: string;
  inspectionType: string;
  equipmentCategory?: string;
  parameterName: string;
  unit?: string;
  measurementType: MeasurementType;
  ruleType: RuleType;
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  tolerancePlus?: number;
  toleranceMinus?: number;
  acceptableValues?: string;
  unacceptableValues?: string;
  severity: CriteriaSeverity;
  mandatory: boolean;
  safetyRelated?: boolean;
  regulatoryRequirement?: boolean;
  failureAction: FailureAction;
  allowOverride?: boolean;
  overrideAuthorizationLevel?: string;
  standardReference?: string;
  procedureReference?: string;
  status: CriteriaStatus;
  effectiveDate: Date;
  expiryDate?: Date;
  version: string;
  supersedes?: number;
  inspectionMethod?: string;
  requiredEquipment?: string;
  frequency?: string;
  sampleSize?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
  updatedBy?: number;
}

export enum MeasurementType {
  QUANTITATIVE = 'quantitative',
  QUALITATIVE = 'qualitative',
  BINARY = 'binary',
  RANGE = 'range',
  CHECKLIST = 'checklist',
}

export enum RuleType {
  RANGE = 'range',
  MIN = 'min',
  MAX = 'max',
  EXACT = 'exact',
  TOLERANCE = 'tolerance',
  CHECKLIST = 'checklist',
  PASS_FAIL = 'pass_fail',
}

export enum CriteriaSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  NORMAL = 'normal',
}

export enum FailureAction {
  FAIL_INSPECTION = 'fail_inspection',
  FLAG_FOR_REVIEW = 'flag_for_review',
  WARNING_ONLY = 'warning_only',
  CONDITIONAL_PASS = 'conditional_pass',
}

export enum CriteriaStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  OBSOLETE = 'obsolete',
}

export class AcceptanceCriteriaModel {
  static async create(criteria: AcceptanceCriteria): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('criteriaCode', sql.NVarChar, criteria.criteriaCode)
      .input('criteriaName', sql.NVarChar, criteria.criteriaName)
      .input('description', sql.NVarChar, criteria.description)
      .input('inspectionType', sql.NVarChar, criteria.inspectionType)
      .input('equipmentCategory', sql.NVarChar, criteria.equipmentCategory)
      .input('parameterName', sql.NVarChar, criteria.parameterName)
      .input('unit', sql.NVarChar, criteria.unit)
      .input('measurementType', sql.NVarChar, criteria.measurementType)
      .input('ruleType', sql.NVarChar, criteria.ruleType)
      .input('targetValue', sql.Decimal(18, 6), criteria.targetValue)
      .input('minValue', sql.Decimal(18, 6), criteria.minValue)
      .input('maxValue', sql.Decimal(18, 6), criteria.maxValue)
      .input('tolerancePlus', sql.Decimal(18, 6), criteria.tolerancePlus)
      .input('toleranceMinus', sql.Decimal(18, 6), criteria.toleranceMinus)
      .input('acceptableValues', sql.NVarChar, criteria.acceptableValues)
      .input('unacceptableValues', sql.NVarChar, criteria.unacceptableValues)
      .input('severity', sql.NVarChar, criteria.severity)
      .input('mandatory', sql.Bit, criteria.mandatory)
      .input('safetyRelated', sql.Bit, criteria.safetyRelated ?? false)
      .input('regulatoryRequirement', sql.Bit, criteria.regulatoryRequirement ?? false)
      .input('failureAction', sql.NVarChar, criteria.failureAction)
      .input('allowOverride', sql.Bit, criteria.allowOverride ?? false)
      .input('overrideAuthorizationLevel', sql.NVarChar, criteria.overrideAuthorizationLevel)
      .input('standardReference', sql.NVarChar, criteria.standardReference)
      .input('procedureReference', sql.NVarChar, criteria.procedureReference)
      .input('status', sql.NVarChar, criteria.status)
      .input('effectiveDate', sql.DateTime2, criteria.effectiveDate)
      .input('expiryDate', sql.DateTime2, criteria.expiryDate)
      .input('version', sql.NVarChar, criteria.version)
      .input('supersedes', sql.Int, criteria.supersedes)
      .input('inspectionMethod', sql.NVarChar, criteria.inspectionMethod)
      .input('requiredEquipment', sql.NVarChar, criteria.requiredEquipment)
      .input('frequency', sql.NVarChar, criteria.frequency)
      .input('sampleSize', sql.Int, criteria.sampleSize)
      .input('notes', sql.NVarChar, criteria.notes)
      .input('createdBy', sql.Int, criteria.createdBy)
      .query(`
        INSERT INTO AcceptanceCriteria (
          criteriaCode, criteriaName, description, inspectionType, equipmentCategory,
          parameterName, unit, measurementType, ruleType, targetValue,
          minValue, maxValue, tolerancePlus, toleranceMinus, acceptableValues,
          unacceptableValues, severity, mandatory, safetyRelated, regulatoryRequirement,
          failureAction, allowOverride, overrideAuthorizationLevel, standardReference, procedureReference,
          status, effectiveDate, expiryDate, version, supersedes,
          inspectionMethod, requiredEquipment, frequency, sampleSize, notes, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @criteriaCode, @criteriaName, @description, @inspectionType, @equipmentCategory,
          @parameterName, @unit, @measurementType, @ruleType, @targetValue,
          @minValue, @maxValue, @tolerancePlus, @toleranceMinus, @acceptableValues,
          @unacceptableValues, @severity, @mandatory, @safetyRelated, @regulatoryRequirement,
          @failureAction, @allowOverride, @overrideAuthorizationLevel, @standardReference, @procedureReference,
          @status, @effectiveDate, @expiryDate, @version, @supersedes,
          @inspectionMethod, @requiredEquipment, @frequency, @sampleSize, @notes, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<AcceptanceCriteria | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM AcceptanceCriteria WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByCriteriaCode(criteriaCode: string): Promise<AcceptanceCriteria | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('criteriaCode', sql.NVarChar, criteriaCode)
      .query('SELECT * FROM AcceptanceCriteria WHERE criteriaCode = @criteriaCode');

    return result.recordset[0] || null;
  }

  static async findByInspectionType(inspectionType: string): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('inspectionType', sql.NVarChar, inspectionType)
      .query(`
        SELECT * FROM AcceptanceCriteria 
        WHERE inspectionType = @inspectionType 
        AND status = 'active'
        AND (expiryDate IS NULL OR expiryDate > GETDATE())
        AND effectiveDate <= GETDATE()
        ORDER BY mandatory DESC, severity ASC, parameterName ASC
      `);

    return result.recordset;
  }

  static async findAll(filters?: {
    inspectionType?: string;
    equipmentCategory?: string;
    status?: CriteriaStatus;
    severity?: CriteriaSeverity;
    mandatory?: boolean;
    safetyRelated?: boolean;
    regulatoryRequirement?: boolean;
    measurementType?: MeasurementType;
  }): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM AcceptanceCriteria WHERE 1=1';

    if (filters?.inspectionType) {
      request.input('inspectionType', sql.NVarChar, filters.inspectionType);
      query += ' AND inspectionType = @inspectionType';
    }
    if (filters?.equipmentCategory) {
      request.input('equipmentCategory', sql.NVarChar, filters.equipmentCategory);
      query += ' AND equipmentCategory = @equipmentCategory';
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
    if (filters?.safetyRelated !== undefined) {
      request.input('safetyRelated', sql.Bit, filters.safetyRelated);
      query += ' AND safetyRelated = @safetyRelated';
    }
    if (filters?.regulatoryRequirement !== undefined) {
      request.input('regulatoryRequirement', sql.Bit, filters.regulatoryRequirement);
      query += ' AND regulatoryRequirement = @regulatoryRequirement';
    }
    if (filters?.measurementType) {
      request.input('measurementType', sql.NVarChar, filters.measurementType);
      query += ' AND measurementType = @measurementType';
    }

    query += ' ORDER BY inspectionType, mandatory DESC, severity ASC, parameterName ASC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findActive(): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM AcceptanceCriteria 
        WHERE status = 'active'
        AND (expiryDate IS NULL OR expiryDate > GETDATE())
        AND effectiveDate <= GETDATE()
        ORDER BY inspectionType, mandatory DESC, severity ASC
      `);

    return result.recordset;
  }

  static async findBySeverity(severity: CriteriaSeverity): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('severity', sql.NVarChar, severity)
      .query(`
        SELECT * FROM AcceptanceCriteria 
        WHERE severity = @severity 
        AND status = 'active'
        ORDER BY inspectionType, parameterName
      `);

    return result.recordset;
  }

  static async findMandatory(): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM AcceptanceCriteria 
        WHERE mandatory = 1 
        AND status = 'active'
        ORDER BY severity ASC, inspectionType
      `);

    return result.recordset;
  }

  static async findSafetyRelated(): Promise<AcceptanceCriteria[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM AcceptanceCriteria 
        WHERE safetyRelated = 1 
        AND status = 'active'
        ORDER BY severity ASC, inspectionType
      `);

    return result.recordset;
  }

  static async update(id: number, updates: Partial<AcceptanceCriteria>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        if (['mandatory', 'safetyRelated', 'regulatoryRequirement', 'allowOverride'].includes(key)) {
          request.input(key, sql.Bit, value);
        } else if (key.includes('Date')) {
          request.input(key, sql.DateTime2, value);
        } else if (['targetValue', 'minValue', 'maxValue', 'tolerancePlus', 'toleranceMinus'].includes(key)) {
          request.input(key, sql.Decimal(18, 6), value);
        } else if (['createdBy', 'updatedBy', 'supersedes', 'sampleSize'].includes(key)) {
          request.input(key, sql.Int, value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE AcceptanceCriteria SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM AcceptanceCriteria WHERE id = @id');
  }

  static async validateMeasurement(
    criteriaId: number,
    measuredValue: number | string | boolean
  ): Promise<{ passed: boolean; message: string }> {
    const criteria = await this.findById(criteriaId);
    if (!criteria) {
      return { passed: false, message: 'Criteria not found' };
    }

    // Check if criteria is active and effective
    const now = new Date();
    if (criteria.status !== CriteriaStatus.ACTIVE) {
      return { passed: false, message: 'Criteria is not active' };
    }
    if (criteria.effectiveDate > now) {
      return { passed: false, message: 'Criteria is not yet effective' };
    }
    if (criteria.expiryDate && criteria.expiryDate < now) {
      return { passed: false, message: 'Criteria has expired' };
    }

    // Perform validation based on rule type
    switch (criteria.ruleType) {
      case RuleType.RANGE:
        if (typeof measuredValue === 'number') {
          if (criteria.minValue !== undefined && criteria.maxValue !== undefined) {
            const passed = measuredValue >= criteria.minValue && measuredValue <= criteria.maxValue;
            return {
              passed,
              message: passed
                ? `Value ${measuredValue} is within range [${criteria.minValue}, ${criteria.maxValue}]`
                : `Value ${measuredValue} is outside range [${criteria.minValue}, ${criteria.maxValue}]`,
            };
          }
        }
        return { passed: false, message: 'Invalid value type or missing range bounds' };

      case RuleType.MIN:
        if (typeof measuredValue === 'number' && criteria.minValue !== undefined) {
          const passed = measuredValue >= criteria.minValue;
          return {
            passed,
            message: passed
              ? `Value ${measuredValue} meets minimum ${criteria.minValue}`
              : `Value ${measuredValue} is below minimum ${criteria.minValue}`,
          };
        }
        return { passed: false, message: 'Invalid value type or missing minimum bound' };

      case RuleType.MAX:
        if (typeof measuredValue === 'number' && criteria.maxValue !== undefined) {
          const passed = measuredValue <= criteria.maxValue;
          return {
            passed,
            message: passed
              ? `Value ${measuredValue} meets maximum ${criteria.maxValue}`
              : `Value ${measuredValue} exceeds maximum ${criteria.maxValue}`,
          };
        }
        return { passed: false, message: 'Invalid value type or missing maximum bound' };

      case RuleType.TOLERANCE:
        if (typeof measuredValue === 'number' && criteria.targetValue !== undefined) {
          const plusTol = criteria.tolerancePlus ?? 0;
          const minusTol = criteria.toleranceMinus ?? 0;
          const minAllowed = criteria.targetValue - minusTol;
          const maxAllowed = criteria.targetValue + plusTol;
          const passed = measuredValue >= minAllowed && measuredValue <= maxAllowed;
          return {
            passed,
            message: passed
              ? `Value ${measuredValue} is within tolerance of target ${criteria.targetValue}`
              : `Value ${measuredValue} is outside tolerance range [${minAllowed}, ${maxAllowed}]`,
          };
        }
        return { passed: false, message: 'Invalid value type or missing target/tolerance values' };

      case RuleType.EXACT:
        if (criteria.targetValue !== undefined) {
          const passed = measuredValue === criteria.targetValue;
          return {
            passed,
            message: passed
              ? `Value ${measuredValue} matches target ${criteria.targetValue}`
              : `Value ${measuredValue} does not match target ${criteria.targetValue}`,
          };
        }
        return { passed: false, message: 'Missing target value for exact match' };

      case RuleType.PASS_FAIL:
        if (typeof measuredValue === 'boolean') {
          return {
            passed: measuredValue,
            message: measuredValue ? 'Criteria passed' : 'Criteria failed',
          };
        }
        if (typeof measuredValue === 'string') {
          const passed = measuredValue.toLowerCase() === 'pass' || measuredValue.toLowerCase() === 'true';
          return {
            passed,
            message: passed ? 'Criteria passed' : 'Criteria failed',
          };
        }
        return { passed: false, message: 'Invalid value type for pass/fail criteria' };

      default:
        return { passed: false, message: 'Unsupported rule type' };
    }
  }
}
