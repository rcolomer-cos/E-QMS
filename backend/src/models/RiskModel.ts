import { getConnection, sql } from '../config/database';

export interface Risk {
  id?: number;
  riskNumber: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  likelihood: number;
  impact: number;
  riskScore?: number;
  riskLevel?: string;
  mitigationStrategy?: string;
  mitigationActions?: string;
  contingencyPlan?: string;
  riskOwner: number;
  department?: string;
  process?: string;
  status: string;
  identifiedDate: Date;
  reviewDate?: Date;
  nextReviewDate?: Date;
  reviewFrequency?: number;
  closedDate?: Date;
  residualLikelihood?: number;
  residualImpact?: number;
  residualRiskScore?: number;
  affectedStakeholders?: string;
  regulatoryImplications?: string;
  relatedRisks?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastReviewedBy?: number;
}

export interface RiskFilters {
  status?: string;
  category?: string;
  riskLevel?: string;
  department?: string;
  riskOwner?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
}

export interface RiskSortOptions {
  sortBy?: 'riskScore' | 'residualRiskScore' | 'identifiedDate' | 'nextReviewDate' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export class RiskModel {
  /**
   * Calculate risk level based on risk score
   */
  private static calculateRiskLevel(riskScore: number): string {
    if (riskScore >= 20) return 'critical';
    if (riskScore >= 12) return 'high';
    if (riskScore >= 6) return 'medium';
    return 'low';
  }

  /**
   * Create a new risk entry
   */
  static async create(risk: Risk): Promise<number> {
    const pool = await getConnection();

    // Calculate risk level based on likelihood and impact
    const riskScore = risk.likelihood * risk.impact;
    const riskLevel = this.calculateRiskLevel(riskScore);

    const result = await pool
      .request()
      .input('riskNumber', sql.NVarChar, risk.riskNumber)
      .input('title', sql.NVarChar, risk.title)
      .input('description', sql.NVarChar, risk.description)
      .input('category', sql.NVarChar, risk.category)
      .input('source', sql.NVarChar, risk.source || null)
      .input('likelihood', sql.Int, risk.likelihood)
      .input('impact', sql.Int, risk.impact)
      .input('riskLevel', sql.NVarChar, riskLevel)
      .input('mitigationStrategy', sql.NVarChar, risk.mitigationStrategy || null)
      .input('mitigationActions', sql.NVarChar, risk.mitigationActions || null)
      .input('contingencyPlan', sql.NVarChar, risk.contingencyPlan || null)
      .input('riskOwner', sql.Int, risk.riskOwner)
      .input('department', sql.NVarChar, risk.department || null)
      .input('process', sql.NVarChar, risk.process || null)
      .input('status', sql.NVarChar, risk.status)
      .input('identifiedDate', sql.DateTime2, risk.identifiedDate)
      .input('reviewDate', sql.DateTime2, risk.reviewDate || null)
      .input('nextReviewDate', sql.DateTime2, risk.nextReviewDate || null)
      .input('reviewFrequency', sql.Int, risk.reviewFrequency || null)
      .input('residualLikelihood', sql.Int, risk.residualLikelihood || null)
      .input('residualImpact', sql.Int, risk.residualImpact || null)
      .input('affectedStakeholders', sql.NVarChar, risk.affectedStakeholders || null)
      .input('regulatoryImplications', sql.NVarChar, risk.regulatoryImplications || null)
      .input('relatedRisks', sql.NVarChar, risk.relatedRisks || null)
      .input('createdBy', sql.Int, risk.createdBy)
      .query(`
        INSERT INTO Risks (
          riskNumber, title, description, category, source,
          likelihood, impact, riskLevel,
          mitigationStrategy, mitigationActions, contingencyPlan,
          riskOwner, department, process, status,
          identifiedDate, reviewDate, nextReviewDate, reviewFrequency,
          residualLikelihood, residualImpact,
          affectedStakeholders, regulatoryImplications, relatedRisks,
          createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @riskNumber, @title, @description, @category, @source,
          @likelihood, @impact, @riskLevel,
          @mitigationStrategy, @mitigationActions, @contingencyPlan,
          @riskOwner, @department, @process, @status,
          @identifiedDate, @reviewDate, @nextReviewDate, @reviewFrequency,
          @residualLikelihood, @residualImpact,
          @affectedStakeholders, @regulatoryImplications, @relatedRisks,
          @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Find risk by ID
   */
  static async findById(id: number): Promise<Risk | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Risks WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Find all risks with optional filters and sorting
   */
  static async findAll(
    filters?: RiskFilters,
    sortOptions?: RiskSortOptions
  ): Promise<Risk[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Risks WHERE 1=1';

    // Apply filters
    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }
    if (filters?.riskLevel) {
      request.input('riskLevel', sql.NVarChar, filters.riskLevel);
      query += ' AND riskLevel = @riskLevel';
    }
    if (filters?.department) {
      request.input('department', sql.NVarChar, filters.department);
      query += ' AND department = @department';
    }
    if (filters?.riskOwner) {
      request.input('riskOwner', sql.Int, filters.riskOwner);
      query += ' AND riskOwner = @riskOwner';
    }
    if (filters?.minRiskScore !== undefined) {
      request.input('minRiskScore', sql.Int, filters.minRiskScore);
      query += ' AND riskScore >= @minRiskScore';
    }
    if (filters?.maxRiskScore !== undefined) {
      request.input('maxRiskScore', sql.Int, filters.maxRiskScore);
      query += ' AND riskScore <= @maxRiskScore';
    }

    // Apply sorting
    const sortBy = sortOptions?.sortBy || 'riskScore';
    const sortOrder = sortOptions?.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Update a risk entry
   */
  static async update(id: number, updates: Partial<Risk>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    
    // Recalculate risk level if likelihood or impact is being updated
    if (updates.likelihood !== undefined || updates.impact !== undefined) {
      const currentRisk = await this.findById(id);
      if (currentRisk) {
        const likelihood = updates.likelihood ?? currentRisk.likelihood;
        const impact = updates.impact ?? currentRisk.impact;
        const riskScore = likelihood * impact;
        const riskLevel = this.calculateRiskLevel(riskScore);
        
        // Add the calculated risk level to the updates
        updates.riskLevel = riskLevel;
      }
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'riskScore' && key !== 'residualRiskScore') {
        request.input(key, value);
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Risks SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  /**
   * Delete a risk entry
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Risks WHERE id = @id');
  }

  /**
   * Get risk statistics
   */
  static async getStatistics(): Promise<{
    totalRisks: number;
    byStatus: Record<string, number>;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const pool = await getConnection();
    
    const totalResult = await pool.request().query('SELECT COUNT(*) as count FROM Risks');
    const statusResult = await pool.request().query('SELECT status, COUNT(*) as count FROM Risks GROUP BY status');
    const levelResult = await pool.request().query('SELECT riskLevel, COUNT(*) as count FROM Risks GROUP BY riskLevel');
    const categoryResult = await pool.request().query('SELECT category, COUNT(*) as count FROM Risks GROUP BY category');

    const byStatus: Record<string, number> = {};
    statusResult.recordset.forEach((row: { status: string; count: number }) => {
      byStatus[row.status] = row.count;
    });

    const byLevel: Record<string, number> = {};
    levelResult.recordset.forEach((row: { riskLevel: string; count: number }) => {
      byLevel[row.riskLevel] = row.count;
    });

    const byCategory: Record<string, number> = {};
    categoryResult.recordset.forEach((row: { category: string; count: number }) => {
      byCategory[row.category] = row.count;
    });

    return {
      totalRisks: totalResult.recordset[0].count,
      byStatus,
      byLevel,
      byCategory,
    };
  }
}
