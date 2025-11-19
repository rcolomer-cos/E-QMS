-- =============================================
-- Migration: Create DataImportLogs Table
-- Version: 004
-- Description: Table for tracking data import operations
-- =============================================

USE eqms;
GO

PRINT 'Creating DataImportLogs table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DataImportLogs')
BEGIN
    CREATE TABLE DataImportLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Import Metadata
        importType NVARCHAR(100) NOT NULL, -- Type of data imported (Users, Equipment, Training, Suppliers, Documents)
        fileName NVARCHAR(500) NOT NULL, -- Original uploaded file name
        fileSize INT, -- File size in bytes
        
        -- Import Status
        status NVARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'partial'
        
        -- Import Results
        totalRows INT NOT NULL DEFAULT 0, -- Total rows in import file
        successRows INT NOT NULL DEFAULT 0, -- Successfully imported rows
        failedRows INT NOT NULL DEFAULT 0, -- Failed rows
        errorDetails NVARCHAR(MAX), -- JSON array of errors with row numbers
        
        -- User Information
        importedBy INT NOT NULL, -- User who performed the import
        
        -- Timestamps
        startedAt DATETIME2 DEFAULT GETDATE(),
        completedAt DATETIME2,
        
        -- Audit Trail
        ipAddress NVARCHAR(50), -- IP address of user who performed import
        userAgent NVARCHAR(500), -- Browser/client information
        
        CONSTRAINT FK_DataImportLogs_User FOREIGN KEY (importedBy) REFERENCES Users(id)
    );

    CREATE INDEX IX_DataImportLogs_ImportType ON DataImportLogs(importType);
    CREATE INDEX IX_DataImportLogs_ImportedBy ON DataImportLogs(importedBy);
    CREATE INDEX IX_DataImportLogs_Status ON DataImportLogs(status);
    CREATE INDEX IX_DataImportLogs_StartedAt ON DataImportLogs(startedAt);

    PRINT '✓ DataImportLogs table created';
END
ELSE
BEGIN
    PRINT '○ DataImportLogs table already exists';
END
GO

-- Record migration
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.63' AND scriptName = '63_create_data_import_logs_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.63',
        'Create DataImportLogs table for tracking data import operations',
        '63_create_data_import_logs_table.sql',
        'SUCCESS',
        'Supports audit trail for Excel-based data imports'
    );
END
GO

PRINT 'DataImportLogs migration completed successfully';
GO
