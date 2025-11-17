import { getConnection, sql } from '../config/database';

export interface ChecklistQuestion {
  id?: number;
  templateId: number;
  questionNumber: string;
  questionText: string;
  category?: string;
  section?: string;
  expectedOutcome?: string;
  guidance?: string;
  questionType: 'yesno' | 'text' | 'rating' | 'checklist' | 'na';
  isMandatory?: boolean;
  allowNA?: boolean;
  requiresEvidence?: boolean;
  minRating?: number;
  maxRating?: number;
  passingScore?: number;
  displayOrder: number;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ChecklistQuestionModel {
  static async create(question: ChecklistQuestion): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('templateId', sql.Int, question.templateId)
      .input('questionNumber', sql.NVarChar, question.questionNumber)
      .input('questionText', sql.NVarChar, question.questionText)
      .input('category', sql.NVarChar, question.category)
      .input('section', sql.NVarChar, question.section)
      .input('expectedOutcome', sql.NVarChar, question.expectedOutcome)
      .input('guidance', sql.NVarChar, question.guidance)
      .input('questionType', sql.NVarChar, question.questionType)
      .input('isMandatory', sql.Bit, question.isMandatory !== false)
      .input('allowNA', sql.Bit, question.allowNA !== false)
      .input('requiresEvidence', sql.Bit, question.requiresEvidence || false)
      .input('minRating', sql.Int, question.minRating)
      .input('maxRating', sql.Int, question.maxRating)
      .input('passingScore', sql.Int, question.passingScore)
      .input('displayOrder', sql.Int, question.displayOrder)
      .input('createdBy', sql.Int, question.createdBy)
      .query(`
        INSERT INTO ChecklistQuestions (
          templateId, questionNumber, questionText, category, section,
          expectedOutcome, guidance, questionType, isMandatory, allowNA,
          requiresEvidence, minRating, maxRating, passingScore, displayOrder, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @templateId, @questionNumber, @questionText, @category, @section,
          @expectedOutcome, @guidance, @questionType, @isMandatory, @allowNA,
          @requiresEvidence, @minRating, @maxRating, @passingScore, @displayOrder, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<ChecklistQuestion | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ChecklistQuestions WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByTemplate(templateId: number): Promise<ChecklistQuestion[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('templateId', sql.Int, templateId)
      .query(`
        SELECT * FROM ChecklistQuestions 
        WHERE templateId = @templateId 
        ORDER BY displayOrder
      `);

    return result.recordset;
  }

  static async findByTemplateAndNumber(
    templateId: number,
    questionNumber: string
  ): Promise<ChecklistQuestion | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('templateId', sql.Int, templateId)
      .input('questionNumber', sql.NVarChar, questionNumber)
      .query(`
        SELECT * FROM ChecklistQuestions 
        WHERE templateId = @templateId AND questionNumber = @questionNumber
      `);

    return result.recordset[0] || null;
  }

  static async update(id: number, updates: Partial<ChecklistQuestion>): Promise<void> {
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
      await request.query(`UPDATE ChecklistQuestions SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ChecklistQuestions WHERE id = @id');
  }

  static async getMandatoryQuestions(templateId: number): Promise<ChecklistQuestion[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('templateId', sql.Int, templateId)
      .query(`
        SELECT * FROM ChecklistQuestions 
        WHERE templateId = @templateId AND isMandatory = 1
        ORDER BY displayOrder
      `);

    return result.recordset;
  }

  static async reorderQuestions(templateId: number, questionOrders: { id: number; displayOrder: number }[]): Promise<void> {
    const pool = await getConnection();
    
    for (const { id, displayOrder } of questionOrders) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('templateId', sql.Int, templateId)
        .input('displayOrder', sql.Int, displayOrder)
        .query(`
          UPDATE ChecklistQuestions 
          SET displayOrder = @displayOrder, updatedAt = GETDATE()
          WHERE id = @id AND templateId = @templateId
        `);
    }
  }
}
