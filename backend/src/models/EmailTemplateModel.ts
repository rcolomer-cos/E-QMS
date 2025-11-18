import { getConnection, sql } from '../config/database';

export interface EmailTemplate {
  id?: number;
  name: string;
  displayName: string;
  type: string;
  category: string;
  subject: string;
  body: string;
  description?: string;
  placeholders?: string; // JSON string array
  isActive: boolean;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}

export interface EmailTemplateFilters {
  type?: string;
  category?: string;
  isActive?: boolean;
}

export class EmailTemplateModel {
  static async create(template: EmailTemplate): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('name', sql.NVarChar, template.name)
      .input('displayName', sql.NVarChar, template.displayName)
      .input('type', sql.NVarChar, template.type)
      .input('category', sql.NVarChar, template.category)
      .input('subject', sql.NVarChar, template.subject)
      .input('body', sql.NVarChar, template.body)
      .input('description', sql.NVarChar, template.description)
      .input('placeholders', sql.NVarChar, template.placeholders)
      .input('isActive', sql.Bit, template.isActive)
      .input('isDefault', sql.Bit, template.isDefault)
      .input('createdBy', sql.Int, template.createdBy)
      .query(`
        INSERT INTO EmailTemplates (
          name, displayName, type, category, subject, body, 
          description, placeholders, isActive, isDefault, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @name, @displayName, @type, @category, @subject, @body,
          @description, @placeholders, @isActive, @isDefault, @createdBy
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<EmailTemplate | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM EmailTemplates WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: EmailTemplateFilters): Promise<EmailTemplate[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM EmailTemplates WHERE 1=1';

    if (filters?.type) {
      request.input('type', sql.NVarChar, filters.type);
      query += ' AND type = @type';
    }

    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }

    if (filters?.isActive !== undefined) {
      request.input('isActive', sql.Bit, filters.isActive);
      query += ' AND isActive = @isActive';
    }

    query += ' ORDER BY category, type, displayName';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findByType(type: string, activeOnly = true): Promise<EmailTemplate[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM EmailTemplates WHERE type = @type';

    request.input('type', sql.NVarChar, type);

    if (activeOnly) {
      query += ' AND isActive = 1';
    }

    query += ' ORDER BY isDefault DESC, displayName';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findDefaultByType(type: string): Promise<EmailTemplate | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('type', sql.NVarChar, type)
      .query('SELECT * FROM EmailTemplates WHERE type = @type AND isDefault = 1 AND isActive = 1');

    return result.recordset[0] || null;
  }

  static async update(id: number, template: Partial<EmailTemplate>): Promise<boolean> {
    const pool = await getConnection();

    const updates: string[] = [];
    const request = pool.request();

    request.input('id', sql.Int, id);

    if (template.name !== undefined) {
      request.input('name', sql.NVarChar, template.name);
      updates.push('name = @name');
    }

    if (template.displayName !== undefined) {
      request.input('displayName', sql.NVarChar, template.displayName);
      updates.push('displayName = @displayName');
    }

    if (template.type !== undefined) {
      request.input('type', sql.NVarChar, template.type);
      updates.push('type = @type');
    }

    if (template.category !== undefined) {
      request.input('category', sql.NVarChar, template.category);
      updates.push('category = @category');
    }

    if (template.subject !== undefined) {
      request.input('subject', sql.NVarChar, template.subject);
      updates.push('subject = @subject');
    }

    if (template.body !== undefined) {
      request.input('body', sql.NVarChar, template.body);
      updates.push('body = @body');
    }

    if (template.description !== undefined) {
      request.input('description', sql.NVarChar, template.description);
      updates.push('description = @description');
    }

    if (template.placeholders !== undefined) {
      request.input('placeholders', sql.NVarChar, template.placeholders);
      updates.push('placeholders = @placeholders');
    }

    if (template.isActive !== undefined) {
      request.input('isActive', sql.Bit, template.isActive);
      updates.push('isActive = @isActive');
    }

    if (template.isDefault !== undefined) {
      request.input('isDefault', sql.Bit, template.isDefault);
      updates.push('isDefault = @isDefault');
    }

    if (template.updatedBy !== undefined) {
      request.input('updatedBy', sql.Int, template.updatedBy);
      updates.push('updatedBy = @updatedBy');
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updatedAt = GETDATE()');

    const query = `UPDATE EmailTemplates SET ${updates.join(', ')} WHERE id = @id`;
    const result = await request.query(query);

    return result.rowsAffected[0] > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM EmailTemplates WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  static async getTemplateTypes(): Promise<string[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT DISTINCT type FROM EmailTemplates WHERE isActive = 1 ORDER BY type');

    return result.recordset.map((row: { type: string }) => row.type);
  }

  static async getTemplateCategories(): Promise<string[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT DISTINCT category FROM EmailTemplates WHERE isActive = 1 ORDER BY category');

    return result.recordset.map((row: { category: string }) => row.category);
  }
}
