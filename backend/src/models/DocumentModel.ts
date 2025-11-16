import { getConnection, sql } from '../config/database';
import { DocumentStatus } from '../types';
import { DocumentRevisionModel, DocumentRevision } from './DocumentRevisionModel';

export interface Document {
  id?: number;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  version: string;
  parentDocumentId?: number; // Reference to previous version for version history
  status: DocumentStatus;
  ownerId?: number; // Primary document owner
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: Date;
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
      .input('parentDocumentId', sql.Int, document.parentDocumentId)
      .input('status', sql.NVarChar, document.status)
      .input('ownerId', sql.Int, document.ownerId)
      .input('filePath', sql.NVarChar, document.filePath)
      .input('fileName', sql.NVarChar, document.fileName)
      .input('fileSize', sql.Int, document.fileSize)
      .input('createdBy', sql.Int, document.createdBy)
      .input('approvedBy', sql.Int, document.approvedBy)
      .input('approvedAt', sql.DateTime2, document.approvedAt)
      .input('effectiveDate', sql.DateTime2, document.effectiveDate)
      .input('reviewDate', sql.DateTime2, document.reviewDate)
      .input('expiryDate', sql.DateTime2, document.expiryDate)
      .query(`
        INSERT INTO Documents (title, description, documentType, category, version, parentDocumentId, status, ownerId, filePath, fileName, fileSize, createdBy, approvedBy, approvedAt, effectiveDate, reviewDate, expiryDate)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @documentType, @category, @version, @parentDocumentId, @status, @ownerId, @filePath, @fileName, @fileSize, @createdBy, @approvedBy, @approvedAt, @effectiveDate, @reviewDate, @expiryDate)
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
      parentDocumentId: documentId, // Link to parent version for version history
      status: DocumentStatus.DRAFT,
      createdBy: userId,
      approvedBy: undefined, // Reset approval for new version
      approvedAt: undefined,
    };

    delete newDoc.id;
    delete newDoc.createdAt;
    delete newDoc.updatedAt;
    return this.create(newDoc);
  }

  static async getVersionHistory(documentId: number): Promise<Document[]> {
    const pool = await getConnection();
    
    // Get all versions in the document's version chain
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        WITH DocumentVersions AS (
          -- Start with the requested document
          SELECT * FROM Documents WHERE id = @documentId
          UNION ALL
          -- Recursively get parent versions
          SELECT d.* FROM Documents d
          INNER JOIN DocumentVersions dv ON d.id = dv.parentDocumentId
        )
        SELECT * FROM DocumentVersions
        ORDER BY version DESC, createdAt DESC
      `);

    return result.recordset;
  }

  /**
   * Create a revision entry when a document is created or updated
   */
  static async createRevision(
    documentId: number,
    userId: number,
    changeType: 'create' | 'update' | 'approve' | 'obsolete' | 'review' | 'version',
    changeDescription?: string,
    changeReason?: string,
    statusBefore?: string,
    statusAfter?: string
  ): Promise<number> {
    const document = await this.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get the next revision number
    const revisionNumber = await DocumentRevisionModel.getNextRevisionNumber(documentId);

    // Get the latest revision to link as previous
    const latestRevision = await DocumentRevisionModel.findLatestByDocumentId(documentId);

    const revision: DocumentRevision = {
      documentId,
      version: document.version,
      revisionNumber,
      changeDescription,
      changeType,
      changeReason,
      authorId: userId,
      filePath: document.filePath,
      fileName: document.fileName,
      fileSize: document.fileSize,
      statusBefore,
      statusAfter: statusAfter || document.status,
      previousRevisionId: latestRevision?.id,
    };

    return DocumentRevisionModel.create(revision);
  }

  /**
   * Get full revision history for a document
   */
  static async getRevisionHistory(documentId: number) {
    return DocumentRevisionModel.findByDocumentId(documentId);
  }
}
