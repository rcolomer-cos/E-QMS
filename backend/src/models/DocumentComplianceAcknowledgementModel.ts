import { getConnection, sql } from '../config/database';

export interface DocumentComplianceAcknowledgement {
  id?: number;
  documentId: number;
  userId: number;
  documentVersion: string;
  acknowledgedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface ComplianceStatus {
  documentId: number;
  userId: number;
  isCompliant: boolean;
  currentVersion: string;
  acknowledgedVersion?: string;
  acknowledgedAt?: Date;
  requiresAcknowledgement: boolean;
}

export interface DocumentComplianceReport {
  documentId: number;
  title: string;
  version: string;
  complianceRequired: boolean;
  totalUsersRequired: number;
  acknowledgedCount: number;
  pendingCount: number;
  acknowledgedUsers: Array<{
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    acknowledgedAt: Date;
  }>;
  pendingUsers: Array<{
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export class DocumentComplianceAcknowledgementModel {
  /**
   * Record a user's acknowledgement of a document
   */
  static async create(acknowledgement: DocumentComplianceAcknowledgement): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('documentId', sql.Int, acknowledgement.documentId)
      .input('userId', sql.Int, acknowledgement.userId)
      .input('documentVersion', sql.NVarChar, acknowledgement.documentVersion)
      .input('ipAddress', sql.NVarChar, acknowledgement.ipAddress)
      .input('userAgent', sql.NVarChar, acknowledgement.userAgent)
      .query(`
        INSERT INTO DocumentComplianceAcknowledgements 
        (documentId, userId, documentVersion, ipAddress, userAgent)
        OUTPUT INSERTED.id
        VALUES (@documentId, @userId, @documentVersion, @ipAddress, @userAgent)
      `);

    return result.recordset[0].id;
  }

  /**
   * Check if a user has acknowledged the current version of a document
   */
  static async hasAcknowledged(
    userId: number,
    documentId: number,
    documentVersion: string
  ): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('documentId', sql.Int, documentId)
      .input('documentVersion', sql.NVarChar, documentVersion)
      .query(`
        SELECT COUNT(*) AS count
        FROM DocumentComplianceAcknowledgements
        WHERE userId = @userId 
          AND documentId = @documentId 
          AND documentVersion = @documentVersion
      `);

    return result.recordset[0].count > 0;
  }

  /**
   * Get user's acknowledgement for a specific document (latest version acknowledged)
   */
  static async getUserAcknowledgement(
    userId: number,
    documentId: number
  ): Promise<DocumentComplianceAcknowledgement | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT TOP 1 *
        FROM DocumentComplianceAcknowledgements
        WHERE userId = @userId AND documentId = @documentId
        ORDER BY acknowledgedAt DESC
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get compliance status for a user and document
   */
  static async getComplianceStatus(userId: number, documentId: number): Promise<ComplianceStatus> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT 
          d.id AS documentId,
          d.version AS currentVersion,
          d.complianceRequired AS requiresAcknowledgement,
          dca.documentVersion AS acknowledgedVersion,
          dca.acknowledgedAt
        FROM Documents d
        LEFT JOIN DocumentComplianceAcknowledgements dca 
          ON d.id = dca.documentId 
          AND dca.userId = @userId
          AND dca.documentVersion = d.version
        WHERE d.id = @documentId
      `);

    if (result.recordset.length === 0) {
      throw new Error('Document not found');
    }

    const record = result.recordset[0];
    return {
      documentId,
      userId,
      currentVersion: record.currentVersion,
      acknowledgedVersion: record.acknowledgedVersion,
      acknowledgedAt: record.acknowledgedAt,
      requiresAcknowledgement: record.requiresAcknowledgement,
      isCompliant: !record.requiresAcknowledgement || !!record.acknowledgedVersion,
    };
  }

  /**
   * Get all acknowledgements for a document
   */
  static async getDocumentAcknowledgements(documentId: number): Promise<DocumentComplianceAcknowledgement[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT *
        FROM DocumentComplianceAcknowledgements
        WHERE documentId = @documentId
        ORDER BY acknowledgedAt DESC
      `);

    return result.recordset;
  }

  /**
   * Get detailed compliance report for a document
   * Shows who has acknowledged and who hasn't from assigned groups
   */
  static async getDocumentComplianceReport(documentId: number): Promise<DocumentComplianceReport | null> {
    const pool = await getConnection();
    
    // Get document details and compliance requirement
    const docResult = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT id, title, version, complianceRequired
        FROM Documents
        WHERE id = @documentId
      `);

    if (docResult.recordset.length === 0) {
      return null;
    }

    const document = docResult.recordset[0];

    // Get all users who should acknowledge (from assigned groups)
    const usersResult = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query(`
        SELECT DISTINCT u.id, u.firstName, u.lastName, u.email
        FROM Users u
        INNER JOIN UserGroups ug ON u.id = ug.userId
        INNER JOIN DocumentGroups dg ON ug.groupId = dg.groupId
        WHERE dg.documentId = @documentId AND u.active = 1
        ORDER BY u.lastName, u.firstName
      `);

    const allUsers = usersResult.recordset;

    // Get users who have acknowledged the current version
    const acknowledgedResult = await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .input('documentVersion', sql.NVarChar, document.version)
      .query(`
        SELECT 
          u.id AS userId,
          u.firstName,
          u.lastName,
          u.email,
          dca.acknowledgedAt
        FROM DocumentComplianceAcknowledgements dca
        INNER JOIN Users u ON dca.userId = u.id
        WHERE dca.documentId = @documentId 
          AND dca.documentVersion = @documentVersion
        ORDER BY dca.acknowledgedAt DESC
      `);

    const acknowledgedUsers = acknowledgedResult.recordset;
    const acknowledgedUserIds = new Set(acknowledgedUsers.map((u: any) => u.userId));

    // Identify pending users
    const pendingUsers = allUsers.filter((u: any) => !acknowledgedUserIds.has(u.id));

    return {
      documentId: document.id,
      title: document.title,
      version: document.version,
      complianceRequired: document.complianceRequired,
      totalUsersRequired: allUsers.length,
      acknowledgedCount: acknowledgedUsers.length,
      pendingCount: pendingUsers.length,
      acknowledgedUsers,
      pendingUsers,
    };
  }

  /**
   * Get all documents requiring acknowledgement for a user
   */
  static async getPendingDocumentsForUser(userId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT DISTINCT
          d.id,
          d.title,
          d.version,
          d.documentType,
          d.category,
          d.effectiveDate,
          d.createdAt
        FROM Documents d
        INNER JOIN DocumentGroups dg ON d.id = dg.documentId
        INNER JOIN UserGroups ug ON dg.groupId = ug.groupId
        WHERE ug.userId = @userId
          AND d.complianceRequired = 1
          AND d.status = 'approved'
          AND NOT EXISTS (
            SELECT 1
            FROM DocumentComplianceAcknowledgements dca
            WHERE dca.documentId = d.id
              AND dca.userId = @userId
              AND dca.documentVersion = d.version
          )
        ORDER BY d.effectiveDate DESC, d.createdAt DESC
      `);

    return result.recordset;
  }

  /**
   * Get all compliance-required documents for a user with their status
   */
  static async getComplianceDocumentsForUser(userId: number): Promise<any[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT DISTINCT
          d.id,
          d.title,
          d.version,
          d.documentType,
          d.category,
          d.effectiveDate,
          d.createdAt,
          CASE 
            WHEN dca.id IS NOT NULL THEN 1
            ELSE 0
          END AS isAcknowledged,
          dca.acknowledgedAt
        FROM Documents d
        INNER JOIN DocumentGroups dg ON d.id = dg.documentId
        INNER JOIN UserGroups ug ON dg.groupId = ug.groupId
        LEFT JOIN DocumentComplianceAcknowledgements dca 
          ON d.id = dca.documentId 
          AND dca.userId = @userId
          AND dca.documentVersion = d.version
        WHERE ug.userId = @userId
          AND d.complianceRequired = 1
          AND d.status = 'approved'
        ORDER BY 
          CASE WHEN dca.id IS NULL THEN 0 ELSE 1 END, -- Pending first
          d.effectiveDate DESC, 
          d.createdAt DESC
      `);

    return result.recordset;
  }

  /**
   * Delete all acknowledgements for a document (used when document is deleted)
   */
  static async deleteByDocumentId(documentId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('documentId', sql.Int, documentId)
      .query('DELETE FROM DocumentComplianceAcknowledgements WHERE documentId = @documentId');
  }

  /**
   * Delete all acknowledgements for a user (used when user is deleted)
   */
  static async deleteByUserId(userId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM DocumentComplianceAcknowledgements WHERE userId = @userId');
  }
}
