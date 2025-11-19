import ExcelJS from 'exceljs';

export type ImportTemplateType = 'users' | 'equipment' | 'training' | 'suppliers' | 'documents';

interface TemplateColumn {
  header: string;
  key: string;
  width: number;
  description?: string;
  example?: string;
  required?: boolean;
}

/**
 * Template definitions for each import type
 */
const TEMPLATE_DEFINITIONS: Record<ImportTemplateType, TemplateColumn[]> = {
  users: [
    { header: 'Email*', key: 'email', width: 30, required: true, description: 'User email address (must be unique)', example: 'john.doe@company.com' },
    { header: 'First Name*', key: 'firstName', width: 20, required: true, description: 'User first name', example: 'John' },
    { header: 'Last Name*', key: 'lastName', width: 20, required: true, description: 'User last name', example: 'Doe' },
    { header: 'Department', key: 'department', width: 20, required: false, description: 'Department name', example: 'Quality Assurance' },
    { header: 'Phone', key: 'phone', width: 20, required: false, description: 'Phone number', example: '+1-555-0100' },
    { header: 'Role Names*', key: 'roles', width: 30, required: true, description: 'Comma-separated role names', example: 'user,auditor' },
  ],
  
  equipment: [
    { header: 'Equipment Number*', key: 'equipmentNumber', width: 20, required: true, description: 'Unique equipment identifier', example: 'EQP-001' },
    { header: 'Name*', key: 'name', width: 30, required: true, description: 'Equipment name', example: 'Digital Caliper' },
    { header: 'Description', key: 'description', width: 40, required: false, description: 'Detailed description', example: 'High precision digital caliper' },
    { header: 'Manufacturer', key: 'manufacturer', width: 20, required: false, description: 'Manufacturer name', example: 'Mitutoyo' },
    { header: 'Model', key: 'model', width: 20, required: false, description: 'Model number', example: 'CD-6"CSX' },
    { header: 'Serial Number', key: 'serialNumber', width: 20, required: false, description: 'Serial number', example: 'SN123456' },
    { header: 'Location*', key: 'location', width: 20, required: true, description: 'Physical location', example: 'Lab A' },
    { header: 'Department', key: 'department', width: 20, required: false, description: 'Department', example: 'Quality Control' },
    { header: 'Status', key: 'status', width: 15, required: false, description: 'Status (operational, maintenance, out_of_service)', example: 'operational' },
    { header: 'Calibration Interval (days)', key: 'calibrationInterval', width: 25, required: false, description: 'Calibration interval in days', example: '365' },
  ],
  
  training: [
    { header: 'Training Number*', key: 'trainingNumber', width: 20, required: true, description: 'Unique training identifier', example: 'TRN-001' },
    { header: 'Title*', key: 'title', width: 40, required: true, description: 'Training title', example: 'ISO 9001 Introduction' },
    { header: 'Description', key: 'description', width: 50, required: false, description: 'Training description', example: 'Introduction to ISO 9001 requirements' },
    { header: 'Category*', key: 'category', width: 20, required: true, description: 'Training category', example: 'Quality' },
    { header: 'Training Type', key: 'trainingType', width: 20, required: false, description: 'Type of training', example: 'Internal' },
    { header: 'Duration (minutes)', key: 'duration', width: 20, required: false, description: 'Duration in minutes', example: '120' },
    { header: 'Instructor', key: 'instructor', width: 25, required: false, description: 'Instructor name', example: 'Jane Smith' },
    { header: 'Location', key: 'location', width: 20, required: false, description: 'Training location', example: 'Conference Room A' },
    { header: 'Scheduled Date*', key: 'scheduledDate', width: 20, required: true, description: 'Scheduled date (YYYY-MM-DD)', example: '2025-12-01' },
    { header: 'Status', key: 'status', width: 15, required: false, description: 'Status (scheduled, completed, cancelled)', example: 'scheduled' },
  ],
  
  suppliers: [
    { header: 'Supplier Number*', key: 'supplierNumber', width: 20, required: true, description: 'Unique supplier identifier', example: 'SUP-001' },
    { header: 'Name*', key: 'name', width: 40, required: true, description: 'Supplier company name', example: 'ABC Manufacturing Inc.' },
    { header: 'Description', key: 'description', width: 50, required: false, description: 'Supplier description', example: 'Leading manufacturer of components' },
    { header: 'Contact Person', key: 'contactPerson', width: 25, required: false, description: 'Primary contact name', example: 'John Smith' },
    { header: 'Email', key: 'email', width: 30, required: false, description: 'Contact email', example: 'contact@abc-mfg.com' },
    { header: 'Phone', key: 'phone', width: 20, required: false, description: 'Phone number', example: '+1-555-0200' },
    { header: 'Website', key: 'website', width: 30, required: false, description: 'Company website', example: 'https://www.abc-mfg.com' },
    { header: 'Address Line 1', key: 'addressLine1', width: 40, required: false, description: 'Street address', example: '123 Industrial Blvd' },
    { header: 'City', key: 'city', width: 20, required: false, description: 'City', example: 'Springfield' },
    { header: 'State/Province', key: 'stateProvince', width: 20, required: false, description: 'State or province', example: 'IL' },
    { header: 'Postal Code', key: 'postalCode', width: 15, required: false, description: 'Postal/ZIP code', example: '62701' },
    { header: 'Country', key: 'country', width: 20, required: false, description: 'Country', example: 'USA' },
    { header: 'Category*', key: 'category', width: 25, required: true, description: 'Supplier category', example: 'Raw Materials' },
    { header: 'Supplier Type', key: 'supplierType', width: 20, required: false, description: 'Type of supplier', example: 'Manufacturer' },
  ],
  
  documents: [
    { header: 'Title*', key: 'title', width: 40, required: true, description: 'Document title', example: 'Quality Manual' },
    { header: 'Description', key: 'description', width: 50, required: false, description: 'Document description', example: 'Company quality management manual' },
    { header: 'Document Type*', key: 'documentType', width: 25, required: true, description: 'Document type', example: 'Policy' },
    { header: 'Category*', key: 'category', width: 20, required: true, description: 'Document category', example: 'Quality' },
    { header: 'Version', key: 'version', width: 15, required: false, description: 'Version number', example: '1.0' },
    { header: 'Status', key: 'status', width: 15, required: false, description: 'Status (draft, review, approved)', example: 'draft' },
    { header: 'Effective Date', key: 'effectiveDate', width: 20, required: false, description: 'Effective date (YYYY-MM-DD)', example: '2025-01-01' },
    { header: 'Review Date', key: 'reviewDate', width: 20, required: false, description: 'Review date (YYYY-MM-DD)', example: '2026-01-01' },
  ],
};

export class ImportTemplateService {
  /**
   * Generate Excel template for a specific import type
   */
  static async generateTemplate(type: ImportTemplateType): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    const columns = TEMPLATE_DEFINITIONS[type];
    
    if (!columns) {
      throw new Error(`Unknown template type: ${type}`);
    }

    // Set up columns
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add example row
    const exampleRow: Record<string, string> = {};
    columns.forEach(col => {
      if (col.example) {
        exampleRow[col.key] = col.example;
      }
    });
    worksheet.addRow(exampleRow);

    // Style example row
    worksheet.getRow(2).font = { italic: true, color: { argb: 'FF808080' } };
    worksheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [
      { header: 'Column', key: 'column', width: 30 },
      { header: 'Required', key: 'required', width: 15 },
      { header: 'Description', key: 'description', width: 60 },
    ];

    // Style instructions header
    instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    instructionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    instructionsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    instructionsSheet.getRow(1).height = 25;

    // Add column descriptions
    columns.forEach(col => {
      instructionsSheet.addRow({
        column: col.header,
        required: col.required ? 'Yes' : 'No',
        description: col.description || '',
      });
    });

    // Add general instructions
    instructionsSheet.addRow({});
    instructionsSheet.addRow({ column: 'GENERAL INSTRUCTIONS', required: '', description: '' });
    instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true, size: 14 };
    
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '1. Fill in the "Data" sheet with your information',
    });
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '2. Required fields are marked with * in the column header',
    });
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '3. The first row contains example data - delete it before importing',
    });
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '4. Do not modify column headers',
    });
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '5. Ensure date fields use YYYY-MM-DD format',
    });
    instructionsSheet.addRow({
      column: '',
      required: '',
      description: '6. Save the file and upload it to the import page',
    });

    return workbook;
  }

  /**
   * Get column definitions for a template type
   */
  static getTemplateColumns(type: ImportTemplateType): TemplateColumn[] {
    return TEMPLATE_DEFINITIONS[type] || [];
  }

  /**
   * Get all available template types
   */
  static getAvailableTemplates(): ImportTemplateType[] {
    return Object.keys(TEMPLATE_DEFINITIONS) as ImportTemplateType[];
  }
}
