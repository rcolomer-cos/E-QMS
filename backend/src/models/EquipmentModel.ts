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
  responsiblePerson?: number;
  imagePath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EquipmentModel {
  static async create(equipment: Equipment): Promise<number> {
    const pool = await getConnection();

    // Calculate next calibration date if lastCalibrationDate and calibrationInterval > 0
    let nextCalibrationDate = null;
    if (equipment.lastCalibrationDate && equipment.calibrationInterval && equipment.calibrationInterval > 0) {
      // Parse date in UTC to avoid timezone shifts
      const lastDate = new Date(equipment.lastCalibrationDate);
      const year = lastDate.getUTCFullYear();
      const month = lastDate.getUTCMonth();
      const day = lastDate.getUTCDate();
      nextCalibrationDate = new Date(Date.UTC(year, month, day));
      nextCalibrationDate.setUTCDate(nextCalibrationDate.getUTCDate() + equipment.calibrationInterval);
    }

    // Calculate next maintenance date if lastMaintenanceDate and maintenanceInterval > 0
    let nextMaintenanceDate = null;
    if (equipment.lastMaintenanceDate && equipment.maintenanceInterval && equipment.maintenanceInterval > 0) {
      // Parse date in UTC to avoid timezone shifts
      const lastDate = new Date(equipment.lastMaintenanceDate);
      const year = lastDate.getUTCFullYear();
      const month = lastDate.getUTCMonth();
      const day = lastDate.getUTCDate();
      nextMaintenanceDate = new Date(Date.UTC(year, month, day));
      nextMaintenanceDate.setUTCDate(nextMaintenanceDate.getUTCDate() + equipment.maintenanceInterval);
    }

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
      .input('lastCalibrationDate', sql.DateTime, equipment.lastCalibrationDate)
      .input('nextCalibrationDate', sql.DateTime, nextCalibrationDate)
      .input('calibrationInterval', sql.Int, equipment.calibrationInterval)
      .input('lastMaintenanceDate', sql.DateTime, equipment.lastMaintenanceDate)
      .input('nextMaintenanceDate', sql.DateTime, nextMaintenanceDate)
      .input('maintenanceInterval', sql.Int, equipment.maintenanceInterval)
      .input('responsiblePerson', sql.Int, equipment.responsiblePerson)
      .input('imagePath', sql.NVarChar, equipment.imagePath)
      .query(`
        INSERT INTO Equipment (equipmentNumber, name, description, manufacturer, model, serialNumber, location, department, status, purchaseDate, lastCalibrationDate, nextCalibrationDate, calibrationInterval, lastMaintenanceDate, nextMaintenanceDate, maintenanceInterval, responsiblePerson, imagePath)
        OUTPUT INSERTED.id
        VALUES (@equipmentNumber, @name, @description, @manufacturer, @model, @serialNumber, @location, @department, @status, @purchaseDate, @lastCalibrationDate, @nextCalibrationDate, @calibrationInterval, @lastMaintenanceDate, @nextMaintenanceDate, @maintenanceInterval, @responsiblePerson, @imagePath)
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
    
    // Get current equipment data to check for changes in dates/intervals
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Equipment not found');
    }

    const request = pool.request().input('id', sql.Int, id);

    // Calculate next calibration date if needed
    if (updates.lastCalibrationDate !== undefined || updates.calibrationInterval !== undefined) {
      const lastCalibrationDate = updates.lastCalibrationDate !== undefined 
        ? updates.lastCalibrationDate 
        : current.lastCalibrationDate;
      const calibrationInterval = updates.calibrationInterval !== undefined 
        ? updates.calibrationInterval 
        : current.calibrationInterval;

      if (lastCalibrationDate && calibrationInterval && calibrationInterval > 0) {
        // Parse date in UTC to avoid timezone shifts
        const lastDate = new Date(lastCalibrationDate);
        const year = lastDate.getUTCFullYear();
        const month = lastDate.getUTCMonth();
        const day = lastDate.getUTCDate();
        const nextDate = new Date(Date.UTC(year, month, day));
        nextDate.setUTCDate(nextDate.getUTCDate() + Number(calibrationInterval));
        updates.nextCalibrationDate = nextDate;
      } else {
        // If interval is 0 or no last date, set next date to null
        updates.nextCalibrationDate = undefined;
      }
    }

    // Calculate next maintenance date if needed
    if (updates.lastMaintenanceDate !== undefined || updates.maintenanceInterval !== undefined) {
      const lastMaintenanceDate = updates.lastMaintenanceDate !== undefined 
        ? updates.lastMaintenanceDate 
        : current.lastMaintenanceDate;
      const maintenanceInterval = updates.maintenanceInterval !== undefined 
        ? updates.maintenanceInterval 
        : current.maintenanceInterval;

      if (lastMaintenanceDate && maintenanceInterval && maintenanceInterval > 0) {
        // Parse date in UTC to avoid timezone shifts
        const lastDate = new Date(lastMaintenanceDate);
        const year = lastDate.getUTCFullYear();
        const month = lastDate.getUTCMonth();
        const day = lastDate.getUTCDate();
        const nextDate = new Date(Date.UTC(year, month, day));
        nextDate.setUTCDate(nextDate.getUTCDate() + Number(maintenanceInterval));
        updates.nextMaintenanceDate = nextDate;
      } else {
        // If interval is 0 or no last date, set next date to null
        updates.nextMaintenanceDate = undefined;
      }
    }

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

  static async getEquipmentOverviewMetrics(upcomingDays: number = 30, filters?: {
    department?: string;
  }): Promise<{
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
    let whereConditions = '1=1';
    
    // Apply department filter
    if (filters?.department) {
      whereConditions += ` AND department = @department`;
    }
    
    // Get total count and status breakdown
    const statusRequest = pool.request();
    if (filters?.department) {
      statusRequest.input('department', sql.NVarChar, filters.department);
    }
    const statusResult = await statusRequest.query(`
        SELECT 
          COUNT(*) as total,
          status,
          COUNT(*) as count
        FROM Equipment
        WHERE ${whereConditions}
        GROUP BY status
      `);

    // Get total count
    const totalRequest = pool.request();
    if (filters?.department) {
      totalRequest.input('department', sql.NVarChar, filters.department);
    }
    const totalResult = await totalRequest.query(`SELECT COUNT(*) as total FROM Equipment WHERE ${whereConditions}`);

    // Get overdue calibration count
    const overdueCalibrationRequest = pool.request();
    if (filters?.department) {
      overdueCalibrationRequest.input('department', sql.NVarChar, filters.department);
    }
    const overdueCalibrationResult = await overdueCalibrationRequest.query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate < CAST(GETDATE() AS DATE)
        AND ${whereConditions}
      `);

    // Get overdue maintenance count
    const overdueMaintenanceRequest = pool.request();
    if (filters?.department) {
      overdueMaintenanceRequest.input('department', sql.NVarChar, filters.department);
    }
    const overdueMaintenanceResult = await overdueMaintenanceRequest.query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate < CAST(GETDATE() AS DATE)
        AND ${whereConditions}
      `);

    // Get upcoming calibration count
    const upcomingCalibrationRequest = pool.request();
    upcomingCalibrationRequest.input('days', sql.Int, upcomingDays);
    if (filters?.department) {
      upcomingCalibrationRequest.input('department', sql.NVarChar, filters.department);
    }
    const upcomingCalibrationResult = await upcomingCalibrationRequest.query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextCalibrationDate IS NOT NULL 
        AND nextCalibrationDate >= CAST(GETDATE() AS DATE)
        AND nextCalibrationDate <= DATEADD(day, @days, GETDATE())
        AND ${whereConditions}
      `);

    // Get upcoming maintenance count
    const upcomingMaintenanceRequest = pool.request();
    upcomingMaintenanceRequest.input('days', sql.Int, upcomingDays);
    if (filters?.department) {
      upcomingMaintenanceRequest.input('department', sql.NVarChar, filters.department);
    }
    const upcomingMaintenanceResult = await upcomingMaintenanceRequest.query(`
        SELECT COUNT(*) as count FROM Equipment 
        WHERE nextMaintenanceDate IS NOT NULL 
        AND nextMaintenanceDate >= CAST(GETDATE() AS DATE)
        AND nextMaintenanceDate <= DATEADD(day, @days, GETDATE())
        AND ${whereConditions}
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
