# Data Import Templates Implementation

## Overview

This document describes the implementation of the data import templates feature for E-QMS. This feature allows superusers to import structured data from Excel templates into the system, supporting bulk data entry from external systems.

## Features Implemented

### 1. Excel Template Generation
- **Supported Entity Types:**
  - Users
  - Equipment
  - Training Records
  - Suppliers
  - Document Metadata

- **Template Structure:**
  - Professional styling with color-coded headers
  - Required fields marked with asterisk (*)
  - Example row with sample data
  - Separate instructions worksheet with:
    - Column descriptions
    - Required field indicators
    - General import guidelines
    - Date format specifications

### 2. File Upload and Validation
- **File Parsing:**
  - Reads Excel files (.xlsx format) using ExcelJS library
  - Parses "Data" worksheet
  - Skips header and example rows automatically
  - Handles empty rows gracefully

- **Validation Rules:**
  - **Users:**
    - Email format validation
    - Required fields: Email, First Name, Last Name, Role Names
    - Role name validation against existing roles
  
  - **Equipment:**
    - Required fields: Equipment Number, Name, Location
    - Status validation (operational, maintenance, out_of_service, calibration_due)
    - Unique equipment number check
  
  - **Training:**
    - Required fields: Training Number, Title, Category, Scheduled Date
    - Date format validation (YYYY-MM-DD)
    - Status validation (scheduled, completed, cancelled, expired)
  
  - **Suppliers:**
    - Required fields: Supplier Number, Name, Category
    - Email format validation (if provided)
    - Unique supplier number check
  
  - **Documents:**
    - Required fields: Title, Document Type, Category
    - Status validation (draft, review, approved, obsolete)
    - Date format validation for effective and review dates

### 3. Preview Functionality
- **Summary Statistics:**
  - Total rows in file
  - Valid rows count
  - Invalid rows count
  - Visual indicators for each

- **Row-by-Row Preview:**
  - First 10 rows displayed
  - Validation status per row
  - Data preview (first 3 fields)
  - Detailed error messages with field names

### 4. Import Execution
- **Transaction Management:**
  - All imports wrapped in SQL transaction
  - Automatic rollback on any failure
  - All-or-nothing approach ensures data integrity

- **Entity-Specific Import Logic:**
  - **Users:** 
    - Generates temporary password
    - Hashes password with bcrypt
    - Assigns roles automatically
    - Marks as "must change password"
  
  - **Equipment:** 
    - Creates equipment record
    - Sets default status if not provided
    - Handles optional calibration intervals
  
  - **Training:** 
    - Creates training session
    - Parses scheduled dates
    - Sets default status
  
  - **Suppliers:** 
    - Creates supplier record
    - Handles optional contact information
    - Sets up address fields
  
  - **Documents:** 
    - Creates document metadata
    - Sets version number (default 1.0)
    - Handles optional dates

### 5. Import History and Audit Trail
- **Comprehensive Logging:**
  - Import type
  - File name and size
  - Total, success, and failed row counts
  - Detailed error information (JSON format)
  - User who performed import
  - Timestamps (start and completion)
  - IP address and user agent

- **History View:**
  - Paginated list of past imports
  - Filter by type, status, user
  - Status badges with color coding
  - Success/failure counts

## Database Schema

### DataImportLogs Table
```sql
CREATE TABLE DataImportLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    importType NVARCHAR(100) NOT NULL,
    fileName NVARCHAR(500) NOT NULL,
    fileSize INT,
    status NVARCHAR(50) NOT NULL DEFAULT 'in_progress',
    totalRows INT NOT NULL DEFAULT 0,
    successRows INT NOT NULL DEFAULT 0,
    failedRows INT NOT NULL DEFAULT 0,
    errorDetails NVARCHAR(MAX),
    importedBy INT NOT NULL,
    startedAt DATETIME2 DEFAULT GETDATE(),
    completedAt DATETIME2,
    ipAddress NVARCHAR(50),
    userAgent NVARCHAR(500),
    CONSTRAINT FK_DataImportLogs_User FOREIGN KEY (importedBy) REFERENCES Users(id)
);
```

## API Endpoints

All endpoints require superuser role.

### GET /api/imports/templates
Get list of available import templates.

**Response:**
```json
[
  {
    "type": "users",
    "name": "Users",
    "description": "Import users data from Excel"
  }
]
```

### GET /api/imports/templates/:type
Download Excel template for specific type.

**Parameters:**
- `type`: One of: users, equipment, training, suppliers, documents

**Response:** Excel file download

### POST /api/imports/preview
Upload Excel file and get preview of data.

**Request:** multipart/form-data
- `file`: Excel file
- `type`: Import type

**Response:**
```json
{
  "success": true,
  "fileName": "users.xlsx",
  "fileSize": 12345,
  "tempFilePath": "/tmp/upload_xxx.xlsx",
  "preview": {
    "totalRows": 10,
    "validRows": 8,
    "invalidRows": 2,
    "hasErrors": true,
    "rows": [
      {
        "rowNumber": 3,
        "data": { "Email": "user@example.com", ... },
        "errors": []
      }
    ]
  }
}
```

### POST /api/imports/execute
Execute import after preview confirmation.

**Request:**
```json
{
  "type": "users",
  "tempFilePath": "/tmp/upload_xxx.xlsx",
  "fileName": "users.xlsx",
  "fileSize": 12345
}
```

**Response:**
```json
{
  "success": true,
  "importLogId": 123,
  "result": {
    "successCount": 8,
    "failureCount": 0,
    "errors": []
  }
}
```

### GET /api/imports/history
Get import history with pagination.

**Query Parameters:**
- `importType` (optional): Filter by type
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "logs": [
    {
      "id": 123,
      "importType": "users",
      "fileName": "users.xlsx",
      "status": "completed",
      "totalRows": 10,
      "successRows": 10,
      "failedRows": 0,
      "startedAt": "2025-11-19T10:00:00Z",
      "completedAt": "2025-11-19T10:00:05Z",
      "firstName": "Admin",
      "lastName": "User"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

### GET /api/imports/history/:id
Get detailed import log by ID.

**Response:** Single import log object

## Frontend Components

### DataImport Page (`/data-import`)
Full-featured import UI with:
- Step-by-step workflow
- Template download
- File upload with drag-and-drop support
- Data preview table
- Import confirmation
- Result display
- History view

### Import Service
TypeScript service for API communication:
- `getAvailableTemplates()`
- `downloadTemplate(type)`
- `uploadAndPreview(file, type)`
- `executeImport(data)`
- `getImportHistory(params)`
- `getImportLogDetails(id)`

## Security Features

1. **RBAC Enforcement:**
   - All import endpoints require superuser role
   - Enforced at route level with middleware
   - Navigation link only visible to superusers

2. **Data Validation:**
   - Comprehensive field validation before import
   - Prevents invalid data entry
   - Clear error messages for users

3. **Transaction Safety:**
   - Automatic rollback on errors
   - Prevents partial imports
   - Maintains data integrity

4. **Audit Trail:**
   - Complete logging of all imports
   - User attribution
   - Timestamp tracking
   - Error details preserved

5. **Duplicate Detection:**
   - Checks for existing records by unique identifiers
   - Prevents duplicate entries
   - Clear error messages on conflicts

## Usage Instructions

### For Administrators

1. **Access Import Page:**
   - Navigate to "Data Import" in the main menu (superusers only)

2. **Download Template:**
   - Select the data type you want to import
   - Click "Download Template"
   - Open the Excel file

3. **Fill Template:**
   - Review the Instructions worksheet
   - Fill data in the Data worksheet
   - Follow required field guidelines
   - Delete the example row
   - Use correct date format (YYYY-MM-DD)

4. **Upload and Preview:**
   - Select import type
   - Choose your filled Excel file
   - Click "Upload & Preview"
   - Review validation results

5. **Execute Import:**
   - If no errors, click "Execute Import"
   - Confirm the import
   - Review import results

6. **Check History:**
   - View past imports in the History section
   - Check success/failure counts
   - Review error details if needed

## File Structure

### Backend
```
backend/
├── database/
│   └── migrations/
│       └── 004_create_data_import_logs_table.sql
├── src/
│   ├── controllers/
│   │   └── importController.ts
│   ├── models/
│   │   └── DataImportModel.ts
│   ├── routes/
│   │   └── importRoutes.ts
│   └── services/
│       ├── importTemplateService.ts
│       ├── importParserService.ts
│       └── importExecutionService.ts
```

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   └── DataImport.tsx
│   ├── services/
│   │   └── importService.ts
│   └── styles/
│       └── DataImport.css
```

## Dependencies Added

### Backend
- `exceljs`: ^4.x - Excel file generation and parsing
- `@types/exceljs`: ^1.x - TypeScript definitions

### Frontend
- No new dependencies (uses existing axios)

## Testing Recommendations

1. **Template Generation:**
   - Download each template type
   - Verify column headers and formatting
   - Check instructions worksheet

2. **File Upload:**
   - Test with valid Excel files
   - Test with invalid files
   - Test with large files

3. **Validation:**
   - Test each validation rule
   - Test required fields
   - Test format validations
   - Test duplicate detection

4. **Import Execution:**
   - Test successful imports
   - Test rollback on errors
   - Test with mixed valid/invalid data

5. **RBAC:**
   - Verify superuser access
   - Verify non-superuser blocking
   - Test navigation visibility

6. **Audit Logging:**
   - Verify all imports are logged
   - Check error details are captured
   - Verify user attribution

## Known Limitations

1. **File Size:**
   - Maximum file size: 10MB (configurable in upload middleware)
   - Large imports may take time

2. **Batch Size:**
   - No limit on rows per import
   - Very large files may cause timeout

3. **Data Types:**
   - Currently supports 5 entity types
   - Can be extended for other entities

4. **Duplicate Handling:**
   - Duplicates are rejected, not updated
   - Use unique identifiers carefully

5. **Date Format:**
   - Requires YYYY-MM-DD format
   - Excel date values are supported

## Future Enhancements

1. Support for updating existing records
2. Dry-run mode for testing imports
3. Schedule imports for later execution
4. Email notifications on import completion
5. More detailed validation rules per entity
6. Support for additional entity types
7. Import from other file formats (CSV, JSON)
8. Export existing data to template format

## Maintenance

### Database Migration
Run the migration script to create the DataImportLogs table:
```sql
-- Located at: backend/database/migrations/004_create_data_import_logs_table.sql
USE eqms;
GO
-- Execute the script
```

### Cleanup Old Logs
Use the DataImportModel method to clean up old logs:
```typescript
// Delete logs older than 90 days
await DataImportModel.deleteOlderThan(90);
```

## Troubleshooting

### Import Fails with "Invalid file type"
- Ensure file is .xlsx format (Excel 2007+)
- File must contain a "Data" worksheet

### Validation Errors
- Check required fields are filled
- Verify date format is YYYY-MM-DD
- Ensure unique identifiers are truly unique

### Import Fails Completely
- Check error details in import log
- Verify database connection
- Check for constraint violations
- Review transaction rollback messages

### Template Won't Download
- Verify superuser permissions
- Check backend API is running
- Review browser console for errors

## Support

For issues or questions about the data import feature:
1. Check this documentation
2. Review import history for error details
3. Check backend logs for detailed error messages
4. Verify database migration was applied

---

**Implementation Date:** November 2025  
**Version:** 1.0  
**Author:** GitHub Copilot Agent
