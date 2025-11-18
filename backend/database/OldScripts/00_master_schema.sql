-- =============================================
-- E-QMS Master Database Schema
-- =============================================
-- Execute this script in SQL Server Management Studio (SSMS)
-- to create all necessary tables for the E-QMS application
--
-- Prerequisites:
--   1. Create database: CREATE DATABASE eqms;
--   2. Set database context: USE eqms;
--   3. Execute this script
--
-- Version: 1.0.3
-- Last Updated: 2025-11-15
-- =============================================

USE eqms;
GO

PRINT '======================================';
PRINT 'E-QMS Database Schema Initialization';
PRINT '======================================';
PRINT '';

-- =============================================
-- 1. DATABASE VERSION CONTROL TABLE
-- =============================================
PRINT 'Creating DatabaseVersion table...';

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

    PRINT '✓ DatabaseVersion table created';
END
ELSE
BEGIN
    PRINT '○ DatabaseVersion table already exists';
END
GO

-- Insert initial version record
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.0')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.0',
        'Initial database schema - Version control system',
        '00_master_schema.sql',
        'SUCCESS',
        'Database version tracking table created'
    );
END
GO

PRINT '';

-- =============================================
-- 2. ROLES TABLE
-- =============================================
PRINT 'Creating Roles table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        displayName NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        level INT NOT NULL,
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_Roles_Name ON Roles(name);
    CREATE INDEX IX_Roles_Level ON Roles(level);

    PRINT '✓ Roles table created';
END
ELSE
BEGIN
    PRINT '○ Roles table already exists';
END
GO

-- Insert default roles
IF NOT EXISTS (SELECT * FROM Roles WHERE name = 'superuser')
BEGIN
    INSERT INTO Roles (name, displayName, description, level) VALUES
    ('superuser', 'Super User', 'Full system access including user management and system configuration. Can create other superusers.', 100),
    ('admin', 'Administrator', 'Administrative access to manage users, quality processes, and system settings. Cannot create superusers.', 90),
    ('manager', 'Manager', 'Manage quality processes, approve documents, and oversee operations.', 70),
    ('auditor', 'Auditor', 'Conduct audits, create NCRs, and manage audit processes.', 60),
    ('user', 'User', 'Create and edit documents, participate in quality processes.', 50),
    ('viewer', 'Viewer', 'Read-only access to view documents and reports.', 10);

    PRINT '✓ Default roles inserted';
END
ELSE
BEGIN
    PRINT '○ Default roles already exist';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.1' AND scriptName = '00_master_schema.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.1',
        'Create Roles table with default system roles',
        '00_master_schema.sql',
        'SUCCESS',
        'Roles: superuser, admin, manager, auditor, user, viewer'
    );
END
GO

PRINT '';

-- =============================================
-- 3. USERS TABLE
-- =============================================
PRINT 'Creating Users table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        firstName NVARCHAR(100) NOT NULL,
        lastName NVARCHAR(100) NOT NULL,
        department NVARCHAR(100),
        active BIT DEFAULT 1,
        lastLogin DATETIME2,
        failedLoginAttempts INT DEFAULT 0,
        lockedUntil DATETIME2,
        passwordChangedAt DATETIME2,
        mustChangePassword BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT,
        CONSTRAINT CK_Users_Email CHECK (email LIKE '%_@_%._%')
    );

    CREATE UNIQUE INDEX IX_Users_Email ON Users(email);
    CREATE INDEX IX_Users_Active ON Users(active);
    CREATE INDEX IX_Users_Department ON Users(department);
    CREATE INDEX IX_Users_LastLogin ON Users(lastLogin);

    PRINT '✓ Users table created';
END
ELSE
BEGIN
    PRINT '○ Users table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.2' AND scriptName = '00_master_schema.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.2',
        'Create Users table with email as login username',
        '00_master_schema.sql',
        'SUCCESS',
        'Users store firstName, lastName, and use email for authentication'
    );
END
GO

PRINT '';

-- =============================================
-- 4. USERROLES JUNCTION TABLE
-- =============================================
PRINT 'Creating UserRoles table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE UserRoles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        roleId INT NOT NULL,
        assignedAt DATETIME2 DEFAULT GETDATE(),
        assignedBy INT,
        expiresAt DATETIME2,
        active BIT DEFAULT 1,
        notes NVARCHAR(500),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_UserRoles_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_UserRoles_UserRole UNIQUE (userId, roleId)
    );

    CREATE INDEX IX_UserRoles_UserId ON UserRoles(userId);
    CREATE INDEX IX_UserRoles_RoleId ON UserRoles(roleId);
    CREATE INDEX IX_UserRoles_Active ON UserRoles(active);
    CREATE INDEX IX_UserRoles_ExpiresAt ON UserRoles(expiresAt);

    PRINT '✓ UserRoles table created';
END
ELSE
BEGIN
    PRINT '○ UserRoles table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.3' AND scriptName = '00_master_schema.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.3',
        'Create UserRoles junction table for many-to-many relationship',
        '00_master_schema.sql',
        'SUCCESS',
        'Enables users to have multiple roles'
    );
END
GO

PRINT '';
PRINT '======================================';
PRINT 'Schema Initialization Complete!';
PRINT '======================================';
PRINT '';

-- Display summary
PRINT 'Database Version History:';
SELECT version, description, appliedDate, status 
FROM DatabaseVersion 
ORDER BY appliedDate;
GO

PRINT '';
PRINT 'Available Roles:';
SELECT name, displayName, level, description 
FROM Roles 
WHERE active = 1 
ORDER BY level DESC;
GO

PRINT '';
PRINT 'Next Steps:';
PRINT '1. Start the E-QMS application';
PRINT '2. Create the first superuser through the bootstrap interface';
PRINT '3. Login and begin configuring your quality management system';
PRINT '';
