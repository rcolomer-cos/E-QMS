-- =============================================
-- Database Version Control Table
-- =============================================
-- This table tracks database schema versions and updates
-- Run this script first before any other schema scripts

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    CREATE TABLE DatabaseVersion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version NVARCHAR(20) NOT NULL,
        description NVARCHAR(500) NOT NULL,
        scriptName NVARCHAR(255) NOT NULL,
        appliedDate DATETIME2 DEFAULT GETDATE(),
        appliedBy NVARCHAR(100) DEFAULT SYSTEM_USER,
        checksum NVARCHAR(64),
        executionTimeMs INT,
        status NVARCHAR(20) DEFAULT 'SUCCESS',
        notes NVARCHAR(MAX)
    );

    CREATE INDEX IX_DatabaseVersion_Version ON DatabaseVersion(version);
    CREATE INDEX IX_DatabaseVersion_AppliedDate ON DatabaseVersion(appliedDate);

    PRINT 'DatabaseVersion table created successfully';
END
ELSE
BEGIN
    PRINT 'DatabaseVersion table already exists';
END
GO

-- Insert initial version record
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.0')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.0',
        'Initial database schema - Version control system',
        '01_create_versioning_table.sql',
        'SUCCESS',
        'Database version tracking table created'
    );
    
    PRINT 'Initial version 1.0.0 recorded';
END
GO
