import { getConnection, sql } from '../config/database';

export interface Attachment {
  id?: number;
  fileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  entityType: EntityType;
  entityId: number;
  description?: string;
  category?: string;
  version?: string;
  uploadedBy: number;
  isPublic: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  deletedBy?: number;
}

export enum EntityType {
  EQUIPMENT = 'equipment',
  DOCUMENT = 'document',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  SERVICE_MAINTENANCE = 'service_maintenance',
  TRAINING = 'training',
  NCR = 'ncr',
  CAPA = 'capa',
  AUDIT = 'audit',
}

export interface AttachmentFilters {
  entityType?: EntityType;
  entityId?: number;
  category?: string;
  uploadedBy?: number;
  active?: boolean;
}

export class AttachmentModel {
  static async create(attachment: Attachment): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('fileName', sql.NVarChar, attachment.fileName)
      .input('storedFileName', sql.NVarChar, attachment.storedFileName)
      .input('filePath', sql.NVarChar, attachment.filePath)
      .input('fileSize', sql.Int, attachment.fileSize)
      .input('mimeType', sql.NVarChar, attachment.mimeType)
      .input('fileExtension', sql.NVarChar, attachment.fileExtension)
      .input('entityType', sql.NVarChar, attachment.entityType)
      .input('entityId', sql.Int, attachment.entityId)
      .input('description', sql.NVarChar, attachment.description)
      .input('category', sql.NVarChar, attachment.category)
      .input('version', sql.NVarChar, attachment.version)
      .input('uploadedBy', sql.Int, attachment.uploadedBy)
      .input('isPublic', sql.Bit, attachment.isPublic)
      .input('active', sql.Bit, attachment.active)
      .query(`
        INSERT INTO Attachments (
          fileName, storedFileName, filePath, fileSize, mimeType, fileExtension,
          entityType, entityId, description, category, version, uploadedBy, isPublic, active
        )
        OUTPUT INSERTED.id
        VALUES (
          @fileName, @storedFileName, @filePath, @fileSize, @mimeType, @fileExtension,
          @entityType, @entityId, @description, @category, @version, @uploadedBy, @isPublic, @active
        )
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<Attachment | null> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          id, fileName, storedFileName, filePath, fileSize, mimeType, fileExtension,
          entityType, entityId, description, category, version, uploadedBy, isPublic, active,
          createdAt, updatedAt, deletedAt, deletedBy
        FROM Attachments
        WHERE id = @id AND active = 1
      `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async findAll(filters: AttachmentFilters = {}): Promise<Attachment[]> {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        id, fileName, storedFileName, filePath, fileSize, mimeType, fileExtension,
        entityType, entityId, description, category, version, uploadedBy, isPublic, active,
        createdAt, updatedAt, deletedAt, deletedBy
      FROM Attachments
      WHERE 1=1
    `;

    // Apply filters
    if (filters.entityType !== undefined) {
      query += ' AND entityType = @entityType';
      request.input('entityType', sql.NVarChar, filters.entityType);
    }

    if (filters.entityId !== undefined) {
      query += ' AND entityId = @entityId';
      request.input('entityId', sql.Int, filters.entityId);
    }

    if (filters.category !== undefined) {
      query += ' AND category = @category';
      request.input('category', sql.NVarChar, filters.category);
    }

    if (filters.uploadedBy !== undefined) {
      query += ' AND uploadedBy = @uploadedBy';
      request.input('uploadedBy', sql.Int, filters.uploadedBy);
    }

    if (filters.active !== undefined) {
      query += ' AND active = @active';
      request.input('active', sql.Bit, filters.active);
    } else {
      // By default, only return active attachments
      query += ' AND active = 1';
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async findByEntity(entityType: EntityType, entityId: number): Promise<Attachment[]> {
    return this.findAll({ entityType, entityId, active: true });
  }

  static async update(id: number, updates: Partial<Attachment>): Promise<boolean> {
    const pool = await getConnection();
    const request = pool.request();

    // Build dynamic update query
    const updateFields: string[] = [];
    
    if (updates.description !== undefined) {
      updateFields.push('description = @description');
      request.input('description', sql.NVarChar, updates.description);
    }
    
    if (updates.category !== undefined) {
      updateFields.push('category = @category');
      request.input('category', sql.NVarChar, updates.category);
    }
    
    if (updates.version !== undefined) {
      updateFields.push('version = @version');
      request.input('version', sql.NVarChar, updates.version);
    }
    
    if (updates.isPublic !== undefined) {
      updateFields.push('isPublic = @isPublic');
      request.input('isPublic', sql.Bit, updates.isPublic);
    }

    if (updateFields.length === 0) {
      return false;
    }

    // Always update the updatedAt timestamp
    updateFields.push('updatedAt = GETDATE()');

    request.input('id', sql.Int, id);

    const result = await request.query(`
      UPDATE Attachments
      SET ${updateFields.join(', ')}
      WHERE id = @id AND active = 1
    `);

    return result.rowsAffected[0] > 0;
  }

  static async softDelete(id: number, deletedBy: number): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('deletedBy', sql.Int, deletedBy)
      .query(`
        UPDATE Attachments
        SET active = 0, deletedAt = GETDATE(), deletedBy = @deletedBy, updatedAt = GETDATE()
        WHERE id = @id AND active = 1
      `);

    return result.rowsAffected[0] > 0;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Attachments
        WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  static async countByEntity(entityType: EntityType, entityId: number): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('entityType', sql.NVarChar, entityType)
      .input('entityId', sql.Int, entityId)
      .query(`
        SELECT COUNT(*) as count
        FROM Attachments
        WHERE entityType = @entityType AND entityId = @entityId AND active = 1
      `);

    return result.recordset[0].count;
  }
}
