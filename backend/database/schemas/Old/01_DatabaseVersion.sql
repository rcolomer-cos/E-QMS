-- =============================================
-- Database Version Tracking Table
-- =============================================
-- This table tracks the database schema version
-- Updated automatically when migration scripts are run
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    CREATE TABLE DatabaseVersion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version NVARCHAR(20) NOT NULL,
        description NVARCHAR(500) NOT NULL,
        scriptName NVARCHAR(255) NOT NULL,
        appliedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        appliedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        checksum NVARCHAR(64),
        executionTimeMs INT,
        CONSTRAINT UQ_DatabaseVersion_Version UNIQUE (version)
    );

    -- Insert initial version
    INSERT INTO DatabaseVersion (version, description, scriptName, appliedAt)
    VALUES ('1.0.0', 'Initial database schema', '01_DatabaseVersion.sql', GETDATE());

    PRINT 'DatabaseVersion table created successfully';
END
ELSE
BEGIN
    PRINT 'DatabaseVersion table already exists';
END
GO
