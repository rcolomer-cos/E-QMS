import { getConnection, sql } from '../config/database';
import { CompetencyStatus } from '../types';

export interface Competency {
  id?: number;
  competencyCode: string;
  name: string;
  description?: string;
  category: string;
  subCategory?: string;
  competencyType?: string;
  level?: string;
  version?: string;
  isRegulatory: boolean;
  isMandatory: boolean;
  mandatoryForRoles?: string;
  prerequisiteCompetencies?: string;
  hasExpiry: boolean;
  defaultValidityMonths?: number;
  renewalRequired: boolean;
  relatedTrainingIds?: string;
  minimumTrainingHours?: number;
  requiresAssessment: boolean;
  assessmentCriteria?: string;
  minimumScore?: number;
  status: CompetencyStatus;
  effectiveDate?: Date;
  obsoleteDate?: Date;
  notes?: string;
  externalReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
}

export interface UserCompetency {
  id?: number;
  userId: number;
  competencyId: number;
  acquiredDate: Date;
  acquisitionMethod?: string;
  trainingId?: number;
  trainingAttendeeId?: number;
  certificateId?: number;
  proficiencyLevel?: string;
  assessmentScore?: number;
  assessedBy?: number;
  assessedAt?: Date;
  assessmentNotes?: string;
  effectiveDate: Date;
  expiryDate?: Date;
  isExpired?: boolean;
  lastRenewalDate?: Date;
  nextRenewalDate?: Date;
  renewalCount?: number;
  status: string;
  statusReason?: string;
  statusChangedAt?: Date;
  statusChangedBy?: number;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: Date;
  verificationMethod?: string;
  verificationNotes?: string;
  evidenceDescription?: string;
  evidenceFileIds?: string;
  notes?: string;
  externalReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
}

export interface UserCompetencyWithDetails extends UserCompetency {
  competencyName?: string;
  competencyCode?: string;
  competencyCategory?: string;
  userName?: string;
  userEmail?: string;
  trainingTitle?: string;
  certificateNumber?: string;
}

export class CompetencyModel {
  /**
   * Create a new competency definition
   */
  static async create(competency: Competency): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('competencyCode', sql.NVarChar, competency.competencyCode)
      .input('name', sql.NVarChar, competency.name)
      .input('description', sql.NVarChar, competency.description)
      .input('category', sql.NVarChar, competency.category)
      .input('subCategory', sql.NVarChar, competency.subCategory)
      .input('competencyType', sql.NVarChar, competency.competencyType)
      .input('level', sql.NVarChar, competency.level)
      .input('version', sql.NVarChar, competency.version)
      .input('isRegulatory', sql.Bit, competency.isRegulatory)
      .input('isMandatory', sql.Bit, competency.isMandatory)
      .input('mandatoryForRoles', sql.NVarChar, competency.mandatoryForRoles)
      .input('prerequisiteCompetencies', sql.NVarChar, competency.prerequisiteCompetencies)
      .input('hasExpiry', sql.Bit, competency.hasExpiry)
      .input('defaultValidityMonths', sql.Int, competency.defaultValidityMonths)
      .input('renewalRequired', sql.Bit, competency.renewalRequired)
      .input('relatedTrainingIds', sql.NVarChar, competency.relatedTrainingIds)
      .input('minimumTrainingHours', sql.Decimal(5, 2), competency.minimumTrainingHours)
      .input('requiresAssessment', sql.Bit, competency.requiresAssessment)
      .input('assessmentCriteria', sql.NVarChar, competency.assessmentCriteria)
      .input('minimumScore', sql.Decimal(5, 2), competency.minimumScore)
      .input('status', sql.NVarChar, competency.status)
      .input('effectiveDate', sql.DateTime2, competency.effectiveDate)
      .input('obsoleteDate', sql.DateTime2, competency.obsoleteDate)
      .input('notes', sql.NVarChar, competency.notes)
      .input('externalReference', sql.NVarChar, competency.externalReference)
      .input('createdBy', sql.Int, competency.createdBy)
      .query(`
        INSERT INTO Competencies (
          competencyCode, name, description, category, subCategory, competencyType,
          level, version, isRegulatory, isMandatory, mandatoryForRoles, prerequisiteCompetencies,
          hasExpiry, defaultValidityMonths, renewalRequired, relatedTrainingIds, minimumTrainingHours,
          requiresAssessment, assessmentCriteria, minimumScore, status, effectiveDate, obsoleteDate,
          notes, externalReference, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @competencyCode, @name, @description, @category, @subCategory, @competencyType,
          @level, @version, @isRegulatory, @isMandatory, @mandatoryForRoles, @prerequisiteCompetencies,
          @hasExpiry, @defaultValidityMonths, @renewalRequired, @relatedTrainingIds, @minimumTrainingHours,
          @requiresAssessment, @assessmentCriteria, @minimumScore, @status, @effectiveDate, @obsoleteDate,
          @notes, @externalReference, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Find competency by ID
   */
  static async findById(id: number): Promise<Competency | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Competencies WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find competency by code
   */
  static async findByCode(competencyCode: string): Promise<Competency | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('competencyCode', sql.NVarChar, competencyCode)
      .query('SELECT * FROM Competencies WHERE competencyCode = @competencyCode');

    return result.recordset[0] || null;
  }

  /**
   * Find all competencies with optional filters
   */
  static async findAll(filters?: { 
    status?: CompetencyStatus; 
    category?: string;
    isMandatory?: boolean;
    isRegulatory?: boolean;
  }): Promise<Competency[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Competencies WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }
    if (filters?.isMandatory !== undefined) {
      request.input('isMandatory', sql.Bit, filters.isMandatory);
      query += ' AND isMandatory = @isMandatory';
    }
    if (filters?.isRegulatory !== undefined) {
      request.input('isRegulatory', sql.Bit, filters.isRegulatory);
      query += ' AND isRegulatory = @isRegulatory';
    }

    query += ' ORDER BY category, name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update competency
   */
  static async update(id: number, updates: Partial<Competency>): Promise<void> {
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
      await request.query(`UPDATE Competencies SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Assign competency to user
   */
  static async assignToUser(userCompetency: UserCompetency): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('userId', sql.Int, userCompetency.userId)
      .input('competencyId', sql.Int, userCompetency.competencyId)
      .input('acquiredDate', sql.DateTime2, userCompetency.acquiredDate)
      .input('acquisitionMethod', sql.NVarChar, userCompetency.acquisitionMethod)
      .input('trainingId', sql.Int, userCompetency.trainingId)
      .input('trainingAttendeeId', sql.Int, userCompetency.trainingAttendeeId)
      .input('certificateId', sql.Int, userCompetency.certificateId)
      .input('proficiencyLevel', sql.NVarChar, userCompetency.proficiencyLevel)
      .input('assessmentScore', sql.Decimal(5, 2), userCompetency.assessmentScore)
      .input('assessedBy', sql.Int, userCompetency.assessedBy)
      .input('assessedAt', sql.DateTime2, userCompetency.assessedAt)
      .input('assessmentNotes', sql.NVarChar, userCompetency.assessmentNotes)
      .input('effectiveDate', sql.DateTime2, userCompetency.effectiveDate)
      .input('expiryDate', sql.DateTime2, userCompetency.expiryDate)
      .input('lastRenewalDate', sql.DateTime2, userCompetency.lastRenewalDate)
      .input('nextRenewalDate', sql.DateTime2, userCompetency.nextRenewalDate)
      .input('renewalCount', sql.Int, userCompetency.renewalCount || 0)
      .input('status', sql.NVarChar, userCompetency.status)
      .input('statusReason', sql.NVarChar, userCompetency.statusReason)
      .input('verified', sql.Bit, userCompetency.verified)
      .input('verifiedBy', sql.Int, userCompetency.verifiedBy)
      .input('verifiedAt', sql.DateTime2, userCompetency.verifiedAt)
      .input('verificationMethod', sql.NVarChar, userCompetency.verificationMethod)
      .input('verificationNotes', sql.NVarChar, userCompetency.verificationNotes)
      .input('evidenceDescription', sql.NVarChar, userCompetency.evidenceDescription)
      .input('evidenceFileIds', sql.NVarChar, userCompetency.evidenceFileIds)
      .input('notes', sql.NVarChar, userCompetency.notes)
      .input('externalReference', sql.NVarChar, userCompetency.externalReference)
      .input('createdBy', sql.Int, userCompetency.createdBy)
      .query(`
        INSERT INTO UserCompetencies (
          userId, competencyId, acquiredDate, acquisitionMethod, trainingId, trainingAttendeeId,
          certificateId, proficiencyLevel, assessmentScore, assessedBy, assessedAt, assessmentNotes,
          effectiveDate, expiryDate, lastRenewalDate, nextRenewalDate, renewalCount,
          status, statusReason, verified, verifiedBy, verifiedAt, verificationMethod, verificationNotes,
          evidenceDescription, evidenceFileIds, notes, externalReference, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @userId, @competencyId, @acquiredDate, @acquisitionMethod, @trainingId, @trainingAttendeeId,
          @certificateId, @proficiencyLevel, @assessmentScore, @assessedBy, @assessedAt, @assessmentNotes,
          @effectiveDate, @expiryDate, @lastRenewalDate, @nextRenewalDate, @renewalCount,
          @status, @statusReason, @verified, @verifiedBy, @verifiedAt, @verificationMethod, @verificationNotes,
          @evidenceDescription, @evidenceFileIds, @notes, @externalReference, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get user competencies with optional filters
   */
  static async getUserCompetencies(
    userId: number,
    filters?: { status?: string; isExpired?: boolean }
  ): Promise<UserCompetencyWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request().input('userId', sql.Int, userId);
    
    let query = `
      SELECT 
        uc.*,
        c.name AS competencyName,
        c.competencyCode,
        c.category AS competencyCategory,
        u.firstName + ' ' + u.lastName AS userName,
        u.email AS userEmail,
        t.title AS trainingTitle,
        tc.certificateNumber
      FROM UserCompetencies uc
      INNER JOIN Competencies c ON uc.competencyId = c.id
      INNER JOIN Users u ON uc.userId = u.id
      LEFT JOIN Trainings t ON uc.trainingId = t.id
      LEFT JOIN TrainingCertificates tc ON uc.certificateId = tc.id
      WHERE uc.userId = @userId
    `;

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND uc.status = @status';
    }
    if (filters?.isExpired !== undefined) {
      request.input('isExpired', sql.Bit, filters.isExpired);
      query += ' AND uc.isExpired = @isExpired';
    }

    query += ' ORDER BY c.category, c.name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get all users with a specific competency
   */
  static async getUsersByCompetency(
    competencyId: number,
    filters?: { status?: string }
  ): Promise<UserCompetencyWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request().input('competencyId', sql.Int, competencyId);
    
    let query = `
      SELECT 
        uc.*,
        c.name AS competencyName,
        c.competencyCode,
        c.category AS competencyCategory,
        u.firstName + ' ' + u.lastName AS userName,
        u.email AS userEmail,
        t.title AS trainingTitle,
        tc.certificateNumber
      FROM UserCompetencies uc
      INNER JOIN Competencies c ON uc.competencyId = c.id
      INNER JOIN Users u ON uc.userId = u.id
      LEFT JOIN Trainings t ON uc.trainingId = t.id
      LEFT JOIN TrainingCertificates tc ON uc.certificateId = tc.id
      WHERE uc.competencyId = @competencyId
    `;

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND uc.status = @status';
    }

    query += ' ORDER BY u.lastName, u.firstName';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update user competency
   */
  static async updateUserCompetency(id: number, updates: Partial<UserCompetency>): Promise<void> {
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
      await request.query(`UPDATE UserCompetencies SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Get expiring competencies for a user
   */
  static async getExpiringCompetencies(
    userId: number,
    daysThreshold: number = 30
  ): Promise<UserCompetencyWithDetails[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('daysThreshold', sql.Int, daysThreshold)
      .query(`
        SELECT 
          uc.*,
          c.name AS competencyName,
          c.competencyCode,
          c.category AS competencyCategory,
          u.firstName + ' ' + u.lastName AS userName,
          u.email AS userEmail
        FROM UserCompetencies uc
        INNER JOIN Competencies c ON uc.competencyId = c.id
        INNER JOIN Users u ON uc.userId = u.id
        WHERE uc.userId = @userId
          AND uc.status = 'active'
          AND uc.expiryDate IS NOT NULL
          AND uc.expiryDate <= DATEADD(day, @daysThreshold, GETDATE())
          AND uc.expiryDate >= GETDATE()
        ORDER BY uc.expiryDate ASC
      `);

    return result.recordset;
  }
}
