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

  static async findByEquipmentNumber(equipmentNumber: string): Promise<Equipment | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('equipmentNumber', sql.NVarChar, equipmentNumber)
      .query('SELECT * FROM Equipment WHERE equipmentNumber = @equipmentNumber');

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

  static async getOverdueCalibration(): Promise<Equipment[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate < CAST(GETDATE() AS DATE)
        ORDER BY nextCalibrationDate ASC
      `);

    return result.recordset;
  }

  static async getOverdueMaintenance(): Promise<Equipment[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT * FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate < CAST(GETDATE() AS DATE)
        ORDER BY nextMaintenanceDate ASC
      `);

    return result.recordset;
  }

  static async getUpcomingDue(days: number = 30): Promise<{ calibration: Equipment[]; maintenance: Equipment[] }> {
    const pool = await getConnection();
    
    // Get upcoming calibrations
    const calibrationResult = await pool
      .request()
      .input('days', sql.Int, days)
      .query(`
        SELECT * FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate >= CAST(GETDATE() AS DATE)
        AND nextCalibrationDate <= DATEADD(day, @days, GETDATE())
        ORDER BY nextCalibrationDate ASC
      `);

    // Get upcoming maintenance
    const maintenanceResult = await pool
      .request()
      .input('days', sql.Int, days)
      .query(`
        SELECT * FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate >= CAST(GETDATE() AS DATE)
        AND nextMaintenanceDate <= DATEADD(day, @days, GETDATE())
        ORDER BY nextMaintenanceDate ASC
      `);

    return {
      calibration: calibrationResult.recordset,
      maintenance: maintenanceResult.recordset,
    };
  }

  static async getEquipmentOverviewMetrics(upcomingDays: number = 30): Promise<{
    total: number;
    byStatus: Record<string, number>;
    overdue: {
      calibration: number;
      maintenance: number;
      total: number;
    };
    upcoming: {
      calibration: number;
      maintenance: number;
      total: number;
    };
  }> {
    const pool = await getConnection();
    
    // Get total count and status breakdown
    const statusResult = await pool
      .request()
      .query(`
        SELECT 
          COUNT(*) as total,
          status,
          COUNT(*) as count
        FROM Equipment
        GROUP BY status
      `);

    // Get total count
    const totalResult = await pool
      .request()
      .query(`SELECT COUNT(*) as total FROM Equipment`);

    // Get overdue calibration count
    const overdueCalibrationResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate < CAST(GETDATE() AS DATE)
      `);

    // Get overdue maintenance count
    const overdueMaintenanceResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate < CAST(GETDATE() AS DATE)
      `);

    // Get upcoming calibration count
    const upcomingCalibrationResult = await pool
      .request()
      .input('days', sql.Int, upcomingDays)
      .query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate >= CAST(GETDATE() AS DATE)
        AND nextCalibrationDate <= DATEADD(day, @days, GETDATE())
      `);

    // Get upcoming maintenance count
    const upcomingMaintenanceResult = await pool
      .request()
      .input('days', sql.Int, upcomingDays)
      .query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate >= CAST(GETDATE() AS DATE)
        AND nextMaintenanceDate <= DATEADD(day, @days, GETDATE())
      `);

    // Build status breakdown
    const byStatus: Record<string, number> = {};
    statusResult.recordset.forEach((row: any) => {
      if (row.status) {
        byStatus[row.status] = row.count;
      }
    });

    const overdueCalibrationCount = overdueCalibrationResult.recordset[0]?.count || 0;
    const overdueMaintenanceCount = overdueMaintenanceResult.recordset[0]?.count || 0;
    const upcomingCalibrationCount = upcomingCalibrationResult.recordset[0]?.count || 0;
    const upcomingMaintenanceCount = upcomingMaintenanceResult.recordset[0]?.count || 0;

    return {
      total: totalResult.recordset[0]?.total || 0,
      byStatus,
      overdue: {
        calibration: overdueCalibrationCount,
        maintenance: overdueMaintenanceCount,
        total: overdueCalibrationCount + overdueMaintenanceCount,
      },
      upcoming: {
        calibration: upcomingCalibrationCount,
        maintenance: upcomingMaintenanceCount,
        total: upcomingCalibrationCount + upcomingMaintenanceCount,
      },
    };
  }
}
