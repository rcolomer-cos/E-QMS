-- =============================================
-- Patch 68: Create UserDepartments Junction Table
-- =============================================
-- Description: Creates a many-to-many relationship table between Users and Departments
-- allowing users to be assigned to multiple departments.
-- Version: 1.0.68
-- Author: E-QMS System
-- Date: 2025-11-24
-- =============================================

USE eqms;
GO

PRINT '======================================';
PRINT 'Patch 68: Creating UserDepartments Table';
PRINT '======================================';
PRINT '';

-- =============================================
-- Create UserDepartments Junction Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserDepartments')
BEGIN
    CREATE TABLE UserDepartments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        departmentId INT NOT NULL,
        isPrimary BIT DEFAULT 0, -- Indicates if this is the user's primary department
        assignedBy INT NOT NULL, -- User ID who assigned this department
        assignedAt DATETIME2 DEFAULT GETDATE(),
        active BIT DEFAULT 1,
        
        CONSTRAINT FK_UserDepartments_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserDepartments_Department FOREIGN KEY (departmentId) REFERENCES Departments(id),
        CONSTRAINT FK_UserDepartments_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_UserDepartments_UserDept UNIQUE (userId, departmentId)
    );
    
    -- Indexes for performance
    CREATE INDEX IX_UserDepartments_User ON UserDepartments(userId);
    CREATE INDEX IX_UserDepartments_Department ON UserDepartments(departmentId);
    CREATE INDEX IX_UserDepartments_Active ON UserDepartments(active);
    CREATE INDEX IX_UserDepartments_Primary ON UserDepartments(isPrimary) WHERE isPrimary = 1;
    
    PRINT '✓ UserDepartments table created successfully';
END
ELSE
BEGIN
    PRINT '○ UserDepartments table already exists';
END
GO

-- =============================================
-- Record Database Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.68' AND scriptName = '68_create_user_departments_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.68',
        'Create UserDepartments junction table for user-department assignments',
        '68_create_user_departments_table.sql',
        'SUCCESS',
        'Enables many-to-many relationship between Users and Departments with primary department support'
    );
    PRINT '✓ Database version 1.0.68 recorded';
END
ELSE
BEGIN
    PRINT '○ Database version 1.0.68 already recorded';
END
GO

PRINT '';
PRINT '======================================';
PRINT 'Patch 68: Completed Successfully';
PRINT '======================================';
