import { getConnection } from '../config/database';
import { ImportTemplateType } from './importTemplateService';
import { ParsedRow } from './importParserService';
import { ImportError } from '../models/DataImportModel';
import bcrypt from 'bcrypt';

export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: ImportError[];
}

/**
 * Service for executing data imports
 */
export class ImportExecutionService {
  /**
   * Execute import for all valid rows
   */
  static async executeImport(
    rows: ParsedRow[],
    type: ImportTemplateType,
    userId: number
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // Use transaction for data integrity
    const pool = await getConnection();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      for (const row of rows) {
        // Skip rows with validation errors
        if (row.errors.length > 0) {
          result.failureCount++;
          result.errors.push(...row.errors);
          continue;
        }

        try {
          switch (type) {
            case 'users':
              await this.importUser(row.data, userId, transaction);
              break;
            case 'equipment':
              await this.importEquipment(row.data, userId, transaction);
              break;
            case 'training':
              await this.importTraining(row.data, userId, transaction);
              break;
            case 'suppliers':
              await this.importSupplier(row.data, userId, transaction);
              break;
            case 'documents':
              await this.importDocument(row.data, userId, transaction);
              break;
          }

          result.successCount++;
        } catch (error) {
          result.failureCount++;
          result.errors.push({
            row: row.rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      }

      // If there were any failures, rollback transaction
      if (result.failureCount > 0) {
        await transaction.rollback();
        // Reset success count since we rolled back
        result.successCount = 0;
        result.errors.unshift({
          row: 0,
          error: 'Import failed with errors. All changes have been rolled back.',
        });
      } else {
        await transaction.commit();
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return result;
  }

  /**
   * Import user record
   */
  private static async importUser(
    data: Record<string, unknown>,
    createdBy: number,
    transaction: any
  ): Promise<void> {
    const email = String(data.Email).toLowerCase();
    const firstName = String(data.FirstName);
    const lastName = String(data.LastName);
    const department = data.Department ? String(data.Department) : null;
    const phone = data.Phone ? String(data.Phone) : null;
    const roleNames = String(data.RoleNames).split(',').map(r => r.trim().toLowerCase());

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Check if user already exists
    const existingUser = await transaction.request()
      .input('email', email)
      .query('SELECT id FROM Users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Insert user
    const userResult = await transaction.request()
      .input('email', email)
      .input('password', hashedPassword)
      .input('firstName', firstName)
      .input('lastName', lastName)
      .input('department', department)
      .input('phone', phone)
      .input('createdBy', createdBy)
      .input('mustChangePassword', true)
      .query(`
        INSERT INTO Users 
          (email, password, firstName, lastName, department, phone, createdBy, mustChangePassword)
        OUTPUT INSERTED.id
        VALUES 
          (@email, @password, @firstName, @lastName, @department, @phone, @createdBy, @mustChangePassword)
      `);

    const userId = userResult.recordset[0].id;

    // Assign roles
    for (const roleName of roleNames) {
      const roleResult = await transaction.request()
        .input('roleName', roleName)
        .query('SELECT id FROM Roles WHERE name = @roleName');

      if (roleResult.recordset.length === 0) {
        throw new Error(`Role ${roleName} not found`);
      }

      const roleId = roleResult.recordset[0].id;

      await transaction.request()
        .input('userId', userId)
        .input('roleId', roleId)
        .input('assignedBy', createdBy)
        .query(`
          INSERT INTO UserRoles (userId, roleId, assignedBy)
          VALUES (@userId, @roleId, @assignedBy)
        `);
    }
  }

  /**
   * Import equipment record
   */
  private static async importEquipment(
    data: Record<string, unknown>,
    createdBy: number,
    transaction: any
  ): Promise<void> {
    // Check if equipment number already exists
    const existingEquipment = await transaction.request()
      .input('equipmentNumber', String(data.EquipmentNumber))
      .query('SELECT id FROM Equipment WHERE equipmentNumber = @equipmentNumber');

    if (existingEquipment.recordset.length > 0) {
      throw new Error(`Equipment with number ${data.EquipmentNumber} already exists`);
    }

    await transaction.request()
      .input('equipmentNumber', String(data.EquipmentNumber))
      .input('name', String(data.Name))
      .input('description', data.Description ? String(data.Description) : null)
      .input('manufacturer', data.Manufacturer ? String(data.Manufacturer) : null)
      .input('model', data.Model ? String(data.Model) : null)
      .input('serialNumber', data.SerialNumber ? String(data.SerialNumber) : null)
      .input('location', String(data.Location))
      .input('department', data.Department ? String(data.Department) : null)
      .input('status', data.Status ? String(data.Status).toLowerCase() : 'operational')
      .input('calibrationInterval', data['CalibrationInterval(days)'] ? parseInt(String(data['CalibrationInterval(days)']), 10) : null)
      .input('createdBy', createdBy)
      .query(`
        INSERT INTO Equipment 
          (equipmentNumber, name, description, manufacturer, model, serialNumber, 
           location, department, status, calibrationInterval, createdBy)
        VALUES 
          (@equipmentNumber, @name, @description, @manufacturer, @model, @serialNumber,
           @location, @department, @status, @calibrationInterval, @createdBy)
      `);
  }

  /**
   * Import training record
   */
  private static async importTraining(
    data: Record<string, unknown>,
    createdBy: number,
    transaction: any
  ): Promise<void> {
    // Check if training number already exists
    const existingTraining = await transaction.request()
      .input('trainingNumber', String(data.TrainingNumber))
      .query('SELECT id FROM Trainings WHERE trainingNumber = @trainingNumber');

    if (existingTraining.recordset.length > 0) {
      throw new Error(`Training with number ${data.TrainingNumber} already exists`);
    }

    await transaction.request()
      .input('trainingNumber', String(data.TrainingNumber))
      .input('title', String(data.Title))
      .input('description', data.Description ? String(data.Description) : null)
      .input('category', String(data.Category))
      .input('trainingType', data.TrainingType ? String(data.TrainingType) : null)
      .input('duration', data['Duration(minutes)'] ? parseInt(String(data['Duration(minutes)']), 10) : null)
      .input('instructor', data.Instructor ? String(data.Instructor) : null)
      .input('location', data.Location ? String(data.Location) : null)
      .input('scheduledDate', new Date(String(data.ScheduledDate)))
      .input('status', data.Status ? String(data.Status).toLowerCase() : 'scheduled')
      .input('createdBy', createdBy)
      .query(`
        INSERT INTO Trainings 
          (trainingNumber, title, description, category, trainingType, duration, 
           instructor, location, scheduledDate, status, createdBy)
        VALUES 
          (@trainingNumber, @title, @description, @category, @trainingType, @duration,
           @instructor, @location, @scheduledDate, @status, @createdBy)
      `);
  }

  /**
   * Import supplier record
   */
  private static async importSupplier(
    data: Record<string, unknown>,
    createdBy: number,
    transaction: any
  ): Promise<void> {
    // Check if supplier number already exists
    const existingSupplier = await transaction.request()
      .input('supplierNumber', String(data.SupplierNumber))
      .query('SELECT id FROM Suppliers WHERE supplierNumber = @supplierNumber');

    if (existingSupplier.recordset.length > 0) {
      throw new Error(`Supplier with number ${data.SupplierNumber} already exists`);
    }

    await transaction.request()
      .input('supplierNumber', String(data.SupplierNumber))
      .input('name', String(data.Name))
      .input('description', data.Description ? String(data.Description) : null)
      .input('contactPerson', data.ContactPerson ? String(data.ContactPerson) : null)
      .input('email', data.Email ? String(data.Email) : null)
      .input('phone', data.Phone ? String(data.Phone) : null)
      .input('website', data.Website ? String(data.Website) : null)
      .input('addressLine1', data.AddressLine1 ? String(data.AddressLine1) : null)
      .input('city', data.City ? String(data.City) : null)
      .input('stateProvince', data['State/Province'] ? String(data['State/Province']) : null)
      .input('postalCode', data.PostalCode ? String(data.PostalCode) : null)
      .input('country', data.Country ? String(data.Country) : null)
      .input('category', String(data.Category))
      .input('supplierType', data.SupplierType ? String(data.SupplierType) : null)
      .input('createdBy', createdBy)
      .query(`
        INSERT INTO Suppliers 
          (supplierNumber, name, description, contactPerson, email, phone, website,
           addressLine1, city, stateProvince, postalCode, country, category, supplierType, createdBy)
        VALUES 
          (@supplierNumber, @name, @description, @contactPerson, @email, @phone, @website,
           @addressLine1, @city, @stateProvince, @postalCode, @country, @category, @supplierType, @createdBy)
      `);
  }

  /**
   * Import document metadata record
   */
  private static async importDocument(
    data: Record<string, unknown>,
    createdBy: number,
    transaction: any
  ): Promise<void> {
    await transaction.request()
      .input('title', String(data.Title))
      .input('description', data.Description ? String(data.Description) : null)
      .input('documentType', String(data.DocumentType))
      .input('category', String(data.Category))
      .input('version', data.Version ? String(data.Version) : '1.0')
      .input('status', data.Status ? String(data.Status).toLowerCase() : 'draft')
      .input('effectiveDate', data.EffectiveDate ? new Date(String(data.EffectiveDate)) : null)
      .input('reviewDate', data.ReviewDate ? new Date(String(data.ReviewDate)) : null)
      .input('createdBy', createdBy)
      .query(`
        INSERT INTO Documents 
          (title, description, documentType, category, version, status, 
           effectiveDate, reviewDate, createdBy)
        VALUES 
          (@title, @description, @documentType, @category, @version, @status,
           @effectiveDate, @reviewDate, @createdBy)
      `);
  }

  /**
   * Generate temporary password for new users
   */
  private static generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const length = 12;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
