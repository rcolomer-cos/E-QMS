import { getConnection, sql } from '../config/database';
import { DocumentStatus } from '../types';

export interface Document {
  id?: number;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  version: string;
  status: DocumentStatus;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  createdBy: number;
  approvedBy?: number;
  effectiveDate?: Date;
  reviewDate?: Date;
  expiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DocumentModel {
  static async create(document: Document): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('title', sql.NVarChar, document.title)
      .input('description', sql.NVarChar, document.description)
      .input('documentType', sql.NVarChar, document.documentType)
      .input('category', sql.NVarChar, document.category)
      .input('version', sql.NVarChar, document.version)
      .input('status', sql.NVarChar, document.status)
      .input('filePath', sql.NVarChar, document.filePath)
      .input('fileName', sql.NVarChar, document.fileName)
      .input('fileSize', sql.Int, document.fileSize)
      .input('createdBy', sql.Int, document.createdBy)
      .query(`
        INSERT INTO Documents (title, description, documentType, category, version, status, filePath, fileName, fileSize, createdBy)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @documentType, @category, @version, @status, @filePath, @fileName, @fileSize, @createdBy)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<Document | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Documents WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: {
    status?: DocumentStatus;
    category?: string;
    documentType?: string;
  }): Promise<Document[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Documents WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }
    if (filters?.documentType) {
      request.input('documentType', sql.NVarChar, filters.documentType);
      query += ' AND documentType = @documentType';
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<Document>): Promise<void> {
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
      await request.query(`UPDATE Documents SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Documents WHERE id = @id');
  }

  static async createVersion(documentId: number, userId: number): Promise<number> {
    const original = await this.findById(documentId);

    if (!original) {
      throw new Error('Document not found');
    }

    const versionParts = original.version.split('.');
    const newVersion = `${versionParts[0]}.${parseInt(versionParts[1] || '0', 10) + 1}`;

    const newDoc: Document = {
      ...original,
      version: newVersion,
      status: DocumentStatus.DRAFT,
      createdBy: userId,
    };

    delete newDoc.id;
    return this.create(newDoc);
  }
}
