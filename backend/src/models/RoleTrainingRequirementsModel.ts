import { getConnection, sql } from '../config/database';

export interface RoleTrainingRequirement {
  id?: number;
  roleId: number;
  competencyId: number;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
  gracePeriodDays?: number;
  complianceDeadline?: Date;
  minimumProficiencyLevel?: string;
  refreshFrequencyMonths?: number;
  status: 'active' | 'inactive' | 'deprecated';
  effectiveDate?: Date;
  endDate?: Date;
  justification?: string;
  regulatoryReference?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
}

export interface RoleTrainingRequirementWithDetails extends RoleTrainingRequirement {
  roleName?: string;
  roleDisplayName?: string;
  competencyCode?: string;
  competencyName?: string;
  competencyCategory?: string;
  competencyHasExpiry?: boolean;
  competencyDefaultValidityMonths?: number;
}

export interface MissingCompetency {
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleName: string;
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: string;
  gracePeriodDays?: number;
  complianceDeadline?: Date;
  status: 'missing' | 'expired' | 'expiring_soon';
  daysUntilExpiry?: number;
}

export class RoleTrainingRequirementsModel {
  /**
   * Create a new role training requirement
   */
  static async create(requirement: RoleTrainingRequirement): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('roleId', sql.Int, requirement.roleId)
      .input('competencyId', sql.Int, requirement.competencyId)
      .input('isMandatory', sql.Bit, requirement.isMandatory)
      .input('isRegulatory', sql.Bit, requirement.isRegulatory)
      .input('priority', sql.NVarChar, requirement.priority)
      .input('gracePeriodDays', sql.Int, requirement.gracePeriodDays)
      .input('complianceDeadline', sql.DateTime2, requirement.complianceDeadline)
      .input('minimumProficiencyLevel', sql.NVarChar, requirement.minimumProficiencyLevel)
      .input('refreshFrequencyMonths', sql.Int, requirement.refreshFrequencyMonths)
      .input('status', sql.NVarChar, requirement.status)
      .input('effectiveDate', sql.DateTime2, requirement.effectiveDate)
      .input('endDate', sql.DateTime2, requirement.endDate)
      .input('justification', sql.NVarChar, requirement.justification)
      .input('regulatoryReference', sql.NVarChar, requirement.regulatoryReference)
      .input('notes', sql.NVarChar, requirement.notes)
      .input('createdBy', sql.Int, requirement.createdBy)
      .query(`
        INSERT INTO RoleTrainingRequirements (
          roleId, competencyId, isMandatory, isRegulatory, priority,
          gracePeriodDays, complianceDeadline, minimumProficiencyLevel, refreshFrequencyMonths,
          status, effectiveDate, endDate, justification, regulatoryReference, notes, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @roleId, @competencyId, @isMandatory, @isRegulatory, @priority,
          @gracePeriodDays, @complianceDeadline, @minimumProficiencyLevel, @refreshFrequencyMonths,
          @status, @effectiveDate, @endDate, @justification, @regulatoryReference, @notes, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Find requirement by ID
   */
  static async findById(id: number): Promise<RoleTrainingRequirementWithDetails | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          rtr.*,
          r.name as roleName,
          r.displayName as roleDisplayName,
          c.competencyCode,
          c.name as competencyName,
          c.category as competencyCategory,
          c.hasExpiry as competencyHasExpiry,
          c.defaultValidityMonths as competencyDefaultValidityMonths
        FROM RoleTrainingRequirements rtr
        INNER JOIN Roles r ON rtr.roleId = r.id
        INNER JOIN Competencies c ON rtr.competencyId = c.id
        WHERE rtr.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Find all requirements with optional filters
   */
  static async findAll(filters?: {
    roleId?: number;
    competencyId?: number;
    status?: string;
    isMandatory?: boolean;
    isRegulatory?: boolean;
    priority?: string;
  }): Promise<RoleTrainingRequirementWithDetails[]> {
    const pool = await getConnection();
    let query = `
      SELECT 
        rtr.*,
        r.name as roleName,
        r.displayName as roleDisplayName,
        c.competencyCode,
        c.name as competencyName,
        c.category as competencyCategory,
        c.hasExpiry as competencyHasExpiry,
        c.defaultValidityMonths as competencyDefaultValidityMonths
      FROM RoleTrainingRequirements rtr
      INNER JOIN Roles r ON rtr.roleId = r.id
      INNER JOIN Competencies c ON rtr.competencyId = c.id
      WHERE 1=1
    `;

    const request = pool.request();

    if (filters?.roleId !== undefined) {
      query += ' AND rtr.roleId = @roleId';
      request.input('roleId', sql.Int, filters.roleId);
    }

    if (filters?.competencyId !== undefined) {
      query += ' AND rtr.competencyId = @competencyId';
      request.input('competencyId', sql.Int, filters.competencyId);
    }

    if (filters?.status) {
      query += ' AND rtr.status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }

    if (filters?.isMandatory !== undefined) {
      query += ' AND rtr.isMandatory = @isMandatory';
      request.input('isMandatory', sql.Bit, filters.isMandatory);
    }

    if (filters?.isRegulatory !== undefined) {
      query += ' AND rtr.isRegulatory = @isRegulatory';
      request.input('isRegulatory', sql.Bit, filters.isRegulatory);
    }

    if (filters?.priority) {
      query += ' AND rtr.priority = @priority';
      request.input('priority', sql.NVarChar, filters.priority);
    }

    query += ' ORDER BY rtr.priority DESC, r.name, c.name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get all competencies required for a specific role
   */
  static async getRequiredCompetenciesForRole(
    roleId: number,
    includeInactive = false
  ): Promise<RoleTrainingRequirementWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request().input('roleId', sql.Int, roleId);

    let query = `
      SELECT 
        rtr.*,
        r.name as roleName,
        r.displayName as roleDisplayName,
        c.competencyCode,
        c.name as competencyName,
        c.category as competencyCategory,
        c.hasExpiry as competencyHasExpiry,
        c.defaultValidityMonths as competencyDefaultValidityMonths
      FROM RoleTrainingRequirements rtr
      INNER JOIN Roles r ON rtr.roleId = r.id
      INNER JOIN Competencies c ON rtr.competencyId = c.id
      WHERE rtr.roleId = @roleId
    `;

    if (!includeInactive) {
      query += " AND rtr.status = 'active'";
    }

    query += ' ORDER BY rtr.priority DESC, c.name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get missing or outdated competencies for a user based on their role(s)
   */
  static async getMissingCompetenciesForUser(
    userId: number,
    daysThreshold = 30
  ): Promise<MissingCompetency[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('daysThreshold', sql.Int, daysThreshold)
      .query(`
        WITH UserRolesWithRequirements AS (
          SELECT DISTINCT
            ur.userId,
            u.firstName + ' ' + u.lastName as userName,
            u.email as userEmail,
            ur.roleId,
            r.name as roleName,
            rtr.competencyId,
            c.competencyCode,
            c.name as competencyName,
            c.category as competencyCategory,
            rtr.isMandatory,
            rtr.isRegulatory,
            rtr.priority,
            rtr.gracePeriodDays,
            rtr.complianceDeadline
          FROM UserRoles ur
          INNER JOIN Roles r ON ur.roleId = r.id
          INNER JOIN RoleTrainingRequirements rtr ON rtr.roleId = r.id
          INNER JOIN Competencies c ON rtr.competencyId = c.id
          INNER JOIN Users u ON ur.userId = u.id
          WHERE ur.userId = @userId
            AND ur.active = 1
            AND rtr.status = 'active'
            AND (rtr.effectiveDate IS NULL OR rtr.effectiveDate <= GETDATE())
            AND (rtr.endDate IS NULL OR rtr.endDate >= GETDATE())
        ),
        UserCompetenciesStatus AS (
          SELECT 
            uc.userId,
            uc.competencyId,
            uc.status,
            uc.expiryDate,
            uc.isExpired,
            CASE 
              WHEN uc.expiryDate IS NOT NULL 
              THEN DATEDIFF(day, GETDATE(), uc.expiryDate)
              ELSE NULL
            END as daysUntilExpiry
          FROM UserCompetencies uc
          WHERE uc.userId = @userId
            AND uc.status = 'active'
        )
        SELECT 
          urr.*,
          CASE 
            WHEN ucs.competencyId IS NULL THEN 'missing'
            WHEN ucs.isExpired = 1 THEN 'expired'
            WHEN ucs.daysUntilExpiry IS NOT NULL AND ucs.daysUntilExpiry <= @daysThreshold THEN 'expiring_soon'
            ELSE 'compliant'
          END as status,
          ucs.daysUntilExpiry
        FROM UserRolesWithRequirements urr
        LEFT JOIN UserCompetenciesStatus ucs ON urr.competencyId = ucs.competencyId
        WHERE (
          ucs.competencyId IS NULL 
          OR ucs.isExpired = 1 
          OR (ucs.daysUntilExpiry IS NOT NULL AND ucs.daysUntilExpiry <= @daysThreshold)
        )
        ORDER BY 
          CASE urr.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          urr.competencyName
      `);

    return result.recordset;
  }

  /**
   * Get users with missing required competencies for a specific role
   */
  static async getUsersWithMissingCompetencies(
    roleId?: number,
    competencyId?: number
  ): Promise<MissingCompetency[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      WITH UserRolesWithRequirements AS (
        SELECT DISTINCT
          ur.userId,
          u.firstName + ' ' + u.lastName as userName,
          u.email as userEmail,
          ur.roleId,
          r.name as roleName,
          rtr.competencyId,
          c.competencyCode,
          c.name as competencyName,
          c.category as competencyCategory,
          rtr.isMandatory,
          rtr.isRegulatory,
          rtr.priority,
          rtr.gracePeriodDays,
          rtr.complianceDeadline
        FROM UserRoles ur
        INNER JOIN Users u ON ur.userId = u.id
        INNER JOIN Roles r ON ur.roleId = r.id
        INNER JOIN RoleTrainingRequirements rtr ON rtr.roleId = r.id
        INNER JOIN Competencies c ON rtr.competencyId = c.id
        WHERE ur.active = 1
          AND rtr.status = 'active'
          AND (rtr.effectiveDate IS NULL OR rtr.effectiveDate <= GETDATE())
          AND (rtr.endDate IS NULL OR rtr.endDate >= GETDATE())
    `;

    if (roleId !== undefined) {
      query += ' AND ur.roleId = @roleId';
      request.input('roleId', sql.Int, roleId);
    }

    if (competencyId !== undefined) {
      query += ' AND rtr.competencyId = @competencyId';
      request.input('competencyId', sql.Int, competencyId);
    }

    query += `
      ),
      UserCompetenciesStatus AS (
        SELECT 
          uc.userId,
          uc.competencyId,
          uc.status,
          uc.expiryDate,
          uc.isExpired,
          CASE 
            WHEN uc.expiryDate IS NOT NULL 
            THEN DATEDIFF(day, GETDATE(), uc.expiryDate)
            ELSE NULL
          END as daysUntilExpiry
        FROM UserCompetencies uc
        WHERE uc.status = 'active'
      )
      SELECT 
        urr.*,
        CASE 
          WHEN ucs.competencyId IS NULL THEN 'missing'
          WHEN ucs.isExpired = 1 THEN 'expired'
          ELSE 'compliant'
        END as status,
        ucs.daysUntilExpiry
      FROM UserRolesWithRequirements urr
      LEFT JOIN UserCompetenciesStatus ucs 
        ON urr.userId = ucs.userId 
        AND urr.competencyId = ucs.competencyId
      WHERE (
        ucs.competencyId IS NULL 
        OR ucs.isExpired = 1
      )
      ORDER BY 
        urr.userName,
        CASE urr.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        urr.competencyName
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update a requirement
   */
  static async update(id: number, updates: Partial<RoleTrainingRequirement>): Promise<void> {
    const pool = await getConnection();
    const fields: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (updates.isMandatory !== undefined) {
      fields.push('isMandatory = @isMandatory');
      request.input('isMandatory', sql.Bit, updates.isMandatory);
    }

    if (updates.isRegulatory !== undefined) {
      fields.push('isRegulatory = @isRegulatory');
      request.input('isRegulatory', sql.Bit, updates.isRegulatory);
    }

    if (updates.priority !== undefined) {
      fields.push('priority = @priority');
      request.input('priority', sql.NVarChar, updates.priority);
    }

    if (updates.gracePeriodDays !== undefined) {
      fields.push('gracePeriodDays = @gracePeriodDays');
      request.input('gracePeriodDays', sql.Int, updates.gracePeriodDays);
    }

    if (updates.complianceDeadline !== undefined) {
      fields.push('complianceDeadline = @complianceDeadline');
      request.input('complianceDeadline', sql.DateTime2, updates.complianceDeadline);
    }

    if (updates.minimumProficiencyLevel !== undefined) {
      fields.push('minimumProficiencyLevel = @minimumProficiencyLevel');
      request.input('minimumProficiencyLevel', sql.NVarChar, updates.minimumProficiencyLevel);
    }

    if (updates.refreshFrequencyMonths !== undefined) {
      fields.push('refreshFrequencyMonths = @refreshFrequencyMonths');
      request.input('refreshFrequencyMonths', sql.Int, updates.refreshFrequencyMonths);
    }

    if (updates.status !== undefined) {
      fields.push('status = @status');
      request.input('status', sql.NVarChar, updates.status);
    }

    if (updates.effectiveDate !== undefined) {
      fields.push('effectiveDate = @effectiveDate');
      request.input('effectiveDate', sql.DateTime2, updates.effectiveDate);
    }

    if (updates.endDate !== undefined) {
      fields.push('endDate = @endDate');
      request.input('endDate', sql.DateTime2, updates.endDate);
    }

    if (updates.justification !== undefined) {
      fields.push('justification = @justification');
      request.input('justification', sql.NVarChar, updates.justification);
    }

    if (updates.regulatoryReference !== undefined) {
      fields.push('regulatoryReference = @regulatoryReference');
      request.input('regulatoryReference', sql.NVarChar, updates.regulatoryReference);
    }

    if (updates.notes !== undefined) {
      fields.push('notes = @notes');
      request.input('notes', sql.NVarChar, updates.notes);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push('updatedAt = GETDATE()');

    await request.query(`
      UPDATE RoleTrainingRequirements
      SET ${fields.join(', ')}
      WHERE id = @id
    `);
  }

  /**
   * Delete a requirement (soft delete by setting status to inactive)
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE RoleTrainingRequirements
        SET status = 'inactive', updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Hard delete a requirement (use with caution)
   */
  static async hardDelete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM RoleTrainingRequirements WHERE id = @id');
  }
}
