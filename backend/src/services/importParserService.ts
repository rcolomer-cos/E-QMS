import ExcelJS from 'exceljs';
import { ImportTemplateType } from './importTemplateService';
import { ImportError } from '../models/DataImportModel';

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: ImportError[];
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  hasErrors: boolean;
}

/**
 * Service for parsing and validating imported Excel files
 */
export class ImportParserService {
  /**
   * Parse Excel file and validate data
   */
  static async parseFile(
    filePath: string,
    type: ImportTemplateType
  ): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Data');
    if (!worksheet) {
      throw new Error('Excel file must contain a "Data" worksheet');
    }

    const rows: ParsedRow[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Get header row
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.text.trim();
    });

    // Process data rows (skip header and example row)
    worksheet.eachRow((row, rowNumber) => {
      // Skip header row, example row, and empty rows
      if (rowNumber <= 2 || row.actualCellCount === 0) {
        return;
      }

      const rowData: Record<string, unknown> = {};
      const errors: ImportError[] = [];

      // Parse each cell
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          // Remove the asterisk from header name for data key
          const key = this.getFieldKey(header);
          rowData[key] = this.parseCellValue(cell);
        }
      });

      // Validate row based on type
      const validationErrors = this.validateRow(rowData, type, rowNumber);
      errors.push(...validationErrors);

      if (errors.length > 0) {
        invalidRows++;
      } else {
        validRows++;
      }

      rows.push({
        rowNumber,
        data: rowData,
        errors,
      });
    });

    return {
      rows,
      totalRows: rows.length,
      validRows,
      invalidRows,
      hasErrors: invalidRows > 0,
    };
  }

  /**
   * Get field key from header (removes asterisk and extra spaces)
   */
  private static getFieldKey(header: string): string {
    return header.replace(/\*/g, '').trim().replace(/\s+/g, '');
  }

  /**
   * Parse cell value to appropriate type
   */
  private static parseCellValue(cell: ExcelJS.Cell): unknown {
    if (!cell.value) {
      return null;
    }

    // Handle date cells
    if (cell.type === ExcelJS.ValueType.Date) {
      return cell.value;
    }

    // Handle formula cells
    if (cell.type === ExcelJS.ValueType.Formula) {
      return cell.result;
    }

    // Convert to string and trim
    const stringValue = String(cell.value).trim();
    
    // Return null for empty strings
    if (stringValue === '') {
      return null;
    }

    return stringValue;
  }

  /**
   * Validate row data based on template type
   */
  private static validateRow(
    data: Record<string, unknown>,
    type: ImportTemplateType,
    rowNumber: number
  ): ImportError[] {
    const errors: ImportError[] = [];

    switch (type) {
      case 'users':
        errors.push(...this.validateUserRow(data, rowNumber));
        break;
      case 'equipment':
        errors.push(...this.validateEquipmentRow(data, rowNumber));
        break;
      case 'training':
        errors.push(...this.validateTrainingRow(data, rowNumber));
        break;
      case 'suppliers':
        errors.push(...this.validateSupplierRow(data, rowNumber));
        break;
      case 'documents':
        errors.push(...this.validateDocumentRow(data, rowNumber));
        break;
    }

    return errors;
  }

  /**
   * Validate user row
   */
  private static validateUserRow(data: Record<string, unknown>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Required fields
    if (!data.Email) {
      errors.push({ row: rowNumber, field: 'Email', error: 'Email is required' });
    } else if (!this.isValidEmail(String(data.Email))) {
      errors.push({ row: rowNumber, field: 'Email', error: 'Invalid email format' });
    }

    if (!data.FirstName) {
      errors.push({ row: rowNumber, field: 'FirstName', error: 'First Name is required' });
    }

    if (!data.LastName) {
      errors.push({ row: rowNumber, field: 'LastName', error: 'Last Name is required' });
    }

    if (!data.RoleNames) {
      errors.push({ row: rowNumber, field: 'RoleNames', error: 'Role Names is required' });
    }

    return errors;
  }

  /**
   * Validate equipment row
   */
  private static validateEquipmentRow(data: Record<string, unknown>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    if (!data.EquipmentNumber) {
      errors.push({ row: rowNumber, field: 'EquipmentNumber', error: 'Equipment Number is required' });
    }

    if (!data.Name) {
      errors.push({ row: rowNumber, field: 'Name', error: 'Name is required' });
    }

    if (!data.Location) {
      errors.push({ row: rowNumber, field: 'Location', error: 'Location is required' });
    }

    // Validate status if provided
    if (data.Status) {
      const validStatuses = ['operational', 'maintenance', 'out_of_service', 'calibration_due'];
      if (!validStatuses.includes(String(data.Status).toLowerCase())) {
        errors.push({ 
          row: rowNumber, 
          field: 'Status', 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    return errors;
  }

  /**
   * Validate training row
   */
  private static validateTrainingRow(data: Record<string, unknown>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    if (!data.TrainingNumber) {
      errors.push({ row: rowNumber, field: 'TrainingNumber', error: 'Training Number is required' });
    }

    if (!data.Title) {
      errors.push({ row: rowNumber, field: 'Title', error: 'Title is required' });
    }

    if (!data.Category) {
      errors.push({ row: rowNumber, field: 'Category', error: 'Category is required' });
    }

    if (!data.ScheduledDate) {
      errors.push({ row: rowNumber, field: 'ScheduledDate', error: 'Scheduled Date is required' });
    } else if (!this.isValidDate(data.ScheduledDate)) {
      errors.push({ row: rowNumber, field: 'ScheduledDate', error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate status if provided
    if (data.Status) {
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'expired'];
      if (!validStatuses.includes(String(data.Status).toLowerCase())) {
        errors.push({ 
          row: rowNumber, 
          field: 'Status', 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    return errors;
  }

  /**
   * Validate supplier row
   */
  private static validateSupplierRow(data: Record<string, unknown>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    if (!data.SupplierNumber) {
      errors.push({ row: rowNumber, field: 'SupplierNumber', error: 'Supplier Number is required' });
    }

    if (!data.Name) {
      errors.push({ row: rowNumber, field: 'Name', error: 'Name is required' });
    }

    if (!data.Category) {
      errors.push({ row: rowNumber, field: 'Category', error: 'Category is required' });
    }

    // Validate email if provided
    if (data.Email && !this.isValidEmail(String(data.Email))) {
      errors.push({ row: rowNumber, field: 'Email', error: 'Invalid email format' });
    }

    return errors;
  }

  /**
   * Validate document row
   */
  private static validateDocumentRow(data: Record<string, unknown>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    if (!data.Title) {
      errors.push({ row: rowNumber, field: 'Title', error: 'Title is required' });
    }

    if (!data.DocumentType) {
      errors.push({ row: rowNumber, field: 'DocumentType', error: 'Document Type is required' });
    }

    if (!data.Category) {
      errors.push({ row: rowNumber, field: 'Category', error: 'Category is required' });
    }

    // Validate status if provided
    if (data.Status) {
      const validStatuses = ['draft', 'review', 'approved', 'obsolete'];
      if (!validStatuses.includes(String(data.Status).toLowerCase())) {
        errors.push({ 
          row: rowNumber, 
          field: 'Status', 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    // Validate dates if provided
    if (data.EffectiveDate && !this.isValidDate(data.EffectiveDate)) {
      errors.push({ row: rowNumber, field: 'EffectiveDate', error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (data.ReviewDate && !this.isValidDate(data.ReviewDate)) {
      errors.push({ row: rowNumber, field: 'ReviewDate', error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format
   */
  private static isValidDate(value: unknown): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }

    if (typeof value === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return false;
      }
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    return false;
  }
}
