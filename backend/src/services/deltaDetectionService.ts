import { SyncConfiguration } from '../models/SyncConfigurationModel';
import { getConnection, sql } from '../config/database';

/**
 * Delta Detection Service
 * Detects changes since last sync to minimize data transfer
 */
export class DeltaDetectionService {
  /**
   * Detect changes since last sync
   */
  static async detectChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    if (!config.deltaEnabled) {
      return {
        hasChanges: true,
        changeCount: 0,
        changes: [],
      };
    }

    try {
      // Detect changes based on entity type
      switch (config.entityType) {
        case 'equipment':
          return await this.detectEquipmentChanges(config);
        
        case 'suppliers':
          return await this.detectSupplierChanges(config);
        
        case 'orders':
          return await this.detectOrderChanges(config);
        
        case 'inspections':
          return await this.detectInspectionChanges(config);
        
        case 'ncr':
          return await this.detectNCRChanges(config);
        
        case 'capa':
          return await this.detectCAPAChanges(config);
        
        default:
          // For unsupported entity types, assume changes exist
          return {
            hasChanges: true,
            changeCount: 0,
            changes: [],
          };
      }
    } catch (error) {
      console.error('Error detecting changes:', error);
      // On error, assume changes exist to be safe
      return {
        hasChanges: true,
        changeCount: 0,
        changes: [],
      };
    }
  }

  /**
   * Detect equipment changes
   */
  private static async detectEquipmentChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM Equipment WHERE 1=1';

    // Apply delta detection based on configuration
    if (config.lastSyncTimestamp && config.deltaField) {
      query += ` AND ${config.deltaField} > @lastSyncTimestamp`;
      request.input('lastSyncTimestamp', sql.DateTime2, config.lastSyncTimestamp);
    } else if (config.lastSyncRecordId) {
      query += ' AND id > @lastSyncRecordId';
      request.input('lastSyncRecordId', sql.Int, config.lastSyncRecordId);
    }

    query += ' ORDER BY id';

    const result = await request.query(query);
    const changes = result.recordset;

    return {
      hasChanges: changes.length > 0,
      changeCount: changes.length,
      changes,
    };
  }

  /**
   * Detect supplier changes
   */
  private static async detectSupplierChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM Suppliers WHERE 1=1';

    if (config.lastSyncTimestamp && config.deltaField) {
      query += ` AND ${config.deltaField} > @lastSyncTimestamp`;
      request.input('lastSyncTimestamp', sql.DateTime2, config.lastSyncTimestamp);
    } else if (config.lastSyncRecordId) {
      query += ' AND id > @lastSyncRecordId';
      request.input('lastSyncRecordId', sql.Int, config.lastSyncRecordId);
    }

    query += ' ORDER BY id';

    const result = await request.query(query);
    const changes = result.recordset;

    return {
      hasChanges: changes.length > 0,
      changeCount: changes.length,
      changes,
    };
  }

  /**
   * Detect order changes
   */
  private static async detectOrderChanges(
    _config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    // Placeholder - orders table doesn't exist yet
    // In production, this would query the orders table
    return {
      hasChanges: false,
      changeCount: 0,
      changes: [],
    };
  }

  /**
   * Detect inspection changes
   */
  private static async detectInspectionChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM InspectionRecords WHERE 1=1';

    if (config.lastSyncTimestamp && config.deltaField) {
      query += ` AND ${config.deltaField} > @lastSyncTimestamp`;
      request.input('lastSyncTimestamp', sql.DateTime2, config.lastSyncTimestamp);
    } else if (config.lastSyncRecordId) {
      query += ' AND id > @lastSyncRecordId';
      request.input('lastSyncRecordId', sql.Int, config.lastSyncRecordId);
    }

    query += ' ORDER BY id';

    const result = await request.query(query);
    const changes = result.recordset;

    return {
      hasChanges: changes.length > 0,
      changeCount: changes.length,
      changes,
    };
  }

  /**
   * Detect NCR changes
   */
  private static async detectNCRChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM NCR WHERE 1=1';

    if (config.lastSyncTimestamp && config.deltaField) {
      query += ` AND ${config.deltaField} > @lastSyncTimestamp`;
      request.input('lastSyncTimestamp', sql.DateTime2, config.lastSyncTimestamp);
    } else if (config.lastSyncRecordId) {
      query += ' AND id > @lastSyncRecordId';
      request.input('lastSyncRecordId', sql.Int, config.lastSyncRecordId);
    }

    query += ' ORDER BY id';

    const result = await request.query(query);
    const changes = result.recordset;

    return {
      hasChanges: changes.length > 0,
      changeCount: changes.length,
      changes,
    };
  }

  /**
   * Detect CAPA changes
   */
  private static async detectCAPAChanges(
    config: SyncConfiguration
  ): Promise<{
    hasChanges: boolean;
    changeCount: number;
    changes: any[];
  }> {
    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM CAPA WHERE 1=1';

    if (config.lastSyncTimestamp && config.deltaField) {
      query += ` AND ${config.deltaField} > @lastSyncTimestamp`;
      request.input('lastSyncTimestamp', sql.DateTime2, config.lastSyncTimestamp);
    } else if (config.lastSyncRecordId) {
      query += ' AND id > @lastSyncRecordId';
      request.input('lastSyncRecordId', sql.Int, config.lastSyncRecordId);
    }

    query += ' ORDER BY id';

    const result = await request.query(query);
    const changes = result.recordset;

    return {
      hasChanges: changes.length > 0,
      changeCount: changes.length,
      changes,
    };
  }

  /**
   * Calculate the appropriate delta field for an entity type
   */
  static getDeltaField(entityType: string): string {
    // Most tables use 'updatedAt' for tracking changes
    // Some may use different fields
    switch (entityType) {
      case 'equipment':
      case 'suppliers':
      case 'ncr':
      case 'capa':
      case 'inspections':
        return 'updatedAt';
      
      default:
        return 'updatedAt';
    }
  }
}
