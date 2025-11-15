import { getConnection, sql } from '../config/database';
import { EquipmentStatus } from '../types';

export interface Equipment {
  id?: number;
  equipmentNumber: string;
  name: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  department?: string;
  status: EquipmentStatus;
  purchaseDate?: Date;
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationInterval?: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceInterval?: number;
  qrCode?: string;
  responsiblePerson?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EquipmentModel {
  static async create(equipment: Equipment): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('equipmentNumber', sql.NVarChar, equipment.equipmentNumber)
      .input('name', sql.NVarChar, equipment.name)
      .input('description', sql.NVarChar, equipment.description)
      .input('manufacturer', sql.NVarChar, equipment.manufacturer)
      .input('model', sql.NVarChar, equipment.model)
      .input('serialNumber', sql.NVarChar, equipment.serialNumber)
      .input('location', sql.NVarChar, equipment.location)
      .input('department', sql.NVarChar, equipment.department)
      .input('status', sql.NVarChar, equipment.status)
      .input('purchaseDate', sql.DateTime, equipment.purchaseDate)
      .input('calibrationInterval', sql.Int, equipment.calibrationInterval)
      .input('maintenanceInterval', sql.Int, equipment.maintenanceInterval)
      .input('qrCode', sql.NVarChar, equipment.qrCode)
      .input('responsiblePerson', sql.Int, equipment.responsiblePerson)
      .query(`
        INSERT INTO Equipment (equipmentNumber, name, description, manufacturer, model, serialNumber, location, department, status, purchaseDate, calibrationInterval, maintenanceInterval, qrCode, responsiblePerson)
        OUTPUT INSERTED.id
        VALUES (@equipmentNumber, @name, @description, @manufacturer, @model, @serialNumber, @location, @department, @status, @purchaseDate, @calibrationInterval, @maintenanceInterval, @qrCode, @responsiblePerson)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<Equipment | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Equipment WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findByQRCode(qrCode: string): Promise<Equipment | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('qrCode', sql.NVarChar, qrCode)
      .query('SELECT * FROM Equipment WHERE qrCode = @qrCode');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: { status?: EquipmentStatus; department?: string }): Promise<Equipment[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Equipment WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.department) {
      request.input('department', sql.NVarChar, filters.department);
      query += ' AND department = @department';
    }

    query += ' ORDER BY name ASC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<Equipment>): Promise<void> {
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
      await request.query(`UPDATE Equipment SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async delete(id: number): Promise<void> {
    const pool = await getConnection();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Equipment WHERE id = @id');
  }

  static async findCalibrationDue(days: number = 30): Promise<Equipment[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('days', sql.Int, days)
      .query(`
        SELECT * FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate <= DATEADD(day, @days, GETDATE())
        ORDER BY nextCalibrationDate ASC
      `);

    return result.recordset;
  }
}
