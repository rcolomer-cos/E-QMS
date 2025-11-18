import { getConnection, sql } from '../config/database';

export interface DocumentContent {
  documentId: number;
  content: string; // HTML or ProseMirror JSON
  contentFormat: 'html' | 'prosemirror';
  updatedBy: number;
  updatedAt?: Date;
}

export class DocumentContentModel {
  static async getByDocumentId(documentId: number): Promise<DocumentContent | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(
        `SELECT TOP 1 documentId, content, contentFormat, updatedBy, updatedAt
         FROM DocumentContents WHERE documentId = @documentId`
      );
    return result.recordset[0] || null;
  }

  static async upsert(content: DocumentContent): Promise<void> {
    const pool = await getConnection();
    const request = pool
      .request()
      .input('documentId', sql.Int, content.documentId)
      .input('content', sql.NVarChar(sql.MAX), content.content)
      .input('contentFormat', sql.NVarChar, content.contentFormat)
      .input('updatedBy', sql.Int, content.updatedBy);

    await request.query(`
      IF EXISTS (SELECT 1 FROM DocumentContents WHERE documentId = @documentId)
      BEGIN
        UPDATE DocumentContents
        SET content = @content,
            contentFormat = @contentFormat,
            updatedBy = @updatedBy,
            updatedAt = GETDATE()
        WHERE documentId = @documentId
      END
      ELSE
      BEGIN
        INSERT INTO DocumentContents (documentId, content, contentFormat, updatedBy)
        VALUES (@documentId, @content, @contentFormat, @updatedBy)
      END
    `);
  }
}
