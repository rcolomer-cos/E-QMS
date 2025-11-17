import { getConnection, sql } from '../config/database';

export interface ChecklistResponse {
  id?: number;
  auditId: number;
  templateId: number;
  questionId: number;
  responseType: 'yesno' | 'text' | 'rating' | 'na';
  yesNoResponse?: boolean;
  textResponse?: string;
  ratingResponse?: number;
  notApplicable?: boolean;
  isCompliant?: boolean;
  requiresAction?: boolean;
  findings?: string;
  evidence?: string;
  recommendations?: string;
  respondedBy: number;
  respondedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChecklistResponseWithDetails extends ChecklistResponse {
  questionText?: string;
  questionNumber?: string;
  expectedOutcome?: string;
  templateName?: string;
  respondedByName?: string;
  reviewedByName?: string;
}

export class ChecklistResponseModel {
  static async create(response: ChecklistResponse): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('auditId', sql.Int, response.auditId)
      .input('templateId', sql.Int, response.templateId)
      .input('questionId', sql.Int, response.questionId)
      .input('responseType', sql.NVarChar, response.responseType)
      .input('yesNoResponse', sql.Bit, response.yesNoResponse)
      .input('textResponse', sql.NVarChar, response.textResponse)
      .input('ratingResponse', sql.Int, response.ratingResponse)
      .input('notApplicable', sql.Bit, response.notApplicable || false)
      .input('isCompliant', sql.Bit, response.isCompliant)
      .input('requiresAction', sql.Bit, response.requiresAction || false)
      .input('findings', sql.NVarChar, response.findings)
      .input('evidence', sql.NVarChar, response.evidence)
      .input('recommendations', sql.NVarChar, response.recommendations)
      .input('respondedBy', sql.Int, response.respondedBy)
      .query(`
        INSERT INTO ChecklistResponses (
          auditId, templateId, questionId, responseType, yesNoResponse,
          textResponse, ratingResponse, notApplicable, isCompliant, requiresAction,
          findings, evidence, recommendations, respondedBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @auditId, @templateId, @questionId, @responseType, @yesNoResponse,
          @textResponse, @ratingResponse, @notApplicable, @isCompliant, @requiresAction,
          @findings, @evidence, @recommendations, @respondedBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<ChecklistResponse | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ChecklistResponses WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByAudit(auditId: number): Promise<ChecklistResponseWithDetails[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query(`
        SELECT 
          cr.*,
          cq.questionText,
          cq.questionNumber,
          cq.expectedOutcome,
          ct.templateName,
          CONCAT(u1.firstName, ' ', u1.lastName) as respondedByName,
          CONCAT(u2.firstName, ' ', u2.lastName) as reviewedByName
        FROM ChecklistResponses cr
        INNER JOIN ChecklistQuestions cq ON cr.questionId = cq.id
        INNER JOIN ChecklistTemplates ct ON cr.templateId = ct.id
        INNER JOIN Users u1 ON cr.respondedBy = u1.id
        LEFT JOIN Users u2 ON cr.reviewedBy = u2.id
        WHERE cr.auditId = @auditId
        ORDER BY cq.displayOrder
      `);

    return result.recordset;
  }

  static async findByAuditAndTemplate(
    auditId: number,
    templateId: number
  ): Promise<ChecklistResponseWithDetails[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .input('templateId', sql.Int, templateId)
      .query(`
        SELECT 
          cr.*,
          cq.questionText,
          cq.questionNumber,
          cq.expectedOutcome,
          ct.templateName,
          CONCAT(u1.firstName, ' ', u1.lastName) as respondedByName,
          CONCAT(u2.firstName, ' ', u2.lastName) as reviewedByName
        FROM ChecklistResponses cr
        INNER JOIN ChecklistQuestions cq ON cr.questionId = cq.id
        INNER JOIN ChecklistTemplates ct ON cr.templateId = ct.id
        INNER JOIN Users u1 ON cr.respondedBy = u1.id
        LEFT JOIN Users u2 ON cr.reviewedBy = u2.id
        WHERE cr.auditId = @auditId AND cr.templateId = @templateId
        ORDER BY cq.displayOrder
      `);

    return result.recordset;
  }

  static async findByQuestion(auditId: number, questionId: number): Promise<ChecklistResponse | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .input('questionId', sql.Int, questionId)
      .query(`
        SELECT * FROM ChecklistResponses 
        WHERE auditId = @auditId AND questionId = @questionId
      `);

    return result.recordset[0] || null;
  }

  static async update(id: number, updates: Partial<ChecklistResponse>): Promise<void> {
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
      await request.query(`UPDATE ChecklistResponses SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ChecklistResponses WHERE id = @id');
  }

  static async getNonCompliantResponses(auditId: number): Promise<ChecklistResponseWithDetails[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query(`
        SELECT 
          cr.*,
          cq.questionText,
          cq.questionNumber,
          cq.expectedOutcome,
          ct.templateName,
          CONCAT(u1.firstName, ' ', u1.lastName) as respondedByName
        FROM ChecklistResponses cr
        INNER JOIN ChecklistQuestions cq ON cr.questionId = cq.id
        INNER JOIN ChecklistTemplates ct ON cr.templateId = ct.id
        INNER JOIN Users u1 ON cr.respondedBy = u1.id
        WHERE cr.auditId = @auditId AND cr.isCompliant = 0
        ORDER BY cq.displayOrder
      `);

    return result.recordset;
  }

  static async getResponsesRequiringAction(auditId: number): Promise<ChecklistResponseWithDetails[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query(`
        SELECT 
          cr.*,
          cq.questionText,
          cq.questionNumber,
          cq.expectedOutcome,
          ct.templateName,
          CONCAT(u1.firstName, ' ', u1.lastName) as respondedByName
        FROM ChecklistResponses cr
        INNER JOIN ChecklistQuestions cq ON cr.questionId = cq.id
        INNER JOIN ChecklistTemplates ct ON cr.templateId = ct.id
        INNER JOIN Users u1 ON cr.respondedBy = u1.id
        WHERE cr.auditId = @auditId AND cr.requiresAction = 1
        ORDER BY cq.displayOrder
      `);

    return result.recordset;
  }

  static async getAuditCompletionStats(auditId: number): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    compliantResponses: number;
    nonCompliantResponses: number;
    notApplicable: number;
    requiresAction: number;
    completionPercentage: number;
  }> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('auditId', sql.Int, auditId)
      .query(`
        SELECT 
          COUNT(DISTINCT cq.id) as totalQuestions,
          COUNT(DISTINCT cr.questionId) as answeredQuestions,
          SUM(CASE WHEN cr.isCompliant = 1 THEN 1 ELSE 0 END) as compliantResponses,
          SUM(CASE WHEN cr.isCompliant = 0 THEN 1 ELSE 0 END) as nonCompliantResponses,
          SUM(CASE WHEN cr.notApplicable = 1 THEN 1 ELSE 0 END) as notApplicable,
          SUM(CASE WHEN cr.requiresAction = 1 THEN 1 ELSE 0 END) as requiresAction
        FROM ChecklistQuestions cq
        LEFT JOIN ChecklistResponses cr ON cq.id = cr.questionId AND cr.auditId = @auditId
        WHERE cq.templateId IN (
          SELECT DISTINCT templateId FROM ChecklistResponses WHERE auditId = @auditId
        )
      `);

    const stats = result.recordset[0];
    const completionPercentage = stats.totalQuestions > 0
      ? Math.round((stats.answeredQuestions / stats.totalQuestions) * 100)
      : 0;

    return {
      totalQuestions: stats.totalQuestions || 0,
      answeredQuestions: stats.answeredQuestions || 0,
      compliantResponses: stats.compliantResponses || 0,
      nonCompliantResponses: stats.nonCompliantResponses || 0,
      notApplicable: stats.notApplicable || 0,
      requiresAction: stats.requiresAction || 0,
      completionPercentage,
    };
  }
}
