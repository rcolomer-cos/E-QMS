import { getConnection, sql } from '../config/database';

export interface Notification {
  id?: number;
  userId: number;
  type: 'document_approved' | 'document_rejected' | 'document_changes_requested' | 'document_created' | 'document_updated';
  title: string;
  message: string;
  documentId?: number;
  revisionId?: number;
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
}

export interface NotificationWithDetails extends Notification {
  documentTitle?: string;
  documentVersion?: string;
}

export class NotificationModel {
  /**
   * Create a new notification
   */
  static async create(notification: Notification): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('userId', sql.Int, notification.userId)
      .input('type', sql.NVarChar, notification.type)
      .input('title', sql.NVarChar, notification.title)
      .input('message', sql.NVarChar, notification.message)
      .input('documentId', sql.Int, notification.documentId)
      .input('revisionId', sql.Int, notification.revisionId)
      .query(`
        INSERT INTO Notifications (
          userId, type, title, message, documentId, revisionId
        )
        OUTPUT INSERTED.id
        VALUES (
          @userId, @type, @title, @message, @documentId, @revisionId
        )
      `);

    return result.recordset[0].id;
  }

  /**
   * Get notification by ID
   */
  static async findById(id: number): Promise<Notification | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Notifications WHERE id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Get all notifications for a user
   */
  static async findByUserId(
    userId: number,
    unreadOnly: boolean = false
  ): Promise<NotificationWithDetails[]> {
    const pool = await getConnection();
    
    let query = `
      SELECT 
        n.*,
        d.title AS documentTitle,
        d.version AS documentVersion
      FROM Notifications n
      LEFT JOIN Documents d ON n.documentId = d.id
      WHERE n.userId = @userId
    `;
    
    if (unreadOnly) {
      query += ' AND n.isRead = 0';
    }
    
    query += ' ORDER BY n.createdAt DESC';

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(query);

    return result.recordset;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('readAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Notifications 
        SET isRead = 1, readAt = @readAt
        WHERE id = @id
      `);
  }

  /**
   * Mark all notifications for a user as read
   */
  static async markAllAsRead(userId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('readAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Notifications 
        SET isRead = 1, readAt = @readAt
        WHERE userId = @userId AND isRead = 0
      `);
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM Notifications
        WHERE userId = @userId AND isRead = 0
      `);

    return result.recordset[0]?.count || 0;
  }

  /**
   * Delete notification by ID
   */
  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Notifications WHERE id = @id');
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteByUserId(userId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Notifications WHERE userId = @userId');
  }

  /**
   * Delete old read notifications (cleanup)
   */
  static async deleteOldReadNotifications(daysOld: number = 90): Promise<number> {
    const pool = await getConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await pool
      .request()
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        DELETE FROM Notifications 
        WHERE isRead = 1 AND readAt < @cutoffDate
      `);

    return result.rowsAffected[0];
  }
}
