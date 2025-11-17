import { getConnection, sql } from '../config/database';
import { ChecklistTemplateStatus } from '../types';

export interface ChecklistTemplate {
  id?: number;
  templateCode: string;
  templateName: string;
  description?: string;
  category: string;
  auditType?: string;
  status: ChecklistTemplateStatus;
  version: string;
  isStandard?: boolean;
  requiresCompletion?: boolean;
  allowCustomQuestions?: boolean;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ChecklistTemplateModel {
  static async create(template: ChecklistTemplate): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('templateCode', sql.NVarChar, template.templateCode)
      .input('templateName', sql.NVarChar, template.templateName)
      .input('description', sql.NVarChar, template.description)
      .input('category', sql.NVarChar, template.category)
      .input('auditType', sql.NVarChar, template.auditType)
      .input('status', sql.NVarChar, template.status)
      .input('version', sql.NVarChar, template.version || '1.0')
      .input('isStandard', sql.Bit, template.isStandard || false)
      .input('requiresCompletion', sql.Bit, template.requiresCompletion !== false)
      .input('allowCustomQuestions', sql.Bit, template.allowCustomQuestions || false)
      .input('createdBy', sql.Int, template.createdBy)
      .query(`
        INSERT INTO ChecklistTemplates (
          templateCode, templateName, description, category, auditType, 
          status, version, isStandard, requiresCompletion, allowCustomQuestions, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @templateCode, @templateName, @description, @category, @auditType, 
          @status, @version, @isStandard, @requiresCompletion, @allowCustomQuestions, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<ChecklistTemplate | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ChecklistTemplates WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByCode(templateCode: string): Promise<ChecklistTemplate | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('templateCode', sql.NVarChar, templateCode)
      .query('SELECT * FROM ChecklistTemplates WHERE templateCode = @templateCode');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: {
    status?: ChecklistTemplateStatus;
    category?: string;
    auditType?: string;
  }): Promise<ChecklistTemplate[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM ChecklistTemplates WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }
    if (filters?.auditType) {
      request.input('auditType', sql.NVarChar, filters.auditType);
      query += ' AND auditType = @auditType';
    }

    query += ' ORDER BY category, templateName';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<ChecklistTemplate>): Promise<void> {
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
      await request.query(`UPDATE ChecklistTemplates SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ChecklistTemplates WHERE id = @id');
  }

  static async getActiveTemplates(): Promise<ChecklistTemplate[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM ChecklistTemplates 
        WHERE status = 'active' 
        ORDER BY category, templateName
      `);

    return result.recordset;
  }

  static async getTemplatesByCategory(category: string): Promise<ChecklistTemplate[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('category', sql.NVarChar, category)
      .query(`
        SELECT * FROM ChecklistTemplates 
        WHERE category = @category AND status = 'active'
        ORDER BY templateName
      `);

    return result.recordset;
  }
}
