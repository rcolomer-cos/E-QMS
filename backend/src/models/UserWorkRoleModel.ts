import sql from 'mssql';
import { getConnection } from '../config/database';

export interface UserWorkRole {
  id?: number;
  userId: number;
  workRoleId: number;
  skillLevelId?: number;
  assignedDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  status: string;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: Date;
  verificationNotes?: string;
  notes?: string;
  trainingRequired: boolean;
  trainingCompleted: boolean;
  trainingCompletedDate?: Date;
  certificationRequired: boolean;
  certificationId?: number;
  lastAssessmentDate?: Date;
  lastAssessmentScore?: number;
  lastAssessedBy?: number;
  nextAssessmentDate?: Date;
  assignedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: number;
  active: boolean;
}

export interface UserWorkRoleWithDetails extends UserWorkRole {
  // User Details
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userDepartment?: string;
  
  // Work Role Details
  workRoleCode: string;
  workRoleName: string;
  workRoleCategory?: string;
  workRoleLevel?: string;
  workRoleDepartmentName?: string;
  
  // Skill Level Details
  skillLevel?: number;
  skillLevelName?: string;
  skillLevelDescription?: string;
  
  // Assignment Details
  assignedByName?: string;
  verifiedByName?: string;
  lastAssessedByName?: string;
  updatedByName?: string;
  
  // Calculated Fields
  isExpired?: boolean;
  daysUntilExpiry?: number;
  daysUntilNextAssessment?: number;
  
  // Tenure Fields
  yearsInRole?: number;
  monthsInRole?: number;
  daysInRole?: number;
  tenureDisplay?: string;
}

export interface UserWorkRoleFilters {
  userId?: number;
  workRoleId?: number;
  skillLevelId?: number;
  status?: string;
  verified?: boolean;
  departmentId?: number;
  category?: string;
  expiringWithinDays?: number;
  assessmentDueWithinDays?: number;
  trainingRequired?: boolean;
  certificationRequired?: boolean;
}

export interface UserWorkRoleStatistics {
  totalAssignments: number;
  activeAssignments: number;
  expiredAssignments: number;
  pendingVerification: number;
  trainingRequired: number;
  trainingCompleted: number;
  certificationRequired: number;
  bySkillLevel: {
    skillLevel: number;
    count: number;
  }[];
  byWorkRole: {
    workRoleId: number;
    workRoleName: string;
    count: number;
  }[];
}

export class UserWorkRoleModel {
  /**
   * Assign a work role to a user
   */
  static async assignWorkRole(data: UserWorkRole): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('userId', sql.Int, data.userId)
      .input('workRoleId', sql.Int, data.workRoleId)
      .input('skillLevelId', sql.Int, data.skillLevelId)
      .input('assignedDate', sql.DateTime2, data.assignedDate)
      .input('effectiveDate', sql.DateTime2, data.effectiveDate)
      .input('expiryDate', sql.DateTime2, data.expiryDate)
      .input('status', sql.NVarChar, data.status)
      .input('verified', sql.Bit, data.verified)
      .input('verifiedBy', sql.Int, data.verifiedBy)
      .input('verifiedAt', sql.DateTime2, data.verifiedAt)
      .input('verificationNotes', sql.NVarChar, data.verificationNotes)
      .input('notes', sql.NVarChar, data.notes)
      .input('trainingRequired', sql.Bit, data.trainingRequired)
      .input('trainingCompleted', sql.Bit, data.trainingCompleted)
      .input('trainingCompletedDate', sql.DateTime2, data.trainingCompletedDate)
      .input('certificationRequired', sql.Bit, data.certificationRequired)
      .input('certificationId', sql.Int, data.certificationId)
      .input('lastAssessmentDate', sql.DateTime2, data.lastAssessmentDate)
      .input('lastAssessmentScore', sql.Decimal(5, 2), data.lastAssessmentScore)
      .input('lastAssessedBy', sql.Int, data.lastAssessedBy)
      .input('nextAssessmentDate', sql.DateTime2, data.nextAssessmentDate)
      .input('assignedBy', sql.Int, data.assignedBy)
      .input('active', sql.Bit, data.active)
      .query(`
        INSERT INTO UserWorkRoles (
          userId, workRoleId, skillLevelId, assignedDate, effectiveDate, expiryDate,
          status, verified, verifiedBy, verifiedAt, verificationNotes, notes,
          trainingRequired, trainingCompleted, trainingCompletedDate,
          certificationRequired, certificationId,
          lastAssessmentDate, lastAssessmentScore, lastAssessedBy, nextAssessmentDate,
          assignedBy, active
        )
        OUTPUT INSERTED.id
        VALUES (
          @userId, @workRoleId, @skillLevelId, @assignedDate, @effectiveDate, @expiryDate,
          @status, @verified, @verifiedBy, @verifiedAt, @verificationNotes, @notes,
          @trainingRequired, @trainingCompleted, @trainingCompletedDate,
          @certificationRequired, @certificationId,
          @lastAssessmentDate, @lastAssessmentScore, @lastAssessedBy, @nextAssessmentDate,
          @assignedBy, @active
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get user work roles with detailed information
   */
  static async getUserWorkRoles(
    userId: number,
    filters?: UserWorkRoleFilters
  ): Promise<UserWorkRoleWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        uwr.*,
        u.firstName as userFirstName,
        u.lastName as userLastName,
        u.email as userEmail,
        u.department as userDepartment,
        wr.code as workRoleCode,
        wr.name as workRoleName,
        wr.category as workRoleCategory,
        wr.level as workRoleLevel,
        d.name as workRoleDepartmentName,
        sl.level as skillLevel,
        sl.name as skillLevelName,
        sl.description as skillLevelDescription,
        assignedByUser.firstName + ' ' + assignedByUser.lastName as assignedByName,
        verifiedByUser.firstName + ' ' + verifiedByUser.lastName as verifiedByName,
        assessedByUser.firstName + ' ' + assessedByUser.lastName as lastAssessedByName,
        updatedByUser.firstName + ' ' + updatedByUser.lastName as updatedByName,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL AND uwr.expiryDate < GETDATE() THEN 1
          ELSE 0
        END as isExpired,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.expiryDate)
          ELSE NULL
        END as daysUntilExpiry,
        CASE 
          WHEN uwr.nextAssessmentDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate)
          ELSE NULL
        END as daysUntilNextAssessment,
        DATEDIFF(year, uwr.effectiveDate, GETDATE()) as yearsInRole,
        DATEDIFF(month, uwr.effectiveDate, GETDATE()) as monthsInRole,
        DATEDIFF(day, uwr.effectiveDate, GETDATE()) as daysInRole
      FROM UserWorkRoles uwr
      INNER JOIN Users u ON uwr.userId = u.id
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      LEFT JOIN Departments d ON wr.departmentId = d.id
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      LEFT JOIN Users assignedByUser ON uwr.assignedBy = assignedByUser.id
      LEFT JOIN Users verifiedByUser ON uwr.verifiedBy = verifiedByUser.id
      LEFT JOIN Users assessedByUser ON uwr.lastAssessedBy = assessedByUser.id
      LEFT JOIN Users updatedByUser ON uwr.updatedBy = updatedByUser.id
      WHERE uwr.userId = @userId
    `;

    request.input('userId', sql.Int, userId);

    if (filters) {
      if (filters.workRoleId) {
        request.input('workRoleId', sql.Int, filters.workRoleId);
        query += ' AND uwr.workRoleId = @workRoleId';
      }
      if (filters.skillLevelId) {
        request.input('skillLevelId', sql.Int, filters.skillLevelId);
        query += ' AND uwr.skillLevelId = @skillLevelId';
      }
      if (filters.status) {
        request.input('status', sql.NVarChar, filters.status);
        query += ' AND uwr.status = @status';
      }
      if (filters.verified !== undefined) {
        request.input('verified', sql.Bit, filters.verified);
        query += ' AND uwr.verified = @verified';
      }
      if (filters.category) {
        request.input('category', sql.NVarChar, filters.category);
        query += ' AND wr.category = @category';
      }
      if (filters.expiringWithinDays) {
        request.input('expiringDays', sql.Int, filters.expiringWithinDays);
        query += ' AND uwr.expiryDate IS NOT NULL AND DATEDIFF(day, GETDATE(), uwr.expiryDate) <= @expiringDays AND DATEDIFF(day, GETDATE(), uwr.expiryDate) >= 0';
      }
      if (filters.assessmentDueWithinDays) {
        request.input('assessmentDays', sql.Int, filters.assessmentDueWithinDays);
        query += ' AND uwr.nextAssessmentDate IS NOT NULL AND DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate) <= @assessmentDays AND DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate) >= 0';
      }
      if (filters.trainingRequired !== undefined) {
        request.input('trainingRequired', sql.Bit, filters.trainingRequired);
        query += ' AND uwr.trainingRequired = @trainingRequired';
      }
      if (filters.certificationRequired !== undefined) {
        request.input('certificationRequired', sql.Bit, filters.certificationRequired);
        query += ' AND uwr.certificationRequired = @certificationRequired';
      }
    }

    query += ' ORDER BY uwr.assignedDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get all users assigned to a specific work role
   */
  static async getWorkRoleUsers(
    workRoleId: number,
    filters?: UserWorkRoleFilters
  ): Promise<UserWorkRoleWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        uwr.*,
        u.firstName as userFirstName,
        u.lastName as userLastName,
        u.email as userEmail,
        u.department as userDepartment,
        wr.code as workRoleCode,
        wr.name as workRoleName,
        wr.category as workRoleCategory,
        wr.level as workRoleLevel,
        d.name as workRoleDepartmentName,
        sl.level as skillLevel,
        sl.name as skillLevelName,
        sl.description as skillLevelDescription,
        assignedByUser.firstName + ' ' + assignedByUser.lastName as assignedByName,
        verifiedByUser.firstName + ' ' + verifiedByUser.lastName as verifiedByName,
        assessedByUser.firstName + ' ' + assessedByUser.lastName as lastAssessedByName,
        updatedByUser.firstName + ' ' + updatedByUser.lastName as updatedByName,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL AND uwr.expiryDate < GETDATE() THEN 1
          ELSE 0
        END as isExpired,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.expiryDate)
          ELSE NULL
        END as daysUntilExpiry,
        CASE 
          WHEN uwr.nextAssessmentDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate)
          ELSE NULL
        END as daysUntilNextAssessment,
        DATEDIFF(year, uwr.effectiveDate, GETDATE()) as yearsInRole,
        DATEDIFF(month, uwr.effectiveDate, GETDATE()) as monthsInRole,
        DATEDIFF(day, uwr.effectiveDate, GETDATE()) as daysInRole
      FROM UserWorkRoles uwr
      INNER JOIN Users u ON uwr.userId = u.id
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      LEFT JOIN Departments d ON wr.departmentId = d.id
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      LEFT JOIN Users assignedByUser ON uwr.assignedBy = assignedByUser.id
      LEFT JOIN Users verifiedByUser ON uwr.verifiedBy = verifiedByUser.id
      LEFT JOIN Users assessedByUser ON uwr.lastAssessedBy = assessedByUser.id
      LEFT JOIN Users updatedByUser ON uwr.updatedBy = updatedByUser.id
      WHERE uwr.workRoleId = @workRoleId
    `;

    request.input('workRoleId', sql.Int, workRoleId);

    if (filters) {
      if (filters.skillLevelId) {
        request.input('skillLevelId', sql.Int, filters.skillLevelId);
        query += ' AND uwr.skillLevelId = @skillLevelId';
      }
      if (filters.status) {
        request.input('status', sql.NVarChar, filters.status);
        query += ' AND uwr.status = @status';
      }
      if (filters.verified !== undefined) {
        request.input('verified', sql.Bit, filters.verified);
        query += ' AND uwr.verified = @verified';
      }
      if (filters.departmentId) {
        request.input('departmentId', sql.Int, filters.departmentId);
        query += ' AND wr.departmentId = @departmentId';
      }
    }

    query += ' ORDER BY u.lastName, u.firstName';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get all user work role assignments with filters
   */
  static async getAll(filters?: UserWorkRoleFilters): Promise<UserWorkRoleWithDetails[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        uwr.*,
        u.firstName as userFirstName,
        u.lastName as userLastName,
        u.email as userEmail,
        u.department as userDepartment,
        wr.code as workRoleCode,
        wr.name as workRoleName,
        wr.category as workRoleCategory,
        wr.level as workRoleLevel,
        d.name as workRoleDepartmentName,
        sl.level as skillLevel,
        sl.name as skillLevelName,
        sl.description as skillLevelDescription,
        assignedByUser.firstName + ' ' + assignedByUser.lastName as assignedByName,
        verifiedByUser.firstName + ' ' + verifiedByUser.lastName as verifiedByName,
        assessedByUser.firstName + ' ' + assessedByUser.lastName as lastAssessedByName,
        updatedByUser.firstName + ' ' + updatedByUser.lastName as updatedByName,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL AND uwr.expiryDate < GETDATE() THEN 1
          ELSE 0
        END as isExpired,
        CASE 
          WHEN uwr.expiryDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.expiryDate)
          ELSE NULL
        END as daysUntilExpiry,
        CASE 
          WHEN uwr.nextAssessmentDate IS NOT NULL 
          THEN DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate)
          ELSE NULL
        END as daysUntilNextAssessment,
        DATEDIFF(year, uwr.effectiveDate, GETDATE()) as yearsInRole,
        DATEDIFF(month, uwr.effectiveDate, GETDATE()) as monthsInRole,
        DATEDIFF(day, uwr.effectiveDate, GETDATE()) as daysInRole
      FROM UserWorkRoles uwr
      INNER JOIN Users u ON uwr.userId = u.id
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      LEFT JOIN Departments d ON wr.departmentId = d.id
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      LEFT JOIN Users assignedByUser ON uwr.assignedBy = assignedByUser.id
      LEFT JOIN Users verifiedByUser ON uwr.verifiedBy = verifiedByUser.id
      LEFT JOIN Users assessedByUser ON uwr.lastAssessedBy = assessedByUser.id
      LEFT JOIN Users updatedByUser ON uwr.updatedBy = updatedByUser.id
      WHERE 1=1
    `;

    if (filters) {
      if (filters.userId) {
        request.input('userId', sql.Int, filters.userId);
        query += ' AND uwr.userId = @userId';
      }
      if (filters.workRoleId) {
        request.input('workRoleId', sql.Int, filters.workRoleId);
        query += ' AND uwr.workRoleId = @workRoleId';
      }
      if (filters.skillLevelId) {
        request.input('skillLevelId', sql.Int, filters.skillLevelId);
        query += ' AND uwr.skillLevelId = @skillLevelId';
      }
      if (filters.status) {
        request.input('status', sql.NVarChar, filters.status);
        query += ' AND uwr.status = @status';
      }
      if (filters.verified !== undefined) {
        request.input('verified', sql.Bit, filters.verified);
        query += ' AND uwr.verified = @verified';
      }
      if (filters.departmentId) {
        request.input('departmentId', sql.Int, filters.departmentId);
        query += ' AND wr.departmentId = @departmentId';
      }
      if (filters.category) {
        request.input('category', sql.NVarChar, filters.category);
        query += ' AND wr.category = @category';
      }
      if (filters.expiringWithinDays) {
        request.input('expiringDays', sql.Int, filters.expiringWithinDays);
        query += ' AND uwr.expiryDate IS NOT NULL AND DATEDIFF(day, GETDATE(), uwr.expiryDate) <= @expiringDays AND DATEDIFF(day, GETDATE(), uwr.expiryDate) >= 0';
      }
      if (filters.assessmentDueWithinDays) {
        request.input('assessmentDays', sql.Int, filters.assessmentDueWithinDays);
        query += ' AND uwr.nextAssessmentDate IS NOT NULL AND DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate) <= @assessmentDays AND DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate) >= 0';
      }
      if (filters.trainingRequired !== undefined) {
        request.input('trainingRequired', sql.Bit, filters.trainingRequired);
        query += ' AND uwr.trainingRequired = @trainingRequired';
      }
      if (filters.certificationRequired !== undefined) {
        request.input('certificationRequired', sql.Bit, filters.certificationRequired);
        query += ' AND uwr.certificationRequired = @certificationRequired';
      }
    }

    query += ' ORDER BY u.lastName, u.firstName, wr.name';

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get a single user work role assignment by ID
   */
  static async getById(id: number): Promise<UserWorkRoleWithDetails | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          uwr.*,
          u.firstName as userFirstName,
          u.lastName as userLastName,
          u.email as userEmail,
          u.department as userDepartment,
          wr.code as workRoleCode,
          wr.name as workRoleName,
          wr.category as workRoleCategory,
          wr.level as workRoleLevel,
          d.name as workRoleDepartmentName,
          sl.level as skillLevel,
          sl.name as skillLevelName,
          sl.description as skillLevelDescription,
          assignedByUser.firstName + ' ' + assignedByUser.lastName as assignedByName,
          verifiedByUser.firstName + ' ' + verifiedByUser.lastName as verifiedByName,
          assessedByUser.firstName + ' ' + assessedByUser.lastName as lastAssessedByName,
          updatedByUser.firstName + ' ' + updatedByUser.lastName as updatedByName,
          CASE 
            WHEN uwr.expiryDate IS NOT NULL AND uwr.expiryDate < GETDATE() THEN 1
            ELSE 0
          END as isExpired,
          CASE 
            WHEN uwr.expiryDate IS NOT NULL 
            THEN DATEDIFF(day, GETDATE(), uwr.expiryDate)
            ELSE NULL
          END as daysUntilExpiry,
          CASE 
            WHEN uwr.nextAssessmentDate IS NOT NULL 
            THEN DATEDIFF(day, GETDATE(), uwr.nextAssessmentDate)
            ELSE NULL
          END as daysUntilNextAssessment,
          DATEDIFF(year, uwr.effectiveDate, GETDATE()) as yearsInRole,
          DATEDIFF(month, uwr.effectiveDate, GETDATE()) as monthsInRole,
          DATEDIFF(day, uwr.effectiveDate, GETDATE()) as daysInRole
        FROM UserWorkRoles uwr
        INNER JOIN Users u ON uwr.userId = u.id
        INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
        LEFT JOIN Departments d ON wr.departmentId = d.id
        LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
        LEFT JOIN Users assignedByUser ON uwr.assignedBy = assignedByUser.id
        LEFT JOIN Users verifiedByUser ON uwr.verifiedBy = verifiedByUser.id
        LEFT JOIN Users assessedByUser ON uwr.lastAssessedBy = assessedByUser.id
        LEFT JOIN Users updatedByUser ON uwr.updatedBy = updatedByUser.id
        WHERE uwr.id = @id
      `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Update a user work role assignment
   */
  static async update(id: number, data: Partial<UserWorkRole>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request();

    const updates: string[] = [];
    
    request.input('id', sql.Int, id);

    if (data.skillLevelId !== undefined) {
      request.input('skillLevelId', sql.Int, data.skillLevelId);
      updates.push('skillLevelId = @skillLevelId');
    }
    if (data.effectiveDate !== undefined) {
      request.input('effectiveDate', sql.DateTime2, data.effectiveDate);
      updates.push('effectiveDate = @effectiveDate');
    }
    if (data.expiryDate !== undefined) {
      request.input('expiryDate', sql.DateTime2, data.expiryDate);
      updates.push('expiryDate = @expiryDate');
    }
    if (data.status !== undefined) {
      request.input('status', sql.NVarChar, data.status);
      updates.push('status = @status');
    }
    if (data.verified !== undefined) {
      request.input('verified', sql.Bit, data.verified);
      updates.push('verified = @verified');
    }
    if (data.verifiedBy !== undefined) {
      request.input('verifiedBy', sql.Int, data.verifiedBy);
      updates.push('verifiedBy = @verifiedBy');
    }
    if (data.verifiedAt !== undefined) {
      request.input('verifiedAt', sql.DateTime2, data.verifiedAt);
      updates.push('verifiedAt = @verifiedAt');
    }
    if (data.verificationNotes !== undefined) {
      request.input('verificationNotes', sql.NVarChar, data.verificationNotes);
      updates.push('verificationNotes = @verificationNotes');
    }
    if (data.notes !== undefined) {
      request.input('notes', sql.NVarChar, data.notes);
      updates.push('notes = @notes');
    }
    if (data.trainingRequired !== undefined) {
      request.input('trainingRequired', sql.Bit, data.trainingRequired);
      updates.push('trainingRequired = @trainingRequired');
    }
    if (data.trainingCompleted !== undefined) {
      request.input('trainingCompleted', sql.Bit, data.trainingCompleted);
      updates.push('trainingCompleted = @trainingCompleted');
    }
    if (data.trainingCompletedDate !== undefined) {
      request.input('trainingCompletedDate', sql.DateTime2, data.trainingCompletedDate);
      updates.push('trainingCompletedDate = @trainingCompletedDate');
    }
    if (data.certificationRequired !== undefined) {
      request.input('certificationRequired', sql.Bit, data.certificationRequired);
      updates.push('certificationRequired = @certificationRequired');
    }
    if (data.certificationId !== undefined) {
      request.input('certificationId', sql.Int, data.certificationId);
      updates.push('certificationId = @certificationId');
    }
    if (data.lastAssessmentDate !== undefined) {
      request.input('lastAssessmentDate', sql.DateTime2, data.lastAssessmentDate);
      updates.push('lastAssessmentDate = @lastAssessmentDate');
    }
    if (data.lastAssessmentScore !== undefined) {
      request.input('lastAssessmentScore', sql.Decimal(5, 2), data.lastAssessmentScore);
      updates.push('lastAssessmentScore = @lastAssessmentScore');
    }
    if (data.lastAssessedBy !== undefined) {
      request.input('lastAssessedBy', sql.Int, data.lastAssessedBy);
      updates.push('lastAssessedBy = @lastAssessedBy');
    }
    if (data.nextAssessmentDate !== undefined) {
      request.input('nextAssessmentDate', sql.DateTime2, data.nextAssessmentDate);
      updates.push('nextAssessmentDate = @nextAssessmentDate');
    }
    if (data.updatedBy !== undefined) {
      request.input('updatedBy', sql.Int, data.updatedBy);
      updates.push('updatedBy = @updatedBy');
    }
    if (data.active !== undefined) {
      request.input('active', sql.Bit, data.active);
      updates.push('active = @active');
    }

    if (updates.length === 0) {
      return;
    }

    const query = `
      UPDATE UserWorkRoles 
      SET ${updates.join(', ')}
      WHERE id = @id
    `;

    await request.query(query);
  }

  /**
   * Soft delete (deactivate) a user work role assignment
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE UserWorkRoles 
        SET active = 0, status = 'inactive'
        WHERE id = @id
      `);
  }

  /**
   * Hard delete a user work role assignment
   */
  static async hardDelete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM UserWorkRoles WHERE id = @id');
  }

  /**
   * Get statistics for user work role assignments
   */
  static async getStatistics(filters?: UserWorkRoleFilters): Promise<UserWorkRoleStatistics> {
    const pool = await getConnection();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (filters) {
      if (filters.userId) {
        request.input('userId', sql.Int, filters.userId);
        whereClause += ' AND uwr.userId = @userId';
      }
      if (filters.workRoleId) {
        request.input('workRoleId', sql.Int, filters.workRoleId);
        whereClause += ' AND uwr.workRoleId = @workRoleId';
      }
      if (filters.departmentId) {
        request.input('departmentId', sql.Int, filters.departmentId);
        whereClause += ' AND wr.departmentId = @departmentId';
      }
      if (filters.category) {
        request.input('category', sql.NVarChar, filters.category);
        whereClause += ' AND wr.category = @category';
      }
    }

    const result = await request.query(`
      SELECT 
        COUNT(*) as totalAssignments,
        SUM(CASE WHEN uwr.status = 'active' THEN 1 ELSE 0 END) as activeAssignments,
        SUM(CASE WHEN uwr.expiryDate < GETDATE() THEN 1 ELSE 0 END) as expiredAssignments,
        SUM(CASE WHEN uwr.verified = 0 THEN 1 ELSE 0 END) as pendingVerification,
        SUM(CASE WHEN uwr.trainingRequired = 1 THEN 1 ELSE 0 END) as trainingRequired,
        SUM(CASE WHEN uwr.trainingCompleted = 1 THEN 1 ELSE 0 END) as trainingCompleted,
        SUM(CASE WHEN uwr.certificationRequired = 1 THEN 1 ELSE 0 END) as certificationRequired
      FROM UserWorkRoles uwr
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      ${whereClause}
    `);

    const stats = result.recordset[0];

    // Get by skill level
    const skillLevelResult = await request.query(`
      SELECT 
        sl.level as skillLevel,
        COUNT(*) as count
      FROM UserWorkRoles uwr
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      LEFT JOIN SkillLevels sl ON uwr.skillLevelId = sl.id
      ${whereClause}
      GROUP BY sl.level
      ORDER BY sl.level
    `);

    // Get by work role
    const workRoleResult = await request.query(`
      SELECT 
        wr.id as workRoleId,
        wr.name as workRoleName,
        COUNT(*) as count
      FROM UserWorkRoles uwr
      INNER JOIN WorkRoles wr ON uwr.workRoleId = wr.id
      ${whereClause}
      GROUP BY wr.id, wr.name
      ORDER BY count DESC
    `);

    return {
      totalAssignments: stats.totalAssignments || 0,
      activeAssignments: stats.activeAssignments || 0,
      expiredAssignments: stats.expiredAssignments || 0,
      pendingVerification: stats.pendingVerification || 0,
      trainingRequired: stats.trainingRequired || 0,
      trainingCompleted: stats.trainingCompleted || 0,
      certificationRequired: stats.certificationRequired || 0,
      bySkillLevel: skillLevelResult.recordset,
      byWorkRole: workRoleResult.recordset,
    };
  }
}
