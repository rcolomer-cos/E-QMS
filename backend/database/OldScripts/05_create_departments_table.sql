-- =============================================
-- Departments Table
-- =============================================
-- Stores organizational departments
-- Used to categorize users, equipment, audits, and other entities

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE Departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) UNIQUE NOT NULL,
        code NVARCHAR(20) UNIQUE NOT NULL, -- Short code for department (e.g., 'IT', 'QA', 'PROD')
        description NVARCHAR(500),
        managerId INT, -- Reference to Users table (optional department manager)
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User ID who created this department
        CONSTRAINT FK_Departments_Manager FOREIGN KEY (managerId) REFERENCES Users(id)
    );

    -- Indexes for performance
    CREATE UNIQUE INDEX IX_Departments_Name ON Departments(name) WHERE active = 1;
    CREATE UNIQUE INDEX IX_Departments_Code ON Departments(code) WHERE active = 1;
    CREATE INDEX IX_Departments_Active ON Departments(active);
    CREATE INDEX IX_Departments_Manager ON Departments(managerId);

    PRINT 'Departments table created successfully';
END
ELSE
BEGIN
    PRINT 'Departments table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.5' AND scriptName = '05_create_departments_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.5',
        'Create Departments table for organizational structure',
        '05_create_departments_table.sql',
        'SUCCESS',
        'Departments store organizational units with unique name and code'
    );
END
GO
