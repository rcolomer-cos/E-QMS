import { getConnection, sql } from '../config/database';

export interface ProcessOwner {
  id?: number;
  processId: number;
  ownerId: number;
  ownerName?: string; // Populated when fetched with user info
  ownerEmail?: string; // Populated when fetched with user info
  assignedAt?: Date;
  assignedBy?: number;
  assignedByName?: string; // Populated when fetched with user info
  isPrimaryOwner: boolean;
  active: boolean;
  notes?: string;
}

export interface CreateProcessOwnerData {
  processId: number;
  ownerId: number;
  assignedBy: number;
  isPrimaryOwner?: boolean;
  notes?: string;
}

export class ProcessOwnerModel {
  /**
   * Assign an owner to a process
   */
  static async create(data: CreateProcessOwnerData): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('processId', sql.Int, data.processId)
      .input('ownerId', sql.Int, data.ownerId)
      .input('assignedBy', sql.Int, data.assignedBy)
      .input('isPrimaryOwner', sql.Bit, data.isPrimaryOwner || false)
      .input('notes', sql.NVarChar, data.notes)
      .query(`
        INSERT INTO ProcessOwners (processId, ownerId, assignedBy, isPrimaryOwner, active, notes)
        OUTPUT INSERTED.id
        VALUES (@processId, @ownerId, @assignedBy, @isPrimaryOwner, 1, @notes)
      `);

    return result.recordset[0].id;
  }

  /**
   * Get all owners for a specific process
   */
  static async findByProcessId(processId: number): Promise<ProcessOwner[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('processId', sql.Int, processId)
      .query(`
        SELECT 
          po.*,
          CONCAT(u.firstName, ' ', u.lastName) as ownerName,
          u.email as ownerEmail,
          CONCAT(ab.firstName, ' ', ab.lastName) as assignedByName
        FROM ProcessOwners po
        INNER JOIN Users u ON po.ownerId = u.id
        LEFT JOIN Users ab ON po.assignedBy = ab.id
        WHERE po.processId = @processId AND po.active = 1
        ORDER BY po.isPrimaryOwner DESC, po.assignedAt ASC
      `);

    return result.recordset;
  }

  /**
   * Get all processes owned by a specific user
   */
  static async findByOwnerId(ownerId: number): Promise<ProcessOwner[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('ownerId', sql.Int, ownerId)
      .query(`
        SELECT 
          po.*,
          p.name as processName,
          p.code as processCode,
          CONCAT(ab.firstName, ' ', ab.lastName) as assignedByName
        FROM ProcessOwners po
        INNER JOIN Processes p ON po.processId = p.id
        LEFT JOIN Users ab ON po.assignedBy = ab.id
        WHERE po.ownerId = @ownerId AND po.active = 1 AND p.active = 1
        ORDER BY po.isPrimaryOwner DESC, po.assignedAt ASC
      `);

    return result.recordset;
  }

  /**
   * Check if a user is already assigned as an owner to a process
   */
  static async ownershipExists(processId: number, ownerId: number): Promise<boolean> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('processId', sql.Int, processId)
      .input('ownerId', sql.Int, ownerId)
      .query(`
        SELECT COUNT(*) as count 
        FROM ProcessOwners 
        WHERE processId = @processId AND ownerId = @ownerId AND active = 1
      `);

    return result.recordset[0].count > 0;
  }

  /**
   * Remove an owner from a process (soft delete)
   */
  static async delete(processId: number, ownerId: number): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('processId', sql.Int, processId)
      .input('ownerId', sql.Int, ownerId)
      .query(`
        UPDATE ProcessOwners 
        SET active = 0 
        WHERE processId = @processId AND ownerId = @ownerId
      `);
  }

  /**
   * Update primary owner status
   */
  static async updatePrimaryStatus(id: number, isPrimaryOwner: boolean): Promise<void> {
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('isPrimaryOwner', sql.Bit, isPrimaryOwner)
      .query(`
        UPDATE ProcessOwners 
        SET isPrimaryOwner = @isPrimaryOwner 
        WHERE id = @id
      `);
  }

  /**
   * Get a specific ownership assignment by ID
   */
  static async findById(id: number): Promise<ProcessOwner | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          po.*,
          CONCAT(u.firstName, ' ', u.lastName) as ownerName,
          u.email as ownerEmail,
          CONCAT(ab.firstName, ' ', ab.lastName) as assignedByName
        FROM ProcessOwners po
        INNER JOIN Users u ON po.ownerId = u.id
        LEFT JOIN Users ab ON po.assignedBy = ab.id
        WHERE po.id = @id AND po.active = 1
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }
}
