/**
 * System Service
 * Handles system initialization and health checks
 */

import { RoleModel } from '../models/RoleModel';
import { UserModel } from '../models/UserModel';
import { getConnection } from '../config/database';

export class SystemService {
  /**
   * Check if the system has any superusers
   * @returns true if at least one superuser exists
   */
  static async hasSuperUsers(): Promise<boolean> {
    return UserModel.hasSuperusers();
  }

  /**
   * Check if the system needs initialization
   * Returns true if database is ready but no superuser exists
   */
  static async needsInitialization(): Promise<{
    needsSetup: boolean;
    hasDatabase: boolean;
    hasSuperUser: boolean;
    databaseReady?: boolean;
    missingTables?: string[];
  }> {
    try {
      const pool = await getConnection();
      const requiredTables = [
        'DatabaseVersion',
        'Roles',
        'Users',
        'UserRoles',
        'Departments',
        'Processes',
        'ProcessOwners',
        'Documents',
        'DocumentRevisions',
        'Notifications',
        'Equipment'
      ];

      const tableListResult = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME IN (${requiredTables.map(t => `'${t}'`).join(',')})
      `);

      const existingTables = tableListResult.recordset.map((r: any) => r.TABLE_NAME);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      const hasUsersTable = existingTables.includes('Users');
      const databaseReady = missingTables.length === 0;

      // Check for superusers
      const hasSuperUser = hasUsersTable ? await UserModel.hasSuperusers() : false;

      return {
        needsSetup: !hasSuperUser,
        hasDatabase: hasUsersTable,
        hasSuperUser,
        databaseReady,
        missingTables,
      };
    } catch (error) {
      console.error('Error checking system initialization:', error);
      return {
        needsSetup: true,
        hasDatabase: false,
        hasSuperUser: false,
        databaseReady: false,
        missingTables: undefined,
      };
    }
  }

  /**
   * Create the first superuser account
   * @param email User's email address
   * @param password User's password
   * @param firstName User's first name
   * @param lastName User's last name
   * @returns The created user ID
   */
  static async createFirstSuperUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<number> {
    try {
      // Check if superuser already exists
      const hasSuperUser = await UserModel.hasSuperusers();
      if (hasSuperUser) {
        throw new Error('Superuser already exists');
      }

      // Get superuser role
      const superUserRole = await RoleModel.findByName('superuser');
      if (!superUserRole) {
        throw new Error('Superuser role not found in database');
      }

      // Create user with superuser role
      const userId = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        roleIds: [superUserRole.id],
        createdBy: 0, // System created
        mustChangePassword: false,
      });

      return userId;
    } catch (error) {
      console.error('Error creating first superuser:', error);
      throw error;
    }
  }

  /**
   * Get system status and health information
   */
  static async getSystemStatus(): Promise<{
    status: string;
    database: {
      connected: boolean;
      version?: string;
    };
    users: {
      total: number;
      active: number;
    };
    roles: {
      total: number;
    };
  }> {
    try {
      const pool = await getConnection();

      // Get database version
      const versionResult = await pool.request().query(`
        SELECT TOP 1 version, appliedAt
        FROM DatabaseVersion
        ORDER BY appliedAt DESC
      `);

      // Get user counts
      const userCountResult = await pool.request().query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active
        FROM Users
      `);

      // Get role count
      const roleCountResult = await pool.request().query(`
        SELECT COUNT(*) as total
        FROM Roles
        WHERE active = 1
      `);

      return {
        status: 'healthy',
        database: {
          connected: true,
          version: versionResult.recordset[0]?.version,
        },
        users: {
          total: userCountResult.recordset[0].total,
          active: userCountResult.recordset[0].active,
        },
        roles: {
          total: roleCountResult.recordset[0].total,
        },
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        status: 'error',
        database: {
          connected: false,
        },
        users: {
          total: 0,
          active: 0,
        },
        roles: {
          total: 0,
        },
      };
    }
  }
}
