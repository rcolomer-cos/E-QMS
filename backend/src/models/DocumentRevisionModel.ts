import { getConnection, sql } from '../config/database';

export interface DocumentRevision {
  id?: number;
  documentId: number;
  version: string;
  revisionNumber: number;
  changeDescription?: string;
  changeType: 'create' | 'update' | 'approve' | 'obsolete' | 'review' | 'version';
  changeReason?: string;
  authorId: number;
  authorName?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  statusBefore?: string;
  statusAfter: string;
  previousRevisionId?: number;
  revisionDate?: Date;
}

export interface DocumentRevisionWithAuthor extends DocumentRevision {
  authorFirstName?: string;
  authorLastName?: string;
  authorEmail?: string;
}

export class DocumentRevisionModel {
  /**
   * Create a new revision entry
   */
  static async create(revision: DocumentRevision): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('documentId', sql.Int, revision.documentId)
      .input('version', sql.NVarChar, revision.version)
      .input('revisionNumber', sql.Int, revision.revisionNumber)
      .input('changeDescription', sql.NVarChar, revision.changeDescription)
      .input('changeType', sql.NVarChar, revision.changeType)
      .input('changeReason', sql.NVarChar, revision.changeReason)
      .input('authorId', sql.Int, revision.authorId)
      .input('authorName', sql.NVarChar, revision.authorName)
      .input('filePath', sql.NVarChar, revision.filePath)
      .input('fileName', sql.NVarChar, revision.fileName)
      .input('fileSize', sql.Int, revision.fileSize)
      .input('fileHash', sql.NVarChar, revision.fileHash)
      .input('statusBefore', sql.NVarChar, revision.statusBefore)
      .input('statusAfter', sql.NVarChar, revision.statusAfter)
      .input('previousRevisionId', sql.Int, revision.previousRevisionId)
      .query(`
        INSERT INTO DocumentRevisions (
          documentId, version, revisionNumber, changeDescription, changeType, changeReason,
          authorId, authorName, filePath, fileName, fileSize, fileHash,
          statusBefore, statusAfter, previousRevisionId
        )
        OUTPUT INSERTED.id
        VALUES (
          @documentId, @version, @revisionNumber, @changeDescription, @changeType, @changeReason,
          @authorId, @authorName, @filePath, @fileName, @fileSize, @fileHash,
          @statusBefore, @statusAfter, @previousRevisionId
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get revision by ID
   */
  static async findById(id: number): Promise<DocumentRevision | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM DocumentRevisions WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Get all revisions for a specific document
   * Returns revisions in reverse chronological order (newest first)
   */
  static async findByDocumentId(documentId: number): Promise<DocumentRevisionWithAuthor[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT 
          dr.*,
          u.firstName AS authorFirstName,
          u.lastName AS authorLastName,
          u.email AS authorEmail
        FROM DocumentRevisions dr
        LEFT JOIN Users u ON dr.authorId = u.id
        WHERE dr.documentId = @documentId
        ORDER BY dr.revisionDate DESC, dr.revisionNumber DESC
      `);

    return result.recordset;
  }

  /**
   * Get the most recent revision for a document
   */
  static async findLatestByDocumentId(documentId: number): Promise<DocumentRevision | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT TOP 1 * 
        FROM DocumentRevisions 
        WHERE documentId = @documentId
        ORDER BY revisionDate DESC, revisionNumber DESC
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get next revision number for a document
   */
  static async getNextRevisionNumber(documentId: number): Promise<number> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT ISNULL(MAX(revisionNumber), 0) + 1 AS nextRevisionNumber
        FROM DocumentRevisions
        WHERE documentId = @documentId
      `);

    return result.recordset[0]?.nextRevisionNumber || 1;
  }

  /**
   * Get revisions by author
   */
  static async findByAuthor(authorId: number): Promise<DocumentRevision[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('authorId', sql.Int, authorId)
      .query(`
        SELECT * FROM DocumentRevisions 
        WHERE authorId = @authorId
        ORDER BY revisionDate DESC
      `);

    return result.recordset;
  }

  /**
   * Get revisions by change type
   */
  static async findByChangeType(
    documentId: number,
    changeType: string
  ): Promise<DocumentRevision[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('changeType', sql.NVarChar, changeType)
      .query(`
        SELECT * FROM DocumentRevisions 
        WHERE documentId = @documentId AND changeType = @changeType
        ORDER BY revisionDate DESC
      `);

    return result.recordset;
  }

  /**
   * Get revisions within a date range
   */
  static async findByDateRange(
    documentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DocumentRevision[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('startDate', sql.DateTime2, startDate)
      .input('endDate', sql.DateTime2, endDate)
      .query(`
        SELECT * FROM DocumentRevisions 
        WHERE documentId = @documentId 
          AND revisionDate >= @startDate 
          AND revisionDate <= @endDate
        ORDER BY revisionDate DESC
      `);

    return result.recordset;
  }

  /**
   * Get complete revision history with linked previous revisions
   * Uses recursive query to build full revision chain
   */
  static async getRevisionChain(revisionId: number): Promise<DocumentRevision[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('revisionId', sql.Int, revisionId)
      .query(`
        WITH RevisionChain AS (
          -- Start with the specified revision
          SELECT * FROM DocumentRevisions WHERE id = @revisionId
          UNION ALL
          -- Recursively get previous revisions
          SELECT dr.* FROM DocumentRevisions dr
          INNER JOIN RevisionChain rc ON dr.id = rc.previousRevisionId
        )
        SELECT * FROM RevisionChain
        ORDER BY revisionDate DESC, revisionNumber DESC
      `);

    return result.recordset;
  }

  /**
   * Get revision count for a document
   */
  static async getRevisionCount(documentId: number): Promise<number> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT COUNT(*) AS count
        FROM DocumentRevisions
        WHERE documentId = @documentId
      `);

    return result.recordset[0]?.count || 0;
  }

  /**
   * Delete revisions for a document (cascade on document deletion handles this automatically)
   */
  static async deleteByDocumentId(documentId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query('DELETE FROM DocumentRevisions WHERE documentId = @documentId');
  }
}
