-- =============================================
-- Departments Table
-- =============================================
-- Stores organizational departments
-- Used to categorize users, equipment, audits, and other entities
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE Departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) UNIQUE NOT NULL,
        code NVARCHAR(20) UNIQUE NOT NULL,
        description NVARCHAR(500),
        managerId INT NULL,
        active BIT DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        createdBy INT NULL,
        CONSTRAINT FK_Departments_Manager FOREIGN KEY (managerId) REFERENCES Users(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IX_Departments_Name ON Departments(name) WHERE active = 1;
    CREATE INDEX IX_Departments_Code ON Departments(code) WHERE active = 1;
    CREATE INDEX IX_Departments_Active ON Departments(active);
    CREATE INDEX IX_Departments_Manager ON Departments(managerId);

    PRINT 'Departments table created successfully';
END
ELSE
BEGIN
    PRINT 'Departments table already exists';
END
GO

-- Update database version
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName)
    VALUES ('1.0.5', 'Departments table creation', '05_Departments.sql');
END
GO
