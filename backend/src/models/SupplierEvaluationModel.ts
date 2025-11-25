import { getConnection, sql } from '../config/database';

export interface SupplierEvaluation {
  id?: number;
  supplierId: number;
  evaluationNumber: string;
  evaluationDate: Date;
  evaluationType: string;
  evaluationPeriodStart?: Date;
  evaluationPeriodEnd?: Date;
  qualityRating: number;
  onTimeDeliveryRate: number;
  complianceStatus: string;
  qualityScore?: number;
  deliveryScore?: number;
  communicationScore?: number;
  technicalCapabilityScore?: number;
  priceCompetitivenessScore?: number;
  overallScore?: number;
  overallRating?: string;
  approved?: boolean;
  defectRate?: number;
  returnRate?: number;
  leadTimeAdherence?: number;
  documentationAccuracy?: number;
  evaluationMethod?: string;
  evaluationScope?: string;
  evaluationCriteria?: string;
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  risks?: string;
  correctiveActionsRequired?: boolean;
  correctiveActions?: string;
  recommendations?: string;
  improvementPlan?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  nextEvaluationDate?: Date;
  evaluationStatus: string;
  decision?: string;
  decisionRationale?: string;
  evaluatedBy: number;
  reviewedBy?: number;
  reviewedDate?: Date;
  approvedBy?: number;
  approvedDate?: Date;
  notes?: string;
  attachments?: string;
  internalReference?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupplierEvaluationFilters {
  supplierId?: number;
  evaluationType?: string;
  complianceStatus?: string;
  evaluationStatus?: string;
  overallRating?: string;
  decision?: string;
  minOverallScore?: number;
  maxOverallScore?: number;
  minQualityRating?: number;
  evaluatedBy?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface SupplierEvaluationSortOptions {
  sortBy?: 'evaluationDate' | 'overallScore' | 'qualityRating' | 'onTimeDeliveryRate' | 'evaluationNumber';
  sortOrder?: 'ASC' | 'DESC';
}

export class SupplierEvaluationModel {
  /**
   * Calculate overall score based on individual scoring components
   * This is a weighted calculation that can be customized
   */
  private static calculateOverallScore(evaluation: SupplierEvaluation): number {
    // Default weights for scoring components
    const weights = {
      quality: 0.30,
      delivery: 0.25,
      communication: 0.15,
      technical: 0.15,
      price: 0.15,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Quality score from rating (1-5 scale converted to 0-100)
    if (evaluation.qualityRating) {
      const qualityScoreFromRating = ((evaluation.qualityRating - 1) / 4) * 100;
      totalScore += qualityScoreFromRating * weights.quality;
      totalWeight += weights.quality;
    }

    // Delivery score from on-time delivery rate
    if (evaluation.onTimeDeliveryRate !== undefined) {
      totalScore += evaluation.onTimeDeliveryRate * weights.delivery;
      totalWeight += weights.delivery;
    }

    // Optional scores - only include if provided
    if (evaluation.communicationScore !== undefined) {
      totalScore += evaluation.communicationScore * weights.communication;
      totalWeight += weights.communication;
    }

    if (evaluation.technicalCapabilityScore !== undefined) {
      totalScore += evaluation.technicalCapabilityScore * weights.technical;
      totalWeight += weights.technical;
    }

    if (evaluation.priceCompetitivenessScore !== undefined) {
      totalScore += evaluation.priceCompetitivenessScore * weights.price;
      totalWeight += weights.price;
    }

    // Return weighted average, or 0 if no scores available
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determine overall rating based on overall score
   */
  private static calculateOverallRating(overallScore: number): string {
    if (overallScore >= 90) return 'Excellent';
    if (overallScore >= 75) return 'Good';
    if (overallScore >= 60) return 'Satisfactory';
    if (overallScore >= 40) return 'Needs Improvement';
    return 'Unacceptable';
  }

  /**
   * Create a new supplier evaluation
   */
  static async create(evaluation: SupplierEvaluation): Promise<number> {
    const pool = await getConnection();

    // Calculate overall score if not provided
    const overallScore = evaluation.overallScore !== undefined 
      ? evaluation.overallScore 
      : this.calculateOverallScore(evaluation);

    // Determine overall rating if not provided
    const overallRating = evaluation.overallRating || this.calculateOverallRating(overallScore);

    const result = await pool
      .request()
      .input('supplierId', sql.Int, evaluation.supplierId)
      .input('evaluationNumber', sql.NVarChar, evaluation.evaluationNumber)
      .input('evaluationDate', sql.DateTime2, evaluation.evaluationDate)
      .input('evaluationType', sql.NVarChar, evaluation.evaluationType)
      .input('evaluationPeriodStart', sql.DateTime2, evaluation.evaluationPeriodStart || null)
      .input('evaluationPeriodEnd', sql.DateTime2, evaluation.evaluationPeriodEnd || null)
      .input('qualityRating', sql.Int, evaluation.qualityRating)
      .input('onTimeDeliveryRate', sql.Decimal(5, 2), evaluation.onTimeDeliveryRate)
      .input('complianceStatus', sql.NVarChar, evaluation.complianceStatus)
      .input('qualityScore', sql.Decimal(5, 2), evaluation.qualityScore || null)
      .input('deliveryScore', sql.Decimal(5, 2), evaluation.deliveryScore || null)
      .input('communicationScore', sql.Decimal(5, 2), evaluation.communicationScore || null)
      .input('technicalCapabilityScore', sql.Decimal(5, 2), evaluation.technicalCapabilityScore || null)
      .input('priceCompetitivenessScore', sql.Decimal(5, 2), evaluation.priceCompetitivenessScore || null)
      .input('overallScore', sql.Decimal(5, 2), overallScore)
      .input('overallRating', sql.NVarChar, overallRating)
      .input('approved', sql.Bit, evaluation.approved || false)
      .input('defectRate', sql.Decimal(5, 2), evaluation.defectRate || null)
      .input('returnRate', sql.Decimal(5, 2), evaluation.returnRate || null)
      .input('leadTimeAdherence', sql.Decimal(5, 2), evaluation.leadTimeAdherence || null)
      .input('documentationAccuracy', sql.Decimal(5, 2), evaluation.documentationAccuracy || null)
      .input('evaluationMethod', sql.NVarChar, evaluation.evaluationMethod || null)
      .input('evaluationScope', sql.NVarChar, evaluation.evaluationScope || null)
      .input('evaluationCriteria', sql.NVarChar(sql.MAX), evaluation.evaluationCriteria || null)
      .input('strengths', sql.NVarChar(sql.MAX), evaluation.strengths || null)
      .input('weaknesses', sql.NVarChar(sql.MAX), evaluation.weaknesses || null)
      .input('opportunities', sql.NVarChar(sql.MAX), evaluation.opportunities || null)
      .input('risks', sql.NVarChar(sql.MAX), evaluation.risks || null)
      .input('correctiveActionsRequired', sql.Bit, evaluation.correctiveActionsRequired || false)
      .input('correctiveActions', sql.NVarChar(sql.MAX), evaluation.correctiveActions || null)
      .input('recommendations', sql.NVarChar(sql.MAX), evaluation.recommendations || null)
      .input('improvementPlan', sql.NVarChar(sql.MAX), evaluation.improvementPlan || null)
      .input('followUpRequired', sql.Bit, evaluation.followUpRequired || false)
      .input('followUpDate', sql.DateTime2, evaluation.followUpDate || null)
      .input('nextEvaluationDate', sql.DateTime2, evaluation.nextEvaluationDate || null)
      .input('evaluationStatus', sql.NVarChar, evaluation.evaluationStatus)
      .input('decision', sql.NVarChar, evaluation.decision || null)
      .input('decisionRationale', sql.NVarChar(sql.MAX), evaluation.decisionRationale || null)
      .input('evaluatedBy', sql.Int, evaluation.evaluatedBy)
      .input('reviewedBy', sql.Int, evaluation.reviewedBy || null)
      .input('reviewedDate', sql.DateTime2, evaluation.reviewedDate || null)
      .input('approvedBy', sql.Int, evaluation.approvedBy || null)
      .input('approvedDate', sql.DateTime2, evaluation.approvedDate || null)
      .input('notes', sql.NVarChar(sql.MAX), evaluation.notes || null)
      .input('attachments', sql.NVarChar(sql.MAX), evaluation.attachments || null)
      .input('internalReference', sql.NVarChar, evaluation.internalReference || null)
      .input('createdBy', sql.Int, evaluation.createdBy)
      .query(`
        INSERT INTO SupplierEvaluations (
          supplierId, evaluationNumber, evaluationDate, evaluationType,
          evaluationPeriodStart, evaluationPeriodEnd,
          qualityRating, onTimeDeliveryRate, complianceStatus,
          qualityScore, deliveryScore, communicationScore,
          technicalCapabilityScore, priceCompetitivenessScore,
          overallScore, overallRating, approved,
          defectRate, returnRate, leadTimeAdherence, documentationAccuracy,
          evaluationMethod, evaluationScope, evaluationCriteria,
          strengths, weaknesses, opportunities, risks,
          correctiveActionsRequired, correctiveActions, recommendations, improvementPlan,
          followUpRequired, followUpDate, nextEvaluationDate,
          evaluationStatus, decision, decisionRationale,
          evaluatedBy, reviewedBy, reviewedDate, approvedBy, approvedDate,
          notes, attachments, internalReference, createdBy
        )
        VALUES (
          @supplierId, @evaluationNumber, @evaluationDate, @evaluationType,
          @evaluationPeriodStart, @evaluationPeriodEnd,
          @qualityRating, @onTimeDeliveryRate, @complianceStatus,
          @qualityScore, @deliveryScore, @communicationScore,
          @technicalCapabilityScore, @priceCompetitivenessScore,
          @overallScore, @overallRating, @approved,
          @defectRate, @returnRate, @leadTimeAdherence, @documentationAccuracy,
          @evaluationMethod, @evaluationScope, @evaluationCriteria,
          @strengths, @weaknesses, @opportunities, @risks,
          @correctiveActionsRequired, @correctiveActions, @recommendations, @improvementPlan,
          @followUpRequired, @followUpDate, @nextEvaluationDate,
          @evaluationStatus, @decision, @decisionRationale,
          @evaluatedBy, @reviewedBy, @reviewedDate, @approvedBy, @approvedDate,
          @notes, @attachments, @internalReference, @createdBy
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    return result.recordset[0].id;
  }

  /**
   * Get all supplier evaluations with filtering and sorting
   */
  static async findAll(
    filters?: SupplierEvaluationFilters,
    sortOptions?: SupplierEvaluationSortOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: SupplierEvaluation[]; total: number; page: number; limit: number }> {
    const pool = await getConnection();
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const request = pool.request();

    if (filters?.supplierId) {
      conditions.push('supplierId = @supplierId');
      request.input('supplierId', sql.Int, filters.supplierId);
    }

    if (filters?.evaluationType) {
      conditions.push('evaluationType = @evaluationType');
      request.input('evaluationType', sql.NVarChar, filters.evaluationType);
    }

    if (filters?.complianceStatus) {
      conditions.push('complianceStatus = @complianceStatus');
      request.input('complianceStatus', sql.NVarChar, filters.complianceStatus);
    }

    if (filters?.evaluationStatus) {
      conditions.push('evaluationStatus = @evaluationStatus');
      request.input('evaluationStatus', sql.NVarChar, filters.evaluationStatus);
    }

    if (filters?.overallRating) {
      conditions.push('overallRating = @overallRating');
      request.input('overallRating', sql.NVarChar, filters.overallRating);
    }

    if (filters?.decision) {
      conditions.push('decision = @decision');
      request.input('decision', sql.NVarChar, filters.decision);
    }

    if (filters?.minOverallScore !== undefined) {
      conditions.push('overallScore >= @minOverallScore');
      request.input('minOverallScore', sql.Decimal(5, 2), filters.minOverallScore);
    }

    if (filters?.maxOverallScore !== undefined) {
      conditions.push('overallScore <= @maxOverallScore');
      request.input('maxOverallScore', sql.Decimal(5, 2), filters.maxOverallScore);
    }

    if (filters?.minQualityRating !== undefined) {
      conditions.push('qualityRating >= @minQualityRating');
      request.input('minQualityRating', sql.Int, filters.minQualityRating);
    }

    if (filters?.evaluatedBy) {
      conditions.push('evaluatedBy = @evaluatedBy');
      request.input('evaluatedBy', sql.Int, filters.evaluatedBy);
    }

    if (filters?.startDate) {
      conditions.push('evaluationDate >= @startDate');
      request.input('startDate', sql.DateTime2, filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push('evaluationDate <= @endDate');
      request.input('endDate', sql.DateTime2, filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const sortBy = sortOptions?.sortBy || 'evaluationDate';
    const sortOrder = sortOptions?.sortOrder || 'DESC';
    const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total
      FROM SupplierEvaluations
      ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated results
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT *
      FROM SupplierEvaluations
      ${whereClause}
      ${orderByClause}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset,
      total,
      page,
      limit,
    };
  }

  /**
   * Get supplier evaluation by ID
   */
  static async findById(id: number): Promise<SupplierEvaluation | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM SupplierEvaluations WHERE id = @id');

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Get supplier evaluation by evaluation number
   */
  static async findByEvaluationNumber(evaluationNumber: string): Promise<SupplierEvaluation | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('evaluationNumber', sql.NVarChar, evaluationNumber)
      .query('SELECT * FROM SupplierEvaluations WHERE evaluationNumber = @evaluationNumber');

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Get evaluations for a specific supplier
   */
  static async findBySupplier(supplierId: number): Promise<SupplierEvaluation[]> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('supplierId', sql.Int, supplierId)
      .query(`
        SELECT * FROM SupplierEvaluations 
        WHERE supplierId = @supplierId 
        ORDER BY evaluationDate DESC
      `);

    return result.recordset;
  }

  /**
   * Update supplier evaluation
   */
  static async update(id: number, evaluation: Partial<SupplierEvaluation>): Promise<void> {
    const pool = await getConnection();

    // Recalculate overall score if scoring components are updated
    let overallScore = evaluation.overallScore;
    let overallRating = evaluation.overallRating;

    if (
      evaluation.qualityRating !== undefined ||
      evaluation.onTimeDeliveryRate !== undefined ||
      evaluation.communicationScore !== undefined ||
      evaluation.technicalCapabilityScore !== undefined ||
      evaluation.priceCompetitivenessScore !== undefined
    ) {
      // Get current evaluation for missing fields
      const current = await this.findById(id);
      if (current) {
        const updatedEvaluation = { ...current, ...evaluation };
        overallScore = this.calculateOverallScore(updatedEvaluation);
        overallRating = this.calculateOverallRating(overallScore);
      }
    }

    const setClauses: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    // Build dynamic SET clause
    Object.keys(evaluation).forEach((key) => {
      if (key !== 'id' && key !== 'createdBy' && key !== 'createdAt') {
        const value = (evaluation as any)[key];
        setClauses.push(`${key} = @${key}`);
        
        // Determine SQL type based on key
        if (key.includes('Date') || key.includes('At')) {
          request.input(key, sql.DateTime2, value);
        } else if (key.includes('Rate') || key.includes('Score') || key.includes('Adherence') || key.includes('Accuracy')) {
          request.input(key, sql.Decimal(5, 2), value);
        } else if (key.includes('Rating') || key.endsWith('By') || key === 'supplierId') {
          request.input(key, sql.Int, value);
        } else if (key === 'approved' || key === 'correctiveActionsRequired' || key === 'followUpRequired') {
          request.input(key, sql.Bit, value);
        } else if (key === 'evaluationCriteria' || key === 'strengths' || key === 'weaknesses' || 
                   key === 'opportunities' || key === 'risks' || key === 'correctiveActions' ||
                   key === 'recommendations' || key === 'improvementPlan' || key === 'decisionRationale' ||
                   key === 'notes' || key === 'attachments') {
          request.input(key, sql.NVarChar(sql.MAX), value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
      }
    });

    // Add calculated fields
    if (overallScore !== undefined) {
      setClauses.push('overallScore = @overallScore');
      request.input('overallScore', sql.Decimal(5, 2), overallScore);
    }

    if (overallRating !== undefined) {
      setClauses.push('overallRating = @overallRating');
      request.input('overallRating', sql.NVarChar, overallRating);
    }

    setClauses.push('updatedAt = GETDATE()');

    if (setClauses.length > 0) {
      await request.query(`
        UPDATE SupplierEvaluations
        SET ${setClauses.join(', ')}
        WHERE id = @id
      `);
    }
  }

  /**
   * Update evaluation status
   */
  static async updateStatus(
    id: number, 
    status: string, 
    userId?: number
  ): Promise<void> {
    const pool = await getConnection();

    const request = pool
      .request()
      .input('id', sql.Int, id)
      .input('evaluationStatus', sql.NVarChar, status);

    let additionalFields = '';
    
    if (status === 'approved' && userId) {
      additionalFields = ', approvedBy = @userId, approvedDate = GETDATE()';
      request.input('userId', sql.Int, userId);
    }

    await request.query(`
      UPDATE SupplierEvaluations
      SET evaluationStatus = @evaluationStatus${additionalFields}, updatedAt = GETDATE()
      WHERE id = @id
    `);
  }

  /**
   * Delete supplier evaluation (soft delete by changing status)
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();

    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE SupplierEvaluations
        SET evaluationStatus = 'rejected', updatedAt = GETDATE()
        WHERE id = @id
      `);
  }

  /**
   * Get supplier evaluation statistics
   */
  static async getStatistics(supplierId?: number): Promise<any> {
    const pool = await getConnection();
    const request = pool.request();

    let whereClause = '';
    if (supplierId) {
      whereClause = 'WHERE supplierId = @supplierId';
      request.input('supplierId', sql.Int, supplierId);
    }

    const result = await request.query(`
      SELECT 
        COUNT(*) as totalEvaluations,
        AVG(CAST(qualityRating as FLOAT)) as avgQualityRating,
        AVG(onTimeDeliveryRate) as avgOnTimeDeliveryRate,
        AVG(overallScore) as avgOverallScore,
        SUM(CASE WHEN complianceStatus = 'Compliant' THEN 1 ELSE 0 END) as compliantCount,
        SUM(CASE WHEN complianceStatus = 'Non-Compliant' THEN 1 ELSE 0 END) as nonCompliantCount,
        SUM(CASE WHEN overallRating = 'Excellent' THEN 1 ELSE 0 END) as excellentCount,
        SUM(CASE WHEN overallRating = 'Good' THEN 1 ELSE 0 END) as goodCount,
        SUM(CASE WHEN overallRating = 'Satisfactory' THEN 1 ELSE 0 END) as satisfactoryCount,
        SUM(CASE WHEN overallRating = 'Needs Improvement' THEN 1 ELSE 0 END) as needsImprovementCount,
        SUM(CASE WHEN overallRating = 'Unacceptable' THEN 1 ELSE 0 END) as unacceptableCount,
        SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as approvedCount
      FROM SupplierEvaluations
      ${whereClause}
    `);

    return result.recordset[0];
  }

  /**
   * Get dashboard data with supplier performance summary
   * Includes supplier details, latest evaluations, and risk levels
   */
  static async getDashboardData(): Promise<any> {
    const pool = await getConnection();

    // Get suppliers with their latest evaluation and performance metrics
    const suppliersResult = await pool.request().query(`
      SELECT 
        s.id,
        s.name,
        s.supplierNumber,
        s.category,
        s.riskLevel,
        s.performanceScore,
        s.qualityGrade,
        s.rating,
        s.approvalStatus,
        s.lastEvaluationDate,
        s.onTimeDeliveryRate,
        s.qualityRejectRate,
        s.criticalSupplier,
        s.preferredSupplier,
        -- Get latest evaluation details
        (
          SELECT TOP 1 se.id
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          ORDER BY se.evaluationDate DESC
        ) as latestEvaluationId,
        (
          SELECT TOP 1 se.overallScore
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          ORDER BY se.evaluationDate DESC
        ) as latestOverallScore,
        (
          SELECT TOP 1 se.overallRating
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          ORDER BY se.evaluationDate DESC
        ) as latestOverallRating,
        (
          SELECT TOP 1 se.evaluationDate
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          ORDER BY se.evaluationDate DESC
        ) as latestEvaluationDate,
        (
          SELECT TOP 1 se.complianceStatus
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          ORDER BY se.evaluationDate DESC
        ) as latestComplianceStatus,
        -- Count total evaluations
        (
          SELECT COUNT(*)
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
        ) as totalEvaluations,
        -- Count non-compliant evaluations
        (
          SELECT COUNT(*)
          FROM SupplierEvaluations se
          WHERE se.supplierId = s.id
          AND se.complianceStatus = 'Non-Compliant'
        ) as nonCompliantEvaluations
      FROM Suppliers s
      WHERE s.active = 1 AND s.approvalStatus = 'approved'
      ORDER BY s.performanceScore DESC
    `);

    // Get recent evaluations across all suppliers
    const recentEvaluationsResult = await pool.request().query(`
      SELECT TOP 10
        se.id,
        se.evaluationNumber,
        se.supplierId,
        s.name as supplierName,
        s.supplierNumber,
        se.evaluationDate,
        se.evaluationType,
        se.overallScore,
        se.overallRating,
        se.qualityRating,
        se.onTimeDeliveryRate,
        se.complianceStatus,
        se.evaluationStatus
      FROM SupplierEvaluations se
      JOIN Suppliers s ON se.supplierId = s.id
      ORDER BY se.evaluationDate DESC
    `);

    // Get overall statistics
    const statisticsResult = await pool.request().query(`
      SELECT 
        COUNT(DISTINCT s.id) as totalSuppliers,
        COUNT(se.id) as totalEvaluations,
        AVG(CAST(s.rating as FLOAT)) as avgQualityRating,
        AVG(s.onTimeDeliveryRate) as avgOnTimeDeliveryRate,
        SUM(CASE WHEN se.complianceStatus = 'Compliant' THEN 1 ELSE 0 END) as compliantCount,
        SUM(CASE WHEN se.complianceStatus = 'Non-Compliant' THEN 1 ELSE 0 END) as nonCompliantCount,
        SUM(CASE WHEN s.riskLevel = 'Critical' THEN 1 ELSE 0 END) as criticalRiskCount,
        SUM(CASE WHEN s.riskLevel = 'High' THEN 1 ELSE 0 END) as highRiskCount,
        SUM(CASE WHEN s.riskLevel = 'Medium' THEN 1 ELSE 0 END) as mediumRiskCount,
        SUM(CASE WHEN s.riskLevel = 'Low' THEN 1 ELSE 0 END) as lowRiskCount,
        SUM(CASE WHEN s.criticalSupplier = 1 THEN 1 ELSE 0 END) as criticalSuppliersCount,
        SUM(CASE WHEN s.preferredSupplier = 1 THEN 1 ELSE 0 END) as preferredSuppliersCount
      FROM Suppliers s
      LEFT JOIN SupplierEvaluations se ON s.id = se.supplierId
      WHERE s.active = 1 AND s.approvalStatus = 'approved'
    `);

    // Get risk level breakdown
    const riskBreakdownResult = await pool.request().query(`
      SELECT 
        riskLevel,
        COUNT(*) as count
      FROM Suppliers
      WHERE active = 1 AND approvalStatus = 'approved' AND riskLevel IS NOT NULL
      GROUP BY riskLevel
      ORDER BY 
        CASE riskLevel
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5
        END
    `);

    // Get compliance trend (last 6 months)
    const complianceTrendResult = await pool.request().query(`
      SELECT 
        FORMAT(evaluationDate, 'yyyy-MM') as month,
        COUNT(*) as totalEvaluations,
        SUM(CASE WHEN complianceStatus = 'Compliant' THEN 1 ELSE 0 END) as compliant,
        SUM(CASE WHEN complianceStatus = 'Non-Compliant' THEN 1 ELSE 0 END) as nonCompliant
      FROM SupplierEvaluations
      WHERE evaluationDate >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(evaluationDate, 'yyyy-MM')
      ORDER BY month DESC
    `);

    return {
      suppliers: suppliersResult.recordset,
      recentEvaluations: recentEvaluationsResult.recordset,
      statistics: statisticsResult.recordset[0],
      riskBreakdown: riskBreakdownResult.recordset,
      complianceTrend: complianceTrendResult.recordset,
    };
  }
}
