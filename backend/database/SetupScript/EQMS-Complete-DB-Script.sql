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


-- =============================================
-- Roles Table
-- =============================================
-- Defines system roles for RBAC (Role-Based Access Control)
-- Roles: superuser, admin, manager, auditor, user, viewer

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        displayName NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        level INT NOT NULL, -- Permission level: higher number = more permissions
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_Roles_Name ON Roles(name);
    CREATE INDEX IX_Roles_Level ON Roles(level);

    PRINT 'Roles table created successfully';
END
ELSE
BEGIN
    PRINT 'Roles table already exists';
END
GO

-- Insert default roles
-- Note: superuser has the highest level (100) and can create other superusers
IF NOT EXISTS (SELECT * FROM Roles WHERE name = 'superuser')
BEGIN
    INSERT INTO Roles (name, displayName, description, level) VALUES
    ('superuser', 'Super User', 'Full system access including user management and system configuration. Can create other superusers.', 100),
    ('admin', 'Administrator', 'Administrative access to manage users, quality processes, and system settings. Cannot create superusers.', 90),
    ('manager', 'Manager', 'Manage quality processes, approve documents, and oversee operations.', 70),
    ('auditor', 'Auditor', 'Conduct audits, create NCRs, and manage audit processes.', 60),
    ('user', 'User', 'Create and edit documents, participate in quality processes.', 50),
    ('viewer', 'Viewer', 'Read-only access to view documents and reports.', 10);

    PRINT 'Default roles inserted successfully';
END
ELSE
BEGIN
    PRINT 'Default roles already exist';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.1' AND scriptName = '02_create_roles_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.1',
        'Create Roles table with default system roles',
        '02_create_roles_table.sql',
        'SUCCESS',
        'Roles: superuser, admin, manager, auditor, user, viewer'
    );
END
GO

-- =============================================
-- Users Table
-- =============================================
-- Stores user account information
-- Email is used as the login username
-- Users can have multiple roles via the UserRoles junction table

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL, -- Email is the login username
        password NVARCHAR(255) NOT NULL, -- Hashed password (bcrypt)
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
        createdBy INT, -- User ID who created this account
        CONSTRAINT CK_Users_Email CHECK (email LIKE '%_@_%._%')
    );

    -- Indexes for performance
    CREATE UNIQUE INDEX IX_Users_Email ON Users(email);
    CREATE INDEX IX_Users_Active ON Users(active);
    CREATE INDEX IX_Users_Department ON Users(department);
    CREATE INDEX IX_Users_LastLogin ON Users(lastLogin);

    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.2' AND scriptName = '03_create_users_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.2',
        'Create Users table with email as login username',
        '03_create_users_table.sql',
        'SUCCESS',
        'Users store firstName, lastName, and use email for authentication'
    );
END
GO

-- =============================================
-- UserRoles Junction Table
-- =============================================
-- Many-to-many relationship between Users and Roles
-- A user can have multiple roles

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE UserRoles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        roleId INT NOT NULL,
        assignedAt DATETIME2 DEFAULT GETDATE(),
        assignedBy INT, -- User ID who assigned this role
        expiresAt DATETIME2, -- Optional: for temporary role assignments
        active BIT DEFAULT 1,
        notes NVARCHAR(500),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_UserRoles_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_UserRoles_UserRole UNIQUE (userId, roleId)
    );

    -- Indexes for performance
    CREATE INDEX IX_UserRoles_UserId ON UserRoles(userId);
    CREATE INDEX IX_UserRoles_RoleId ON UserRoles(roleId);
    CREATE INDEX IX_UserRoles_Active ON UserRoles(active);
    CREATE INDEX IX_UserRoles_ExpiresAt ON UserRoles(expiresAt);

    PRINT 'UserRoles table created successfully';
END
ELSE
BEGIN
    PRINT 'UserRoles table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.3' AND scriptName = '04_create_user_roles_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.3',
        'Create UserRoles junction table for many-to-many relationship',
        '04_create_user_roles_table.sql',
        'SUCCESS',
        'Enables users to have multiple roles'
    );
END
GO

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

-- =============================================
-- Processes Table
-- =============================================
-- Stores business processes within the quality management system
-- Used to define, track, and manage organizational processes per ISO 9001

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Processes')
BEGIN
    CREATE TABLE Processes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) UNIQUE NOT NULL,
        code NVARCHAR(50) UNIQUE NOT NULL, -- Short code for process (e.g., 'PROC-001', 'QA-REVIEW')
        description NVARCHAR(1000),
        departmentId INT, -- Reference to Departments table (optional department association)
        processCategory NVARCHAR(100), -- e.g., 'Management', 'Core', 'Support'
        objective NVARCHAR(500), -- Process objective/purpose
        scope NVARCHAR(500), -- Process scope definition
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User ID who created this process
        CONSTRAINT FK_Processes_Department FOREIGN KEY (departmentId) REFERENCES Departments(id),
        CONSTRAINT FK_Processes_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
    );

    -- Indexes for performance
    CREATE UNIQUE INDEX IX_Processes_Name ON Processes(name) WHERE active = 1;
    CREATE UNIQUE INDEX IX_Processes_Code ON Processes(code) WHERE active = 1;
    CREATE INDEX IX_Processes_Active ON Processes(active);
    CREATE INDEX IX_Processes_Department ON Processes(departmentId);
    CREATE INDEX IX_Processes_Category ON Processes(processCategory);

    PRINT 'Processes table created successfully';
END
ELSE
BEGIN
    PRINT 'Processes table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.6' AND scriptName = '06_create_processes_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.6',
        'Create Processes table for ISO 9001 process management',
        '06_create_processes_table.sql',
        'SUCCESS',
        'Processes store business processes with unique name and code'
    );
END
GO

-- =============================================
-- ProcessOwners Table
-- =============================================
-- Junction table for process ownership assignments
-- Tracks which users are responsible for which processes

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProcessOwners')
BEGIN
    CREATE TABLE ProcessOwners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        processId INT NOT NULL,
        ownerId INT NOT NULL, -- User ID who owns the process
        assignedAt DATETIME2 DEFAULT GETDATE(),
        assignedBy INT, -- User ID who made the assignment
        isPrimaryOwner BIT DEFAULT 0, -- Flag to indicate primary vs secondary owner
        active BIT DEFAULT 1,
        notes NVARCHAR(500), -- Optional notes about the ownership assignment
        CONSTRAINT FK_ProcessOwners_Process FOREIGN KEY (processId) REFERENCES Processes(id),
        CONSTRAINT FK_ProcessOwners_Owner FOREIGN KEY (ownerId) REFERENCES Users(id),
        CONSTRAINT FK_ProcessOwners_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_ProcessOwners_Active UNIQUE (processId, ownerId, active)
    );

    -- Indexes for performance
    CREATE INDEX IX_ProcessOwners_Process ON ProcessOwners(processId);
    CREATE INDEX IX_ProcessOwners_Owner ON ProcessOwners(ownerId);
    CREATE INDEX IX_ProcessOwners_Active ON ProcessOwners(active);
    CREATE INDEX IX_ProcessOwners_PrimaryOwner ON ProcessOwners(isPrimaryOwner) WHERE isPrimaryOwner = 1;

    PRINT 'ProcessOwners table created successfully';
END
ELSE
BEGIN
    PRINT 'ProcessOwners table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.7' AND scriptName = '07_create_process_owners_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.7',
        'Create ProcessOwners table for process ownership management',
        '07_create_process_owners_table.sql',
        'SUCCESS',
        'ProcessOwners track user assignments to processes with primary/secondary designation'
    );
END
GO

-- =============================================
-- Documents Table
-- =============================================
-- Stores document metadata, versioning, and lifecycle management
-- Supports ISO 9001 document control requirements with version history

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
BEGIN
    CREATE TABLE Documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Document Metadata
        title NVARCHAR(500) NOT NULL,
        description NVARCHAR(2000),
        documentType NVARCHAR(100) NOT NULL, -- e.g., 'Policy', 'Procedure', 'Work Instruction', 'Form', 'Record'
        category NVARCHAR(100) NOT NULL, -- e.g., 'Quality', 'Safety', 'HR', 'Operations'
        
        -- Versioning
        version NVARCHAR(50) NOT NULL DEFAULT '1.0', -- Version number (e.g., '1.0', '1.1', '2.0')
        parentDocumentId INT NULL, -- Reference to previous version (NULL for first version)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'obsolete'
        
        -- Ownership and Approval
        ownerId INT NULL, -- Primary document owner/responsible person
        createdBy INT NOT NULL, -- User who created this version
        approvedBy INT NULL, -- User who approved the document
        approvedAt DATETIME2 NULL, -- Approval timestamp
        
        -- File Information
        filePath NVARCHAR(1000), -- Physical/logical path to document file
        fileName NVARCHAR(500), -- Original file name
        fileSize INT, -- File size in bytes
        
        -- Date Management
        effectiveDate DATETIME2, -- When document becomes effective
        reviewDate DATETIME2, -- Next scheduled review date
        expiryDate DATETIME2, -- Document expiration date (if applicable)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Documents_ParentDocument FOREIGN KEY (parentDocumentId) REFERENCES Documents(id),
        CONSTRAINT FK_Documents_Owner FOREIGN KEY (ownerId) REFERENCES Users(id),
        CONSTRAINT FK_Documents_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Documents_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Documents_Status CHECK (status IN ('draft', 'review', 'approved', 'obsolete')),
        CONSTRAINT CK_Documents_Version CHECK (LEN(version) > 0)
    );

    -- Indexes for Performance
    
    -- Primary indexes for filtering and searching
    CREATE INDEX IX_Documents_Status ON Documents(status);
    CREATE INDEX IX_Documents_DocumentType ON Documents(documentType);
    CREATE INDEX IX_Documents_Category ON Documents(category);
    CREATE INDEX IX_Documents_OwnerId ON Documents(ownerId);
    
    -- Version history and tracking
    CREATE INDEX IX_Documents_ParentDocumentId ON Documents(parentDocumentId);
    CREATE INDEX IX_Documents_Version ON Documents(version);
    
    -- Date-based queries
    CREATE INDEX IX_Documents_EffectiveDate ON Documents(effectiveDate);
    CREATE INDEX IX_Documents_ReviewDate ON Documents(reviewDate);
    CREATE INDEX IX_Documents_ExpiryDate ON Documents(expiryDate);
    CREATE INDEX IX_Documents_CreatedAt ON Documents(createdAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Documents_Title_Version ON Documents(title, version);
    CREATE INDEX IX_Documents_Status_DocumentType ON Documents(status, documentType);
    CREATE INDEX IX_Documents_Status_Category ON Documents(status, category);
    
    -- Audit trail
    CREATE INDEX IX_Documents_CreatedBy ON Documents(createdBy);
    CREATE INDEX IX_Documents_ApprovedBy ON Documents(approvedBy);

    PRINT 'Documents table created successfully';
END
ELSE
BEGIN
    PRINT 'Documents table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.8' AND scriptName = '08_create_documents_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.8',
        'Create Documents table with metadata, versioning, and audit trail',
        '08_create_documents_table.sql',
        'SUCCESS',
        'Documents table supports ISO 9001 document control with version history tracking via parentDocumentId'
    );
END
GO

-- =============================================
-- Document Revisions Table
-- =============================================
-- Stores detailed revision history for documents
-- Tracks version number, author, timestamp, change notes, and file references
-- Supports ISO 9001 audit trail and traceability requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentRevisions')
BEGIN
    CREATE TABLE DocumentRevisions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Document Reference
        documentId INT NOT NULL, -- Reference to the document being revised
        
        -- Version Information
        version NVARCHAR(50) NOT NULL, -- Version number at time of revision (e.g., '1.0', '1.1', '2.0')
        revisionNumber INT NOT NULL DEFAULT 1, -- Sequential revision number for tracking changes
        
        -- Change Details
        changeDescription NVARCHAR(2000), -- Description of changes made in this revision
        changeType NVARCHAR(50) NOT NULL DEFAULT 'update', -- 'create', 'update', 'approve', 'obsolete', 'review'
        changeReason NVARCHAR(1000), -- Reason for the change (e.g., regulatory update, error correction)
        
        -- Author Information
        authorId INT NOT NULL, -- User who made the revision
        authorName NVARCHAR(255), -- Cached author name for audit trail
        
        -- File Information (if file was updated)
        filePath NVARCHAR(1000), -- Path to the file at this revision
        fileName NVARCHAR(500), -- File name at this revision
        fileSize INT, -- File size in bytes at this revision
        fileHash NVARCHAR(128), -- Optional file hash for integrity verification
        
        -- Status at Time of Revision
        statusBefore NVARCHAR(50), -- Document status before this revision
        statusAfter NVARCHAR(50) NOT NULL, -- Document status after this revision
        
        -- Metadata
        previousRevisionId INT NULL, -- Reference to previous revision for linked history
        
        -- Timestamps
        revisionDate DATETIME2 DEFAULT GETDATE(), -- When this revision was created
        
        -- Foreign Key Constraints
        CONSTRAINT FK_DocumentRevisions_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentRevisions_Author FOREIGN KEY (authorId) REFERENCES Users(id),
        CONSTRAINT FK_DocumentRevisions_PreviousRevision FOREIGN KEY (previousRevisionId) REFERENCES DocumentRevisions(id),
        
        -- Constraints
        CONSTRAINT CK_DocumentRevisions_ChangeType CHECK (changeType IN ('create', 'update', 'approve', 'obsolete', 'review', 'version'))
    );

    -- Indexes for Performance
    
    -- Primary lookup by document
    CREATE INDEX IX_DocumentRevisions_DocumentId ON DocumentRevisions(documentId);
    
    -- Version tracking
    CREATE INDEX IX_DocumentRevisions_Version ON DocumentRevisions(version);
    CREATE INDEX IX_DocumentRevisions_RevisionNumber ON DocumentRevisions(revisionNumber);
    
    -- Author tracking
    CREATE INDEX IX_DocumentRevisions_AuthorId ON DocumentRevisions(authorId);
    
    -- Date-based queries for audit trails
    CREATE INDEX IX_DocumentRevisions_RevisionDate ON DocumentRevisions(revisionDate);
    
    -- Change type filtering
    CREATE INDEX IX_DocumentRevisions_ChangeType ON DocumentRevisions(changeType);
    
    -- Status tracking
    CREATE INDEX IX_DocumentRevisions_StatusAfter ON DocumentRevisions(statusAfter);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_DocumentRevisions_Document_Date ON DocumentRevisions(documentId, revisionDate DESC);
    CREATE INDEX IX_DocumentRevisions_Document_Version ON DocumentRevisions(documentId, version);
    
    -- Linked revision history
    CREATE INDEX IX_DocumentRevisions_PreviousRevisionId ON DocumentRevisions(previousRevisionId);

    PRINT 'DocumentRevisions table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentRevisions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.9' AND scriptName = '09_create_document_revisions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.9',
        'Create DocumentRevisions table for detailed revision history and audit trail',
        '09_create_document_revisions_table.sql',
        'SUCCESS',
        'DocumentRevisions table supports ISO 9001 audit trail requirements with version tracking, change notes, and file references'
    );
END
GO

-- =============================================
-- Notifications Table
-- =============================================
-- Stores in-app notifications for users
-- Supports notification of document revision events (approve, reject, changes requested)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Recipient
        userId INT NOT NULL, -- User who receives this notification
        
        -- Notification Content
        type NVARCHAR(50) NOT NULL, -- 'document_approved', 'document_rejected', 'document_changes_requested'
        title NVARCHAR(500) NOT NULL, -- Short title/subject
        message NVARCHAR(2000) NOT NULL, -- Full notification message
        
        -- Related Entity References
        documentId INT NULL, -- Reference to related document
        revisionId INT NULL, -- Reference to related revision
        
        -- Notification State
        isRead BIT NOT NULL DEFAULT 0, -- Whether user has read the notification
        readAt DATETIME2 NULL, -- When notification was read
        
        -- Timestamps
        createdAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Notifications_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Notifications_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_Notifications_Revision FOREIGN KEY (revisionId) REFERENCES DocumentRevisions(id),
        
        -- Constraints
        CONSTRAINT CK_Notifications_Type CHECK (type IN (
            'document_approved', 
            'document_rejected', 
            'document_changes_requested'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookup by user
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    
    -- Filter by read status
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    
    -- Date-based queries
    CREATE INDEX IX_Notifications_CreatedAt ON Notifications(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Notifications_User_Read ON Notifications(userId, isRead);
    CREATE INDEX IX_Notifications_User_CreatedAt ON Notifications(userId, createdAt DESC);
    
    -- Related entity lookups
    CREATE INDEX IX_Notifications_DocumentId ON Notifications(documentId);
    CREATE INDEX IX_Notifications_Type ON Notifications(type);

    PRINT 'Notifications table created successfully';
END
ELSE
BEGIN
    PRINT 'Notifications table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.10' AND scriptName = '10_create_notifications_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.10',
        'Create Notifications table for in-app notifications',
        '10_create_notifications_table.sql',
        'SUCCESS',
        'Notifications table supports in-app notifications for document revision events'
    );
END
GO

-- =============================================
-- Equipment Table
-- =============================================
-- Stores equipment metadata, maintenance, and calibration tracking
-- Supports ISO 9001 equipment management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
BEGIN
    CREATE TABLE Equipment (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Identification
        equipmentNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique equipment identifier
        name NVARCHAR(500) NOT NULL, -- Equipment name/title
        description NVARCHAR(2000), -- Detailed description
        
        -- Manufacturer Information
        manufacturer NVARCHAR(200), -- Equipment manufacturer
        model NVARCHAR(200), -- Manufacturer model number
        serialNumber NVARCHAR(200), -- Serial number
        
        -- Location and Assignment
        location NVARCHAR(200) NOT NULL, -- Physical location
        department NVARCHAR(100), -- Department or area
        responsiblePerson INT NULL, -- User responsible for this equipment
        
        -- Equipment Status
        status NVARCHAR(50) NOT NULL DEFAULT 'operational', -- Current operational status
        
        -- Purchase Information
        purchaseDate DATETIME2, -- Date equipment was purchased
        
        -- Calibration Management
        lastCalibrationDate DATETIME2, -- Last calibration performed
        nextCalibrationDate DATETIME2, -- Next calibration due date
        calibrationInterval INT, -- Calibration interval in days
        
        -- Maintenance Management
        lastMaintenanceDate DATETIME2, -- Last maintenance performed
        nextMaintenanceDate DATETIME2, -- Next maintenance due date
        maintenanceInterval INT, -- Maintenance interval in days
        
        -- QR Code for Mobile Access
        qrCode NVARCHAR(500), -- QR code for equipment identification
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Equipment_ResponsiblePerson FOREIGN KEY (responsiblePerson) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Equipment_Status CHECK (status IN (
            'operational', 
            'maintenance', 
            'out_of_service', 
            'calibration_due'
        )),
        CONSTRAINT CK_Equipment_CalibrationInterval CHECK (calibrationInterval IS NULL OR calibrationInterval > 0),
        CONSTRAINT CK_Equipment_MaintenanceInterval CHECK (maintenanceInterval IS NULL OR maintenanceInterval > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Equipment_EquipmentNumber ON Equipment(equipmentNumber);
    CREATE INDEX IX_Equipment_SerialNumber ON Equipment(serialNumber);
    CREATE INDEX IX_Equipment_QRCode ON Equipment(qrCode);
    
    -- Status and operational queries
    CREATE INDEX IX_Equipment_Status ON Equipment(status);
    CREATE INDEX IX_Equipment_Location ON Equipment(location);
    CREATE INDEX IX_Equipment_Department ON Equipment(department);
    CREATE INDEX IX_Equipment_ResponsiblePerson ON Equipment(responsiblePerson);
    
    -- Calibration tracking
    CREATE INDEX IX_Equipment_NextCalibrationDate ON Equipment(nextCalibrationDate);
    CREATE INDEX IX_Equipment_LastCalibrationDate ON Equipment(lastCalibrationDate);
    
    -- Maintenance tracking
    CREATE INDEX IX_Equipment_NextMaintenanceDate ON Equipment(nextMaintenanceDate);
    CREATE INDEX IX_Equipment_LastMaintenanceDate ON Equipment(lastMaintenanceDate);
    
    -- Date-based queries
    CREATE INDEX IX_Equipment_PurchaseDate ON Equipment(purchaseDate);
    CREATE INDEX IX_Equipment_CreatedAt ON Equipment(createdAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Equipment_Status_Department ON Equipment(status, department);
    CREATE INDEX IX_Equipment_Status_Location ON Equipment(status, location);
    CREATE INDEX IX_Equipment_Department_Status ON Equipment(department, status);
    
    -- Name search
    CREATE INDEX IX_Equipment_Name ON Equipment(name);

    PRINT 'Equipment table created successfully';
END
ELSE
BEGIN
    PRINT 'Equipment table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.11' AND scriptName = '11_create_equipment_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.11',
        'Create Equipment table with metadata, calibration, and maintenance tracking',
        '11_create_equipment_table.sql',
        'SUCCESS',
        'Equipment table supports ISO 9001 equipment management with calibration and maintenance scheduling'
    );
END
GO

-- =============================================
-- Calibration Records Table
-- =============================================
-- Stores calibration records for equipment
-- Tracks calibration history, results, and compliance
-- Supports ISO 9001 calibration management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CalibrationRecords')
BEGIN
    CREATE TABLE CalibrationRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Calibration Scheduling
        calibrationDate DATETIME2 NOT NULL, -- Date calibration was performed
        dueDate DATETIME2, -- Date calibration was originally due
        nextDueDate DATETIME2, -- Date of next calibration due
        
        -- Personnel
        performedBy INT NOT NULL, -- User who performed the calibration
        approvedBy INT, -- User who approved/verified the calibration
        
        -- Calibration Details
        calibrationType NVARCHAR(100), -- Type of calibration (internal, external, etc.)
        calibrationStandard NVARCHAR(200), -- Standard or method used
        certificateNumber NVARCHAR(100), -- Certificate or reference number
        
        -- Results
        result NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Result status
        resultValue NVARCHAR(500), -- Measured values or readings
        toleranceMin NVARCHAR(100), -- Minimum tolerance value
        toleranceMax NVARCHAR(100), -- Maximum tolerance value
        passed BIT NOT NULL DEFAULT 1, -- Pass/fail flag
        
        -- Additional Information
        findings NVARCHAR(2000), -- Observations or findings
        correctiveAction NVARCHAR(2000), -- Actions taken if failed
        attachments NVARCHAR(1000), -- File paths to calibration certificates/reports
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        
        -- External Service Provider (if applicable)
        externalProvider NVARCHAR(200), -- External calibration service provider
        providerCertification NVARCHAR(200), -- Provider's certification/accreditation
        cost DECIMAL(10,2), -- Calibration cost
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_CalibrationRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_CalibrationRecords_PerformedBy FOREIGN KEY (performedBy) REFERENCES Users(id),
        CONSTRAINT FK_CalibrationRecords_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_CalibrationRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_CalibrationRecords_Result CHECK (result IN (
            'pending',
            'passed',
            'failed',
            'conditional'
        )),
        CONSTRAINT CK_CalibrationRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled'
        )),
        CONSTRAINT CK_CalibrationRecords_Cost CHECK (cost IS NULL OR cost >= 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_CalibrationRecords_EquipmentId ON CalibrationRecords(equipmentId);
    CREATE INDEX IX_CalibrationRecords_Equipment_Date ON CalibrationRecords(equipmentId, calibrationDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_CalibrationRecords_CalibrationDate ON CalibrationRecords(calibrationDate);
    CREATE INDEX IX_CalibrationRecords_DueDate ON CalibrationRecords(dueDate);
    CREATE INDEX IX_CalibrationRecords_NextDueDate ON CalibrationRecords(nextDueDate);
    
    -- Status and result tracking
    CREATE INDEX IX_CalibrationRecords_Status ON CalibrationRecords(status);
    CREATE INDEX IX_CalibrationRecords_Result ON CalibrationRecords(result);
    CREATE INDEX IX_CalibrationRecords_Passed ON CalibrationRecords(passed);
    
    -- Personnel tracking
    CREATE INDEX IX_CalibrationRecords_PerformedBy ON CalibrationRecords(performedBy);
    CREATE INDEX IX_CalibrationRecords_ApprovedBy ON CalibrationRecords(approvedBy);
    CREATE INDEX IX_CalibrationRecords_CreatedBy ON CalibrationRecords(createdBy);
    
    -- Certificate lookups
    CREATE INDEX IX_CalibrationRecords_CertificateNumber ON CalibrationRecords(certificateNumber);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_CalibrationRecords_Status_DueDate ON CalibrationRecords(status, dueDate);
    CREATE INDEX IX_CalibrationRecords_Equipment_Status ON CalibrationRecords(equipmentId, status);
    CREATE INDEX IX_CalibrationRecords_Equipment_Result ON CalibrationRecords(equipmentId, result);
    
    -- Audit trail
    CREATE INDEX IX_CalibrationRecords_CreatedAt ON CalibrationRecords(createdAt);

    PRINT 'CalibrationRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'CalibrationRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.14' AND scriptName = '14_create_calibration_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.14',
        'Create CalibrationRecords table for equipment calibration tracking',
        '14_create_calibration_records_table.sql',
        'SUCCESS',
        'CalibrationRecords table supports ISO 9001 calibration management with full audit trail and compliance tracking'
    );
END
GO


-- =============================================
-- Inspection Records Table
-- =============================================
-- Stores inspection records for equipment
-- Tracks inspection history, findings, and compliance
-- Supports ISO 9001 inspection and monitoring requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionRecords')
BEGIN
    CREATE TABLE InspectionRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Inspection Scheduling
        inspectionDate DATETIME2 NOT NULL, -- Date inspection was performed
        dueDate DATETIME2, -- Date inspection was originally due
        nextDueDate DATETIME2, -- Date of next inspection due
        
        -- Personnel
        inspectedBy INT NOT NULL, -- User who performed the inspection
        reviewedBy INT, -- User who reviewed the inspection
        
        -- Inspection Details
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection (routine, safety, pre-use, etc.)
        inspectionChecklist NVARCHAR(500), -- Reference to inspection checklist/procedure
        
        -- Results
        result NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Overall inspection result
        findings NVARCHAR(2000), -- Detailed inspection findings and observations
        defectsFound NVARCHAR(2000), -- List of defects or issues identified
        
        -- Pass/Fail Status
        passed BIT NOT NULL DEFAULT 1, -- Overall pass/fail flag
        safetyCompliant BIT DEFAULT 1, -- Safety compliance flag
        operationalCompliant BIT DEFAULT 1, -- Operational compliance flag
        
        -- Measurements and Values
        measurementsTaken NVARCHAR(2000), -- Measurements or readings taken during inspection
        parameters NVARCHAR(1000), -- Inspection parameters evaluated
        
        -- Actions and Follow-up
        correctiveAction NVARCHAR(2000), -- Immediate corrective actions taken
        recommendedAction NVARCHAR(2000), -- Recommended actions for future
        followUpRequired BIT DEFAULT 0, -- Flag if follow-up inspection needed
        followUpDate DATETIME2, -- Date for follow-up inspection
        
        -- Documentation
        attachments NVARCHAR(1000), -- File paths to inspection reports/photos
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        severity NVARCHAR(50), -- Severity of findings (if issues found)
        
        -- Additional Information
        duration INT, -- Inspection duration in minutes
        notes NVARCHAR(2000), -- Additional notes or comments
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_InspectionRecords_InspectedBy FOREIGN KEY (inspectedBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionRecords_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionRecords_Result CHECK (result IN (
            'pending',
            'passed',
            'passed_with_observations',
            'failed',
            'conditional'
        )),
        CONSTRAINT CK_InspectionRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled'
        )),
        CONSTRAINT CK_InspectionRecords_Severity CHECK (severity IS NULL OR severity IN (
            'none',
            'minor',
            'moderate',
            'major',
            'critical'
        )),
        CONSTRAINT CK_InspectionRecords_Duration CHECK (duration IS NULL OR duration > 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_InspectionRecords_EquipmentId ON InspectionRecords(equipmentId);
    CREATE INDEX IX_InspectionRecords_Equipment_Date ON InspectionRecords(equipmentId, inspectionDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_InspectionRecords_InspectionDate ON InspectionRecords(inspectionDate);
    CREATE INDEX IX_InspectionRecords_DueDate ON InspectionRecords(dueDate);
    CREATE INDEX IX_InspectionRecords_NextDueDate ON InspectionRecords(nextDueDate);
    CREATE INDEX IX_InspectionRecords_FollowUpDate ON InspectionRecords(followUpDate);
    
    -- Status and result tracking
    CREATE INDEX IX_InspectionRecords_Status ON InspectionRecords(status);
    CREATE INDEX IX_InspectionRecords_Result ON InspectionRecords(result);
    CREATE INDEX IX_InspectionRecords_Passed ON InspectionRecords(passed);
    CREATE INDEX IX_InspectionRecords_Severity ON InspectionRecords(severity);
    
    -- Type and compliance tracking
    CREATE INDEX IX_InspectionRecords_InspectionType ON InspectionRecords(inspectionType);
    CREATE INDEX IX_InspectionRecords_SafetyCompliant ON InspectionRecords(safetyCompliant);
    CREATE INDEX IX_InspectionRecords_FollowUpRequired ON InspectionRecords(followUpRequired);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionRecords_InspectedBy ON InspectionRecords(inspectedBy);
    CREATE INDEX IX_InspectionRecords_ReviewedBy ON InspectionRecords(reviewedBy);
    CREATE INDEX IX_InspectionRecords_CreatedBy ON InspectionRecords(createdBy);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionRecords_Status_DueDate ON InspectionRecords(status, dueDate);
    CREATE INDEX IX_InspectionRecords_Equipment_Status ON InspectionRecords(equipmentId, status);
    CREATE INDEX IX_InspectionRecords_Equipment_Result ON InspectionRecords(equipmentId, result);
    CREATE INDEX IX_InspectionRecords_Type_Status ON InspectionRecords(inspectionType, status);
    
    -- Audit trail
    CREATE INDEX IX_InspectionRecords_CreatedAt ON InspectionRecords(createdAt);

    PRINT 'InspectionRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.15' AND scriptName = '15_create_inspection_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.15',
        'Create InspectionRecords table for equipment inspection tracking',
        '15_create_inspection_records_table.sql',
        'SUCCESS',
        'InspectionRecords table supports ISO 9001 inspection and monitoring with full audit trail and compliance tracking'
    );
END
GO


-- =============================================
-- Service and Maintenance Records Table
-- =============================================
-- Stores service and maintenance records for equipment
-- Tracks maintenance history, costs, and preventive/corrective actions
-- Supports ISO 9001 maintenance management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiceMaintenanceRecords')
BEGIN
    CREATE TABLE ServiceMaintenanceRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Service/Maintenance Scheduling
        serviceDate DATETIME2 NOT NULL, -- Date service/maintenance was performed
        dueDate DATETIME2, -- Date service/maintenance was originally due
        nextDueDate DATETIME2, -- Date of next service/maintenance due
        
        -- Personnel
        performedBy INT NOT NULL, -- User who performed the service/maintenance
        approvedBy INT, -- User who approved/verified the work
        
        -- Service/Maintenance Details
        serviceType NVARCHAR(100) NOT NULL, -- Type of service (preventive, corrective, emergency, etc.)
        workOrderNumber NVARCHAR(100), -- Work order or job number
        priority NVARCHAR(50), -- Priority level
        
        -- Description and Work Performed
        description NVARCHAR(2000) NOT NULL, -- Description of work required
        workPerformed NVARCHAR(2000), -- Details of work actually performed
        hoursSpent DECIMAL(6,2), -- Hours spent on service/maintenance
        
        -- Parts and Materials
        partsUsed NVARCHAR(2000), -- List of parts used
        partsReplaced NVARCHAR(2000), -- List of parts replaced
        materialsCost DECIMAL(10,2), -- Cost of materials and parts
        
        -- Cost Information
        laborCost DECIMAL(10,2), -- Labor cost
        totalCost DECIMAL(10,2), -- Total cost (materials + labor + other)
        
        -- External Service Provider (if applicable)
        externalProvider NVARCHAR(200), -- External service provider name
        providerContact NVARCHAR(200), -- Provider contact information
        invoiceNumber NVARCHAR(100), -- Invoice or reference number
        
        -- Results and Outcomes
        outcome NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Service outcome
        equipmentCondition NVARCHAR(50), -- Equipment condition after service
        issuesResolved BIT DEFAULT 1, -- Whether issues were resolved
        
        -- Issues and Findings
        problemsIdentified NVARCHAR(2000), -- Problems identified during service
        rootCause NVARCHAR(2000), -- Root cause analysis (if applicable)
        preventiveActions NVARCHAR(2000), -- Preventive actions taken
        
        -- Follow-up and Recommendations
        followUpRequired BIT DEFAULT 0, -- Flag if follow-up needed
        followUpDate DATETIME2, -- Date for follow-up service
        recommendations NVARCHAR(2000), -- Recommendations for future maintenance
        
        -- Testing and Verification
        functionalTestPerformed BIT DEFAULT 0, -- Whether functional test was performed
        testResults NVARCHAR(1000), -- Results of testing
        
        -- Downtime Tracking
        downtimeStart DATETIME2, -- Start of equipment downtime
        downtimeEnd DATETIME2, -- End of equipment downtime
        downtimeHours DECIMAL(6,2), -- Total downtime in hours
        
        -- Documentation
        attachments NVARCHAR(1000), -- File paths to reports/invoices/photos
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ServiceMaintenanceRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_PerformedBy FOREIGN KEY (performedBy) REFERENCES Users(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_ServiceMaintenanceRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ServiceMaintenanceRecords_ServiceType CHECK (serviceType IN (
            'preventive',
            'corrective',
            'predictive',
            'emergency',
            'breakdown',
            'routine',
            'upgrade',
            'installation',
            'decommission'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Priority CHECK (priority IS NULL OR priority IN (
            'low',
            'normal',
            'high',
            'urgent',
            'emergency'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Outcome CHECK (outcome IN (
            'completed',
            'partially_completed',
            'failed',
            'deferred',
            'cancelled'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_EquipmentCondition CHECK (equipmentCondition IS NULL OR equipmentCondition IN (
            'excellent',
            'good',
            'fair',
            'poor',
            'failed'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled',
            'on_hold'
        )),
        CONSTRAINT CK_ServiceMaintenanceRecords_HoursSpent CHECK (hoursSpent IS NULL OR hoursSpent >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_MaterialsCost CHECK (materialsCost IS NULL OR materialsCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_LaborCost CHECK (laborCost IS NULL OR laborCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_TotalCost CHECK (totalCost IS NULL OR totalCost >= 0),
        CONSTRAINT CK_ServiceMaintenanceRecords_DowntimeHours CHECK (downtimeHours IS NULL OR downtimeHours >= 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_ServiceMaintenanceRecords_EquipmentId ON ServiceMaintenanceRecords(equipmentId);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Date ON ServiceMaintenanceRecords(equipmentId, serviceDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_ServiceMaintenanceRecords_ServiceDate ON ServiceMaintenanceRecords(serviceDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_DueDate ON ServiceMaintenanceRecords(dueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_NextDueDate ON ServiceMaintenanceRecords(nextDueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_FollowUpDate ON ServiceMaintenanceRecords(followUpDate);
    
    -- Status and outcome tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_Status ON ServiceMaintenanceRecords(status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Outcome ON ServiceMaintenanceRecords(outcome);
    CREATE INDEX IX_ServiceMaintenanceRecords_EquipmentCondition ON ServiceMaintenanceRecords(equipmentCondition);
    
    -- Type and priority tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_ServiceType ON ServiceMaintenanceRecords(serviceType);
    CREATE INDEX IX_ServiceMaintenanceRecords_Priority ON ServiceMaintenanceRecords(priority);
    CREATE INDEX IX_ServiceMaintenanceRecords_WorkOrderNumber ON ServiceMaintenanceRecords(workOrderNumber);
    
    -- Follow-up tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_FollowUpRequired ON ServiceMaintenanceRecords(followUpRequired);
    CREATE INDEX IX_ServiceMaintenanceRecords_IssuesResolved ON ServiceMaintenanceRecords(issuesResolved);
    
    -- Personnel tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_PerformedBy ON ServiceMaintenanceRecords(performedBy);
    CREATE INDEX IX_ServiceMaintenanceRecords_ApprovedBy ON ServiceMaintenanceRecords(approvedBy);
    CREATE INDEX IX_ServiceMaintenanceRecords_CreatedBy ON ServiceMaintenanceRecords(createdBy);
    
    -- Cost tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_TotalCost ON ServiceMaintenanceRecords(totalCost);
    
    -- External provider tracking
    CREATE INDEX IX_ServiceMaintenanceRecords_ExternalProvider ON ServiceMaintenanceRecords(externalProvider);
    CREATE INDEX IX_ServiceMaintenanceRecords_InvoiceNumber ON ServiceMaintenanceRecords(invoiceNumber);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ServiceMaintenanceRecords_Status_DueDate ON ServiceMaintenanceRecords(status, dueDate);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Status ON ServiceMaintenanceRecords(equipmentId, status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Equipment_Type ON ServiceMaintenanceRecords(equipmentId, serviceType);
    CREATE INDEX IX_ServiceMaintenanceRecords_Type_Status ON ServiceMaintenanceRecords(serviceType, status);
    CREATE INDEX IX_ServiceMaintenanceRecords_Priority_Status ON ServiceMaintenanceRecords(priority, status);
    
    -- Audit trail
    CREATE INDEX IX_ServiceMaintenanceRecords_CreatedAt ON ServiceMaintenanceRecords(createdAt);

    PRINT 'ServiceMaintenanceRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'ServiceMaintenanceRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.16' AND scriptName = '16_create_service_maintenance_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.16',
        'Create ServiceMaintenanceRecords table for equipment service and maintenance tracking',
        '16_create_service_maintenance_records_table.sql',
        'SUCCESS',
        'ServiceMaintenanceRecords table supports ISO 9001 maintenance management with comprehensive tracking of preventive, corrective, and emergency maintenance activities'
    );
END
GO

-- =============================================
-- Non-Conformity Report (NCR) Table
-- =============================================
-- Stores non-conformity records (NCRs) with tracking for category, severity, root cause, and resolution
-- Supports ISO 9001 non-conformance management and corrective action requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NCRs')
BEGIN
    CREATE TABLE NCRs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- NCR Identification
        ncrNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique NCR identifier
        title NVARCHAR(500) NOT NULL, -- NCR title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed description of non-conformity
        
        -- Classification
        source NVARCHAR(200) NOT NULL, -- Source of NCR (internal audit, customer complaint, inspection, etc.)
        category NVARCHAR(200) NOT NULL, -- Category of non-conformity (process, product, documentation, etc.)
        severity NVARCHAR(50) NOT NULL, -- Severity level (minor, major, critical)
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Current status of NCR
        detectedDate DATETIME2 NOT NULL, -- Date non-conformity was detected
        closedDate DATETIME2, -- Date NCR was closed
        
        -- Personnel
        reportedBy INT NOT NULL, -- User who reported the NCR
        assignedTo INT, -- User assigned to resolve the NCR
        verifiedBy INT, -- User who verified the resolution
        verifiedDate DATETIME2, -- Date verification was completed
        
        -- Analysis and Actions
        rootCause NVARCHAR(2000), -- Root cause analysis findings
        containmentAction NVARCHAR(2000), -- Immediate containment actions taken
        correctiveAction NVARCHAR(2000), -- Corrective actions to prevent recurrence
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_NCRs_ReportedBy FOREIGN KEY (reportedBy) REFERENCES Users(id),
        CONSTRAINT FK_NCRs_AssignedTo FOREIGN KEY (assignedTo) REFERENCES Users(id),
        CONSTRAINT FK_NCRs_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_NCRs_Status CHECK (status IN (
            'open',
            'in_progress',
            'resolved',
            'closed',
            'rejected'
        )),
        CONSTRAINT CK_NCRs_Severity CHECK (severity IN (
            'minor',
            'major',
            'critical'
        ))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_NCRs_NCRNumber ON NCRs(ncrNumber);
    
    -- Status and severity tracking
    CREATE INDEX IX_NCRs_Status ON NCRs(status);
    CREATE INDEX IX_NCRs_Severity ON NCRs(severity);
    CREATE INDEX IX_NCRs_Status_Severity ON NCRs(status, severity);
    
    -- Date-based queries
    CREATE INDEX IX_NCRs_DetectedDate ON NCRs(detectedDate);
    CREATE INDEX IX_NCRs_ClosedDate ON NCRs(closedDate);
    CREATE INDEX IX_NCRs_CreatedAt ON NCRs(createdAt);
    
    -- Personnel tracking
    CREATE INDEX IX_NCRs_ReportedBy ON NCRs(reportedBy);
    CREATE INDEX IX_NCRs_AssignedTo ON NCRs(assignedTo);
    CREATE INDEX IX_NCRs_VerifiedBy ON NCRs(verifiedBy);
    
    -- Classification tracking
    CREATE INDEX IX_NCRs_Source ON NCRs(source);
    CREATE INDEX IX_NCRs_Category ON NCRs(category);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_NCRs_Status_DetectedDate ON NCRs(status, detectedDate DESC);
    CREATE INDEX IX_NCRs_AssignedTo_Status ON NCRs(assignedTo, status);
    CREATE INDEX IX_NCRs_Category_Status ON NCRs(category, status);
    CREATE INDEX IX_NCRs_Severity_Status ON NCRs(severity, status);

    PRINT 'NCRs table created successfully';
END
ELSE
BEGIN
    PRINT 'NCRs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.17' AND scriptName = '17_create_ncr_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.17',
        'Create NCRs table for non-conformity report tracking',
        '17_create_ncr_table.sql',
        'SUCCESS',
        'NCRs table supports ISO 9001 non-conformance management with full audit trail and corrective action tracking'
    );
END
GO

-- =============================================
-- Corrective and Preventive Actions (CAPA) Table
-- =============================================
-- Stores CAPA records with root causes, actions, deadlines, and verification data
-- Establishes relations to NCR entries and supports ISO 9001 CAPA management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CAPAs')
BEGIN
    CREATE TABLE CAPAs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- CAPA Identification
        capaNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique CAPA identifier
        title NVARCHAR(500) NOT NULL, -- CAPA title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed description of the CAPA
        
        -- Classification
        type NVARCHAR(50) NOT NULL, -- Type: corrective, preventive
        source NVARCHAR(200) NOT NULL, -- Source of CAPA (NCR, audit, risk assessment, etc.)
        priority NVARCHAR(50) NOT NULL, -- Priority level (low, medium, high, urgent)
        
        -- Related Records
        ncrId INT, -- Optional link to related NCR
        auditId INT, -- Optional link to related audit
        
        -- Analysis and Actions
        rootCause NVARCHAR(2000), -- Root cause analysis findings
        proposedAction NVARCHAR(2000) NOT NULL, -- Proposed corrective or preventive action
        
        -- Personnel and Timeline
        actionOwner INT NOT NULL, -- User responsible for implementing the action
        targetDate DATETIME2 NOT NULL, -- Target completion date
        completedDate DATETIME2, -- Actual completion date
        
        -- Status and Verification
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Current status of CAPA
        effectiveness NVARCHAR(2000), -- Effectiveness verification notes
        verifiedBy INT, -- User who verified the effectiveness
        verifiedDate DATETIME2, -- Date verification was completed
        closedDate DATETIME2, -- Date CAPA was closed
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the CAPA
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_CAPAs_NCR FOREIGN KEY (ncrId) REFERENCES NCRs(id),
        CONSTRAINT FK_CAPAs_ActionOwner FOREIGN KEY (actionOwner) REFERENCES Users(id),
        CONSTRAINT FK_CAPAs_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_CAPAs_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_CAPAs_Type CHECK (type IN (
            'corrective',
            'preventive'
        )),
        CONSTRAINT CK_CAPAs_Priority CHECK (priority IN (
            'low',
            'medium',
            'high',
            'urgent'
        )),
        CONSTRAINT CK_CAPAs_Status CHECK (status IN (
            'open',
            'in_progress',
            'completed',
            'verified',
            'closed'
        ))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_CAPAs_CAPANumber ON CAPAs(capaNumber);
    
    -- Status and priority tracking
    CREATE INDEX IX_CAPAs_Status ON CAPAs(status);
    CREATE INDEX IX_CAPAs_Priority ON CAPAs(priority);
    CREATE INDEX IX_CAPAs_Type ON CAPAs(type);
    CREATE INDEX IX_CAPAs_Status_Priority ON CAPAs(status, priority);
    
    -- Date-based queries
    CREATE INDEX IX_CAPAs_TargetDate ON CAPAs(targetDate);
    CREATE INDEX IX_CAPAs_CompletedDate ON CAPAs(completedDate);
    CREATE INDEX IX_CAPAs_ClosedDate ON CAPAs(closedDate);
    CREATE INDEX IX_CAPAs_CreatedAt ON CAPAs(createdAt);
    
    -- Personnel tracking
    CREATE INDEX IX_CAPAs_ActionOwner ON CAPAs(actionOwner);
    CREATE INDEX IX_CAPAs_VerifiedBy ON CAPAs(verifiedBy);
    CREATE INDEX IX_CAPAs_CreatedBy ON CAPAs(createdBy);
    
    -- Related records tracking
    CREATE INDEX IX_CAPAs_NCRId ON CAPAs(ncrId);
    CREATE INDEX IX_CAPAs_AuditId ON CAPAs(auditId);
    
    -- Source tracking
    CREATE INDEX IX_CAPAs_Source ON CAPAs(source);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_CAPAs_Status_TargetDate ON CAPAs(status, targetDate ASC);
    CREATE INDEX IX_CAPAs_ActionOwner_Status ON CAPAs(actionOwner, status);
    CREATE INDEX IX_CAPAs_Type_Status ON CAPAs(type, status);
    CREATE INDEX IX_CAPAs_Priority_Status ON CAPAs(priority, status);
    CREATE INDEX IX_CAPAs_NCRId_Status ON CAPAs(ncrId, status);

    PRINT 'CAPAs table created successfully';
END
ELSE
BEGIN
    PRINT 'CAPAs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.18' AND scriptName = '18_create_capa_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.18',
        'Create CAPAs table for corrective and preventive action tracking',
        '18_create_capa_table.sql',
        'SUCCESS',
        'CAPAs table supports ISO 9001 CAPA management with relations to NCRs, full audit trail, and effectiveness verification'
    );
END
GO

-- =============================================
-- Audit Log Table
-- =============================================
-- Captures all user actions, timestamps, affected entities, and old/new values
-- Provides comprehensive audit trail for ISO 9001 compliance and security monitoring
-- Optimized for high read volume with strategic indexing

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- User Information
        userId INT, -- User who performed the action (NULL for system actions)
        userName NVARCHAR(255), -- Cached username for audit trail (in case user is deleted)
        userEmail NVARCHAR(255), -- Cached user email for audit trail
        
        -- Action Details
        action NVARCHAR(100) NOT NULL, -- Action performed (create, update, delete, login, logout, approve, reject, etc.)
        actionCategory NVARCHAR(100) NOT NULL, -- Category of action (authentication, document, user, equipment, ncr, capa, etc.)
        actionDescription NVARCHAR(2000), -- Human-readable description of the action
        
        -- Affected Entity
        entityType NVARCHAR(100) NOT NULL, -- Type of entity affected (User, Document, Equipment, NCR, CAPA, etc.)
        entityId INT, -- ID of the affected entity (NULL for actions without specific entity)
        entityIdentifier NVARCHAR(255), -- Human-readable identifier (email, document number, equipment number, etc.)
        
        -- Change Tracking
        oldValues NVARCHAR(MAX), -- JSON representation of old values before change
        newValues NVARCHAR(MAX), -- JSON representation of new values after change
        changedFields NVARCHAR(1000), -- Comma-separated list of fields that changed
        
        -- Request Metadata
        ipAddress NVARCHAR(45), -- IP address of the request (supports IPv4 and IPv6)
        userAgent NVARCHAR(500), -- Browser/client user agent string
        requestMethod NVARCHAR(10), -- HTTP method (GET, POST, PUT, DELETE, etc.)
        requestUrl NVARCHAR(2000), -- API endpoint or URL accessed
        
        -- Result and Status
        success BIT NOT NULL DEFAULT 1, -- Whether the action was successful
        errorMessage NVARCHAR(2000), -- Error message if action failed
        statusCode INT, -- HTTP status code or application status code
        
        -- Timestamp
        timestamp DATETIME2 DEFAULT GETDATE() NOT NULL, -- When the action occurred
        
        -- Additional Context
        sessionId NVARCHAR(255), -- Session identifier for grouping related actions
        additionalData NVARCHAR(MAX), -- Additional contextual data in JSON format
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditLog_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
    );

    -- =============================================
    -- Indexes for High Read Volume Performance
    -- =============================================
    
    -- Timestamp-based queries (most common for audit trail reviews)
    CREATE INDEX IX_AuditLog_Timestamp ON AuditLog(timestamp DESC);
    CREATE INDEX IX_AuditLog_Timestamp_Action ON AuditLog(timestamp DESC, action);
    
    -- User activity tracking
    CREATE INDEX IX_AuditLog_UserId ON AuditLog(userId);
    CREATE INDEX IX_AuditLog_UserId_Timestamp ON AuditLog(userId, timestamp DESC);
    CREATE INDEX IX_AuditLog_UserEmail ON AuditLog(userEmail);
    
    -- Action-based queries
    CREATE INDEX IX_AuditLog_Action ON AuditLog(action);
    CREATE INDEX IX_AuditLog_ActionCategory ON AuditLog(actionCategory);
    CREATE INDEX IX_AuditLog_Action_Timestamp ON AuditLog(action, timestamp DESC);
    CREATE INDEX IX_AuditLog_ActionCategory_Timestamp ON AuditLog(actionCategory, timestamp DESC);
    
    -- Entity tracking (critical for entity audit trails)
    CREATE INDEX IX_AuditLog_EntityType ON AuditLog(entityType);
    CREATE INDEX IX_AuditLog_EntityId ON AuditLog(entityId);
    CREATE INDEX IX_AuditLog_EntityType_EntityId ON AuditLog(entityType, entityId);
    CREATE INDEX IX_AuditLog_EntityType_Timestamp ON AuditLog(entityType, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityId_Timestamp ON AuditLog(entityId, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityIdentifier ON AuditLog(entityIdentifier);
    
    -- Success/failure tracking for security monitoring
    CREATE INDEX IX_AuditLog_Success ON AuditLog(success);
    CREATE INDEX IX_AuditLog_Success_Timestamp ON AuditLog(success, timestamp DESC);
    
    -- Session-based queries for user activity analysis
    CREATE INDEX IX_AuditLog_SessionId ON AuditLog(sessionId);
    CREATE INDEX IX_AuditLog_SessionId_Timestamp ON AuditLog(sessionId, timestamp DESC);
    
    -- Security monitoring indexes
    CREATE INDEX IX_AuditLog_IpAddress ON AuditLog(ipAddress);
    CREATE INDEX IX_AuditLog_IpAddress_Timestamp ON AuditLog(ipAddress, timestamp DESC);
    
    -- Composite indexes for common complex queries
    CREATE INDEX IX_AuditLog_UserId_Action_Timestamp ON AuditLog(userId, action, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityType_EntityId_Timestamp ON AuditLog(entityType, entityId, timestamp DESC);
    CREATE INDEX IX_AuditLog_ActionCategory_Success ON AuditLog(actionCategory, success);

    PRINT 'AuditLog table created successfully with comprehensive indexing for high read volume';
END
ELSE
BEGIN
    PRINT 'AuditLog table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.19' AND scriptName = '19_create_audit_log_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.19',
        'Create AuditLog table for comprehensive audit trail tracking',
        '19_create_audit_log_table.sql',
        'SUCCESS',
        'AuditLog table captures user actions, timestamps, affected entities, old/new values with extensive indexing for high read volume queries. Supports ISO 9001 audit trail requirements.'
    );
END
GO

-- =============================================
-- Attachments Table
-- =============================================
-- Stores file attachments linked to various records
-- Supports ISO 9001 documentation requirements
-- Provides secure file storage with audit trail
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments')
BEGIN
    CREATE TABLE Attachments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- File Information
        fileName NVARCHAR(255) NOT NULL, -- Original filename
        storedFileName NVARCHAR(255) NOT NULL, -- Unique stored filename
        filePath NVARCHAR(500) NOT NULL, -- Full path to stored file
        fileSize INT NOT NULL, -- File size in bytes
        mimeType NVARCHAR(100) NOT NULL, -- MIME type of the file
        fileExtension NVARCHAR(10) NOT NULL, -- File extension
        
        -- Entity Association (Polymorphic relationship)
        entityType NVARCHAR(50) NOT NULL, -- Type of entity (e.g., 'equipment', 'document', 'calibration', 'inspection', 'training', 'ncr', 'capa', 'audit')
        entityId INT NOT NULL, -- ID of the associated entity
        
        -- Attachment Metadata
        description NVARCHAR(500), -- Description or notes about the file
        category NVARCHAR(100), -- Category (e.g., 'certificate', 'report', 'photo', 'invoice')
        version NVARCHAR(50), -- Version number if applicable
        
        -- Security & Access Control
        uploadedBy INT NOT NULL, -- User who uploaded the file
        isPublic BIT NOT NULL DEFAULT 0, -- Whether file is publicly accessible
        
        -- Status
        active BIT NOT NULL DEFAULT 1, -- Soft delete flag
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deletedAt DATETIME2, -- Soft delete timestamp
        deletedBy INT, -- User who deleted the file
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Attachments_UploadedBy FOREIGN KEY (uploadedBy) REFERENCES Users(id),
        CONSTRAINT FK_Attachments_DeletedBy FOREIGN KEY (deletedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Attachments_EntityType CHECK (entityType IN (
            'equipment',
            'document',
            'calibration',
            'inspection',
            'service_maintenance',
            'training',
            'training_certificate',
            'ncr',
            'capa',
            'audit'
        )),
        CONSTRAINT CK_Attachments_FileSize CHECK (fileSize > 0 AND fileSize <= 10485760) -- Max 10MB
    );

    -- Indexes for Performance
    
    -- Entity lookups
    CREATE INDEX IX_Attachments_EntityType ON Attachments(entityType);
    CREATE INDEX IX_Attachments_EntityId ON Attachments(entityId);
    CREATE INDEX IX_Attachments_Entity_Composite ON Attachments(entityType, entityId) WHERE active = 1;
    
    -- User tracking
    CREATE INDEX IX_Attachments_UploadedBy ON Attachments(uploadedBy);
    CREATE INDEX IX_Attachments_DeletedBy ON Attachments(deletedBy);
    
    -- File lookups
    CREATE INDEX IX_Attachments_StoredFileName ON Attachments(storedFileName) WHERE active = 1;
    CREATE INDEX IX_Attachments_Category ON Attachments(category) WHERE active = 1;
    
    -- Status and audit
    CREATE INDEX IX_Attachments_Active ON Attachments(active);
    CREATE INDEX IX_Attachments_CreatedAt ON Attachments(createdAt);
    CREATE INDEX IX_Attachments_DeletedAt ON Attachments(deletedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Attachments_Entity_Category ON Attachments(entityType, entityId, category) WHERE active = 1;
    CREATE INDEX IX_Attachments_UploadedBy_CreatedAt ON Attachments(uploadedBy, createdAt DESC) WHERE active = 1;

    PRINT 'Attachments table created successfully';
END
ELSE
BEGIN
    PRINT 'Attachments table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.20' AND scriptName = '20_create_attachments_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.20',
        'Create Attachments table for file management',
        '20_create_attachments_table.sql',
        'SUCCESS',
        'Attachments table supports secure file storage with polymorphic relationships to various entities including training certificates'
    );
END
GO

-- =============================================
-- Trainings Table
-- =============================================
-- Stores training events/sessions metadata
-- Supports ISO 9001 competence and training management requirements
-- Training records track who attended and certificates issued

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Trainings')
BEGIN
    CREATE TABLE Trainings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Training Identification
        trainingNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique training identifier
        title NVARCHAR(500) NOT NULL, -- Training title/name
        description NVARCHAR(2000), -- Detailed description of training content
        
        -- Training Classification
        category NVARCHAR(100) NOT NULL, -- Category (e.g., 'Safety', 'Quality', 'Technical', 'Compliance')
        trainingType NVARCHAR(100), -- Type (e.g., 'Internal', 'External', 'Online', 'On-the-job')
        
        -- Training Details
        duration INT, -- Duration in minutes
        instructor NVARCHAR(200), -- Instructor name
        instructorOrganization NVARCHAR(200), -- Organization providing training (if external)
        location NVARCHAR(200), -- Training location
        
        -- Scheduling
        scheduledDate DATETIME2 NOT NULL, -- Scheduled date and time
        completedDate DATETIME2, -- Actual completion date
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'expired'
        
        -- Certification and Validity
        requiresCertification BIT DEFAULT 0, -- Whether certification is required
        expiryMonths INT, -- Certificate validity period in months (NULL = no expiry)
        
        -- Capacity and Requirements
        maxAttendees INT, -- Maximum number of attendees (NULL = unlimited)
        prerequisiteTraining INT NULL, -- Reference to prerequisite training (self-referential)
        
        -- Content and Materials
        learningObjectives NVARCHAR(2000), -- Learning objectives
        materials NVARCHAR(1000), -- Training materials reference or path
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this training
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Trainings_PrerequisiteTraining FOREIGN KEY (prerequisiteTraining) REFERENCES Trainings(id),
        CONSTRAINT FK_Trainings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Trainings_Status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'expired')),
        CONSTRAINT CK_Trainings_Duration CHECK (duration IS NULL OR duration > 0),
        CONSTRAINT CK_Trainings_MaxAttendees CHECK (maxAttendees IS NULL OR maxAttendees > 0),
        CONSTRAINT CK_Trainings_ExpiryMonths CHECK (expiryMonths IS NULL OR expiryMonths > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Trainings_TrainingNumber ON Trainings(trainingNumber);
    
    -- Classification and filtering
    CREATE INDEX IX_Trainings_Category ON Trainings(category);
    CREATE INDEX IX_Trainings_TrainingType ON Trainings(trainingType);
    CREATE INDEX IX_Trainings_Status ON Trainings(status);
    
    -- Date-based queries
    CREATE INDEX IX_Trainings_ScheduledDate ON Trainings(scheduledDate);
    CREATE INDEX IX_Trainings_CompletedDate ON Trainings(completedDate);
    CREATE INDEX IX_Trainings_CreatedAt ON Trainings(createdAt);
    
    -- Relationships
    CREATE INDEX IX_Trainings_CreatedBy ON Trainings(createdBy);
    CREATE INDEX IX_Trainings_PrerequisiteTraining ON Trainings(prerequisiteTraining);
    CREATE INDEX IX_Trainings_Instructor ON Trainings(instructor);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Trainings_Status_ScheduledDate ON Trainings(status, scheduledDate);
    CREATE INDEX IX_Trainings_Category_Status ON Trainings(category, status);
    CREATE INDEX IX_Trainings_Status_Category_ScheduledDate ON Trainings(status, category, scheduledDate);
    
    -- Title search
    CREATE INDEX IX_Trainings_Title ON Trainings(title);

    PRINT 'Trainings table created successfully';
END
ELSE
BEGIN
    PRINT 'Trainings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.21' AND scriptName = '21_create_trainings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.21',
        'Create Trainings table for training events and sessions',
        '21_create_trainings_table.sql',
        'SUCCESS',
        'Trainings table supports ISO 9001 competence management with training event tracking and certification requirements'
    );
END
GO

-- =============================================
-- TrainingAttendees Table
-- =============================================
-- Junction table linking users to training sessions
-- Tracks attendance, performance, and completion status
-- Supports ISO 9001 training records and competence tracking

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingAttendees')
BEGIN
    CREATE TABLE TrainingAttendees (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        trainingId INT NOT NULL, -- Reference to training event
        userId INT NOT NULL, -- Reference to user/employee
        
        -- Attendance Tracking
        attended BIT DEFAULT 0, -- Whether the user attended the training
        attendanceDate DATETIME2, -- Date of attendance (may differ from scheduled date)
        
        -- Performance and Assessment
        score DECIMAL(5,2), -- Score/grade (0-100 scale)
        passed BIT, -- Whether the user passed (if applicable)
        assessmentNotes NVARCHAR(1000), -- Notes on performance or assessment
        
        -- Certificate Information
        certificateIssued BIT DEFAULT 0, -- Whether certificate was issued
        certificateNumber NVARCHAR(100), -- Certificate number/identifier
        certificateDate DATETIME2, -- Date certificate was issued
        expiryDate DATETIME2, -- Certificate expiry date (calculated from training.expiryMonths)
        
        -- Certificate File Reference
        -- Note: Actual certificate files are stored in Attachments table with entityType='training' and entityId=this.id
        certificateFileId INT, -- Optional direct reference to certificate attachment
        
        -- Training Status
        status NVARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'completed', 'failed', 'expired', 'cancelled'
        
        -- Additional Information
        registrationDate DATETIME2 DEFAULT GETDATE(), -- When user was registered for training
        completionDate DATETIME2, -- Date training was completed
        notes NVARCHAR(1000), -- Additional notes or comments
        
        -- Verification and Approval
        verifiedBy INT, -- User who verified attendance/completion
        verifiedAt DATETIME2, -- When verification was done
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who registered this attendee
        
        -- Foreign Key Constraints
        CONSTRAINT FK_TrainingAttendees_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_TrainingAttendees_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_CertificateFile FOREIGN KEY (certificateFileId) REFERENCES Attachments(id),
        
        -- Constraints
        CONSTRAINT CK_TrainingAttendees_Status CHECK (status IN (
            'registered',
            'attended',
            'completed',
            'failed',
            'expired',
            'cancelled'
        )),
        CONSTRAINT CK_TrainingAttendees_Score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
        
        -- Unique constraint: A user can only be registered once per training
        CONSTRAINT UQ_TrainingAttendees_Training_User UNIQUE (trainingId, userId)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_TrainingAttendees_TrainingId ON TrainingAttendees(trainingId);
    CREATE INDEX IX_TrainingAttendees_UserId ON TrainingAttendees(userId);
    
    -- Status and attendance tracking
    CREATE INDEX IX_TrainingAttendees_Status ON TrainingAttendees(status);
    CREATE INDEX IX_TrainingAttendees_Attended ON TrainingAttendees(attended);
    CREATE INDEX IX_TrainingAttendees_Passed ON TrainingAttendees(passed);
    CREATE INDEX IX_TrainingAttendees_CertificateIssued ON TrainingAttendees(certificateIssued);
    
    -- Date-based queries
    CREATE INDEX IX_TrainingAttendees_AttendanceDate ON TrainingAttendees(attendanceDate);
    CREATE INDEX IX_TrainingAttendees_CertificateDate ON TrainingAttendees(certificateDate);
    CREATE INDEX IX_TrainingAttendees_ExpiryDate ON TrainingAttendees(expiryDate);
    CREATE INDEX IX_TrainingAttendees_CompletionDate ON TrainingAttendees(completionDate);
    CREATE INDEX IX_TrainingAttendees_RegistrationDate ON TrainingAttendees(registrationDate);
    
    -- Certificate tracking
    CREATE INDEX IX_TrainingAttendees_CertificateNumber ON TrainingAttendees(certificateNumber);
    CREATE INDEX IX_TrainingAttendees_CertificateFileId ON TrainingAttendees(certificateFileId);
    
    -- Verification tracking
    CREATE INDEX IX_TrainingAttendees_VerifiedBy ON TrainingAttendees(verifiedBy);
    CREATE INDEX IX_TrainingAttendees_VerifiedAt ON TrainingAttendees(verifiedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_TrainingAttendees_User_Status ON TrainingAttendees(userId, status);
    CREATE INDEX IX_TrainingAttendees_Training_Status ON TrainingAttendees(trainingId, status);
    CREATE INDEX IX_TrainingAttendees_User_Expiry ON TrainingAttendees(userId, expiryDate) WHERE certificateIssued = 1;
    CREATE INDEX IX_TrainingAttendees_Training_Attended ON TrainingAttendees(trainingId, attended);
    CREATE INDEX IX_TrainingAttendees_Status_ExpiryDate ON TrainingAttendees(status, expiryDate) WHERE certificateIssued = 1;

    PRINT 'TrainingAttendees table created successfully';
END
ELSE
BEGIN
    PRINT 'TrainingAttendees table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.22' AND scriptName = '22_create_training_attendees_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.22',
        'Create TrainingAttendees table for training records and certificates',
        '22_create_training_attendees_table.sql',
        'SUCCESS',
        'TrainingAttendees table supports ISO 9001 training records with attendance tracking, assessment, and certificate management'
    );
END
GO


-- =============================================
-- TrainingCertificates Table
-- =============================================
-- Stores detailed certificate metadata and external certifications
-- Supports both internally issued and externally obtained certificates
-- Tracks certificate lifecycle, renewals, and compliance

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingCertificates')
BEGIN
    CREATE TABLE TrainingCertificates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Certificate Identification
        certificateNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique certificate identifier
        certificateName NVARCHAR(500) NOT NULL, -- Certificate name/title
        
        -- Ownership and Association
        userId INT NOT NULL, -- User who holds the certificate
        trainingAttendeeId INT, -- Optional link to training attendee record (NULL for external certs)
        trainingId INT, -- Optional link to training event (NULL for external certs)
        
        -- Issuing Authority
        issuerName NVARCHAR(200) NOT NULL, -- Organization that issued certificate
        issuerContact NVARCHAR(200), -- Contact information for issuer
        accreditationBody NVARCHAR(200), -- Accreditation body (if applicable)
        
        -- Certificate Details
        certificateType NVARCHAR(100) NOT NULL, -- Type (e.g., 'Internal', 'External', 'Professional', 'Regulatory')
        competencyArea NVARCHAR(200), -- Area of competency covered
        level NVARCHAR(100), -- Level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        
        -- Date Tracking
        issueDate DATETIME2 NOT NULL, -- Date certificate was issued
        effectiveDate DATETIME2, -- Date certificate becomes effective (may differ from issue date)
        expiryDate DATETIME2, -- Certificate expiration date (NULL = no expiry)
        
        -- Renewal and Maintenance
        requiresRenewal BIT DEFAULT 0, -- Whether certificate requires periodic renewal
        renewalIntervalMonths INT, -- Renewal interval in months
        lastRenewalDate DATETIME2, -- Date of last renewal
        nextRenewalDate DATETIME2, -- Date of next required renewal
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'suspended', 'revoked', 'renewed'
        revocationDate DATETIME2, -- Date certificate was revoked (if applicable)
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Certificate File Reference
        -- Actual certificate file stored in Attachments table with entityType='training' or 'training_certificate'
        certificateFileId INT, -- Reference to certificate file in Attachments
        
        -- Verification and Validation
        verified BIT DEFAULT 0, -- Whether certificate has been verified
        verifiedBy INT, -- User who verified the certificate
        verifiedAt DATETIME2, -- When verification was done
        verificationMethod NVARCHAR(200), -- Method of verification (e.g., 'Online', 'Email', 'Phone')
        verificationNotes NVARCHAR(1000), -- Notes on verification process
        
        -- Compliance and Requirements
        regulatoryRequirement BIT DEFAULT 0, -- Whether this is a regulatory requirement
        mandatoryForRoles NVARCHAR(500), -- Roles for which this certificate is mandatory
        
        -- Additional Information
        description NVARCHAR(2000), -- Description of certificate and competencies covered
        notes NVARCHAR(1000), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_TrainingCertificates_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_TrainingCertificates_TrainingAttendee FOREIGN KEY (trainingAttendeeId) REFERENCES TrainingAttendees(id),
        CONSTRAINT FK_TrainingCertificates_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_TrainingCertificates_CertificateFile FOREIGN KEY (certificateFileId) REFERENCES Attachments(id),
        CONSTRAINT FK_TrainingCertificates_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingCertificates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_TrainingCertificates_Status CHECK (status IN (
            'active',
            'expired',
            'suspended',
            'revoked',
            'renewed'
        )),
        CONSTRAINT CK_TrainingCertificates_CertificateType CHECK (certificateType IN (
            'Internal',
            'External',
            'Professional',
            'Regulatory',
            'Safety',
            'Technical',
            'Compliance'
        )),
        CONSTRAINT CK_TrainingCertificates_RenewalInterval CHECK (renewalIntervalMonths IS NULL OR renewalIntervalMonths > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_TrainingCertificates_CertificateNumber ON TrainingCertificates(certificateNumber);
    
    -- User and relationship lookups
    CREATE INDEX IX_TrainingCertificates_UserId ON TrainingCertificates(userId);
    CREATE INDEX IX_TrainingCertificates_TrainingAttendeeId ON TrainingCertificates(trainingAttendeeId);
    CREATE INDEX IX_TrainingCertificates_TrainingId ON TrainingCertificates(trainingId);
    
    -- Status and type filtering
    CREATE INDEX IX_TrainingCertificates_Status ON TrainingCertificates(status);
    CREATE INDEX IX_TrainingCertificates_CertificateType ON TrainingCertificates(certificateType);
    CREATE INDEX IX_TrainingCertificates_CompetencyArea ON TrainingCertificates(competencyArea);
    
    -- Date-based queries
    CREATE INDEX IX_TrainingCertificates_IssueDate ON TrainingCertificates(issueDate);
    CREATE INDEX IX_TrainingCertificates_ExpiryDate ON TrainingCertificates(expiryDate);
    CREATE INDEX IX_TrainingCertificates_EffectiveDate ON TrainingCertificates(effectiveDate);
    CREATE INDEX IX_TrainingCertificates_NextRenewalDate ON TrainingCertificates(nextRenewalDate);
    CREATE INDEX IX_TrainingCertificates_RevocationDate ON TrainingCertificates(revocationDate);
    
    -- Verification tracking
    CREATE INDEX IX_TrainingCertificates_Verified ON TrainingCertificates(verified);
    CREATE INDEX IX_TrainingCertificates_VerifiedBy ON TrainingCertificates(verifiedBy);
    CREATE INDEX IX_TrainingCertificates_VerifiedAt ON TrainingCertificates(verifiedAt);
    
    -- Issuer and accreditation
    CREATE INDEX IX_TrainingCertificates_IssuerName ON TrainingCertificates(issuerName);
    CREATE INDEX IX_TrainingCertificates_AccreditationBody ON TrainingCertificates(accreditationBody);
    
    -- Compliance tracking
    CREATE INDEX IX_TrainingCertificates_RegulatoryRequirement ON TrainingCertificates(regulatoryRequirement);
    CREATE INDEX IX_TrainingCertificates_RequiresRenewal ON TrainingCertificates(requiresRenewal);
    
    -- File references
    CREATE INDEX IX_TrainingCertificates_CertificateFileId ON TrainingCertificates(certificateFileId);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_TrainingCertificates_User_Status ON TrainingCertificates(userId, status);
    CREATE INDEX IX_TrainingCertificates_User_Expiry ON TrainingCertificates(userId, expiryDate) WHERE status = 'active';
    CREATE INDEX IX_TrainingCertificates_Status_ExpiryDate ON TrainingCertificates(status, expiryDate);
    CREATE INDEX IX_TrainingCertificates_User_CompetencyArea ON TrainingCertificates(userId, competencyArea);
    CREATE INDEX IX_TrainingCertificates_Status_NextRenewal ON TrainingCertificates(status, nextRenewalDate) WHERE requiresRenewal = 1;
    CREATE INDEX IX_TrainingCertificates_Regulatory_Status ON TrainingCertificates(regulatoryRequirement, status);
    
    -- Name search
    CREATE INDEX IX_TrainingCertificates_CertificateName ON TrainingCertificates(certificateName);

    PRINT 'TrainingCertificates table created successfully';
END
ELSE
BEGIN
    PRINT 'TrainingCertificates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.23' AND scriptName = '23_create_training_certificates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.23',
        'Create TrainingCertificates table for certificate lifecycle management',
        '23_create_training_certificates_table.sql',
        'SUCCESS',
        'TrainingCertificates table supports detailed certificate tracking including external certifications, renewals, and compliance requirements'
    );
END
GO


-- =============================================
-- Competencies Table
-- =============================================
-- Defines competencies/skills that employees can achieve
-- Supports ISO 9001 competence management requirements
-- Competencies can be linked to trainings and required for roles/positions

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Competencies')
BEGIN
    CREATE TABLE Competencies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Competency Identification
        competencyCode NVARCHAR(100) UNIQUE NOT NULL, -- Unique competency identifier
        name NVARCHAR(500) NOT NULL, -- Competency name/title
        description NVARCHAR(2000), -- Detailed description of competency
        
        -- Classification
        category NVARCHAR(200) NOT NULL, -- Category (e.g., 'Technical', 'Safety', 'Quality', 'Management')
        subCategory NVARCHAR(200), -- Sub-category for more granular classification
        competencyType NVARCHAR(100), -- Type (e.g., 'Hard Skill', 'Soft Skill', 'Certification', 'License')
        
        -- Competency Details
        level NVARCHAR(100), -- Proficiency level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        version NVARCHAR(50), -- Version of competency definition (for tracking changes over time)
        
        -- Requirements
        isRegulatory BIT DEFAULT 0, -- Whether this is a regulatory requirement
        isMandatory BIT DEFAULT 0, -- Whether this competency is mandatory for certain roles
        mandatoryForRoles NVARCHAR(500), -- Comma-separated role names requiring this competency
        prerequisiteCompetencies NVARCHAR(500), -- Comma-separated competency IDs that are prerequisites
        
        -- Validity and Expiration
        hasExpiry BIT DEFAULT 0, -- Whether this competency expires
        defaultValidityMonths INT, -- Default validity period in months (NULL = no expiry)
        renewalRequired BIT DEFAULT 0, -- Whether renewal is required after expiry
        
        -- Training Association
        relatedTrainingIds NVARCHAR(500), -- Comma-separated training IDs that provide this competency
        minimumTrainingHours DECIMAL(5,2), -- Minimum training hours required
        
        -- Assessment
        requiresAssessment BIT DEFAULT 0, -- Whether formal assessment is required
        assessmentCriteria NVARCHAR(2000), -- Assessment criteria or method
        minimumScore DECIMAL(5,2), -- Minimum score required (0-100 scale)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'deprecated', 'draft', 'obsolete'
        effectiveDate DATETIME2, -- Date competency definition becomes effective
        obsoleteDate DATETIME2, -- Date competency was marked obsolete
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        externalReference NVARCHAR(500), -- External standard or reference (e.g., ISO certification number)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this competency definition
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Competencies_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Competencies_Status CHECK (status IN ('active', 'deprecated', 'draft', 'obsolete')),
        CONSTRAINT CK_Competencies_DefaultValidityMonths CHECK (defaultValidityMonths IS NULL OR defaultValidityMonths > 0),
        CONSTRAINT CK_Competencies_MinimumTrainingHours CHECK (minimumTrainingHours IS NULL OR minimumTrainingHours >= 0),
        CONSTRAINT CK_Competencies_MinimumScore CHECK (minimumScore IS NULL OR (minimumScore >= 0 AND minimumScore <= 100))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Competencies_CompetencyCode ON Competencies(competencyCode);
    
    -- Classification and filtering
    CREATE INDEX IX_Competencies_Category ON Competencies(category);
    CREATE INDEX IX_Competencies_SubCategory ON Competencies(subCategory);
    CREATE INDEX IX_Competencies_CompetencyType ON Competencies(competencyType);
    CREATE INDEX IX_Competencies_Level ON Competencies(level);
    
    -- Status and lifecycle
    CREATE INDEX IX_Competencies_Status ON Competencies(status);
    CREATE INDEX IX_Competencies_EffectiveDate ON Competencies(effectiveDate);
    CREATE INDEX IX_Competencies_ObsoleteDate ON Competencies(obsoleteDate);
    
    -- Requirements tracking
    CREATE INDEX IX_Competencies_IsRegulatory ON Competencies(isRegulatory);
    CREATE INDEX IX_Competencies_IsMandatory ON Competencies(isMandatory);
    CREATE INDEX IX_Competencies_HasExpiry ON Competencies(hasExpiry);
    CREATE INDEX IX_Competencies_RenewalRequired ON Competencies(renewalRequired);
    CREATE INDEX IX_Competencies_RequiresAssessment ON Competencies(requiresAssessment);
    
    -- Relationships
    CREATE INDEX IX_Competencies_CreatedBy ON Competencies(createdBy);
    
    -- Date-based queries
    CREATE INDEX IX_Competencies_CreatedAt ON Competencies(createdAt);
    CREATE INDEX IX_Competencies_UpdatedAt ON Competencies(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Competencies_Status_Category ON Competencies(status, category);
    CREATE INDEX IX_Competencies_Category_Level ON Competencies(category, level);
    CREATE INDEX IX_Competencies_Status_EffectiveDate ON Competencies(status, effectiveDate);
    CREATE INDEX IX_Competencies_Mandatory_Status ON Competencies(isMandatory, status);
    CREATE INDEX IX_Competencies_Regulatory_Status ON Competencies(isRegulatory, status);
    
    -- Name search
    CREATE INDEX IX_Competencies_Name ON Competencies(name);

    PRINT 'Competencies table created successfully';
END
ELSE
BEGIN
    PRINT 'Competencies table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.24' AND scriptName = '24_create_competencies_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.24',
        'Create Competencies table for competency definitions',
        '24_create_competencies_table.sql',
        'SUCCESS',
        'Competencies table supports ISO 9001 competence management with competency definitions, classification, validity rules, and training associations'
    );
END
GO


-- =============================================
-- UserCompetencies Table
-- =============================================
-- Maps users to their achieved competencies
-- Tracks competency acquisition, validity, expiration, and renewal
-- Supports ISO 9001 competence tracking and management

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserCompetencies')
BEGIN
    CREATE TABLE UserCompetencies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        userId INT NOT NULL, -- User who holds the competency
        competencyId INT NOT NULL, -- Reference to competency definition
        
        -- Acquisition Details
        acquiredDate DATETIME2 NOT NULL, -- Date competency was acquired
        acquisitionMethod NVARCHAR(200), -- How competency was acquired (e.g., 'Training', 'Assessment', 'Experience', 'Transfer')
        
        -- Training and Certificate References
        trainingId INT, -- Optional reference to training that provided this competency
        trainingAttendeeId INT, -- Optional reference to training attendance record
        certificateId INT, -- Optional reference to certificate
        
        -- Proficiency and Assessment
        proficiencyLevel NVARCHAR(100), -- Current proficiency level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        assessmentScore DECIMAL(5,2), -- Assessment score (0-100 scale)
        assessedBy INT, -- User who assessed the competency
        assessedAt DATETIME2, -- Date of assessment
        assessmentNotes NVARCHAR(1000), -- Notes from assessment
        
        -- Validity and Expiration
        effectiveDate DATETIME2 NOT NULL, -- Date competency becomes effective
        expiryDate DATETIME2, -- Date competency expires (NULL = no expiry)
        isExpired AS (
            CASE 
                WHEN expiryDate IS NOT NULL AND expiryDate < GETDATE() THEN 1
                ELSE 0
            END
        ), -- Computed column for expiry status
        
        -- Renewal Tracking
        lastRenewalDate DATETIME2, -- Date of last renewal
        nextRenewalDate DATETIME2, -- Date of next required renewal
        renewalCount INT DEFAULT 0, -- Number of times renewed
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'suspended', 'revoked', 'pending'
        statusReason NVARCHAR(500), -- Reason for current status (especially for suspended/revoked)
        statusChangedAt DATETIME2, -- When status last changed
        statusChangedBy INT, -- User who changed the status
        
        -- Verification and Approval
        verified BIT DEFAULT 0, -- Whether competency has been verified
        verifiedBy INT, -- User who verified the competency
        verifiedAt DATETIME2, -- Date of verification
        verificationMethod NVARCHAR(200), -- Method of verification
        verificationNotes NVARCHAR(1000), -- Notes on verification
        
        -- Evidence and Documentation
        evidenceDescription NVARCHAR(2000), -- Description of evidence supporting competency
        evidenceFileIds NVARCHAR(500), -- Comma-separated attachment IDs for evidence files
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        externalReference NVARCHAR(500), -- External reference (e.g., license number)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this competency record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_UserCompetencies_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_Competency FOREIGN KEY (competencyId) REFERENCES Competencies(id),
        CONSTRAINT FK_UserCompetencies_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_UserCompetencies_TrainingAttendee FOREIGN KEY (trainingAttendeeId) REFERENCES TrainingAttendees(id),
        CONSTRAINT FK_UserCompetencies_Certificate FOREIGN KEY (certificateId) REFERENCES TrainingCertificates(id),
        CONSTRAINT FK_UserCompetencies_AssessedBy FOREIGN KEY (assessedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_StatusChangedBy FOREIGN KEY (statusChangedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_UserCompetencies_Status CHECK (status IN (
            'active',
            'expired',
            'suspended',
            'revoked',
            'pending'
        )),
        CONSTRAINT CK_UserCompetencies_AssessmentScore CHECK (assessmentScore IS NULL OR (assessmentScore >= 0 AND assessmentScore <= 100)),
        CONSTRAINT CK_UserCompetencies_RenewalCount CHECK (renewalCount >= 0),
        
        -- Unique constraint: A user can have only one active record per competency
        -- This allows historical records but prevents duplicates
        CONSTRAINT UQ_UserCompetencies_User_Competency_Status UNIQUE (userId, competencyId, status)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_UserCompetencies_UserId ON UserCompetencies(userId);
    CREATE INDEX IX_UserCompetencies_CompetencyId ON UserCompetencies(competencyId);
    
    -- Status and lifecycle
    CREATE INDEX IX_UserCompetencies_Status ON UserCompetencies(status);
    -- CREATE INDEX IX_UserCompetencies_IsExpired ON UserCompetencies(isExpired);
    CREATE INDEX IX_UserCompetencies_Verified ON UserCompetencies(verified);
    
    -- Date-based queries
    CREATE INDEX IX_UserCompetencies_AcquiredDate ON UserCompetencies(acquiredDate);
    CREATE INDEX IX_UserCompetencies_EffectiveDate ON UserCompetencies(effectiveDate);
    CREATE INDEX IX_UserCompetencies_ExpiryDate ON UserCompetencies(expiryDate);
    CREATE INDEX IX_UserCompetencies_NextRenewalDate ON UserCompetencies(nextRenewalDate);
    CREATE INDEX IX_UserCompetencies_LastRenewalDate ON UserCompetencies(lastRenewalDate);
    CREATE INDEX IX_UserCompetencies_AssessedAt ON UserCompetencies(assessedAt);
    CREATE INDEX IX_UserCompetencies_VerifiedAt ON UserCompetencies(verifiedAt);
    CREATE INDEX IX_UserCompetencies_StatusChangedAt ON UserCompetencies(statusChangedAt);
    
    -- Relationship tracking
    CREATE INDEX IX_UserCompetencies_TrainingId ON UserCompetencies(trainingId);
    CREATE INDEX IX_UserCompetencies_TrainingAttendeeId ON UserCompetencies(trainingAttendeeId);
    CREATE INDEX IX_UserCompetencies_CertificateId ON UserCompetencies(certificateId);
    CREATE INDEX IX_UserCompetencies_AssessedBy ON UserCompetencies(assessedBy);
    CREATE INDEX IX_UserCompetencies_VerifiedBy ON UserCompetencies(verifiedBy);
    CREATE INDEX IX_UserCompetencies_StatusChangedBy ON UserCompetencies(statusChangedBy);
    CREATE INDEX IX_UserCompetencies_CreatedBy ON UserCompetencies(createdBy);
    
    -- Proficiency and assessment
    CREATE INDEX IX_UserCompetencies_ProficiencyLevel ON UserCompetencies(proficiencyLevel);
    CREATE INDEX IX_UserCompetencies_AcquisitionMethod ON UserCompetencies(acquisitionMethod);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_UserCompetencies_User_Status ON UserCompetencies(userId, status);
    CREATE INDEX IX_UserCompetencies_User_Competency ON UserCompetencies(userId, competencyId);
    CREATE INDEX IX_UserCompetencies_Competency_Status ON UserCompetencies(competencyId, status);
    CREATE INDEX IX_UserCompetencies_Status_ExpiryDate ON UserCompetencies(status, expiryDate);
    CREATE INDEX IX_UserCompetencies_User_EffectiveDate ON UserCompetencies(userId, effectiveDate);
    CREATE INDEX IX_UserCompetencies_User_ExpiryDate ON UserCompetencies(userId, expiryDate) WHERE expiryDate IS NOT NULL;
    CREATE INDEX IX_UserCompetencies_Status_NextRenewal ON UserCompetencies(status, nextRenewalDate) WHERE nextRenewalDate IS NOT NULL;
    -- CREATE INDEX IX_UserCompetencies_User_Status_Expiry ON UserCompetencies(userId, status, isExpired);
    -- CREATE INDEX IX_UserCompetencies_Expired_Users ON UserCompetencies(isExpired, userId);
    CREATE INDEX IX_UserCompetencies_Training_User ON UserCompetencies(trainingId, userId) WHERE trainingId IS NOT NULL;
    
    -- Audit trail
    CREATE INDEX IX_UserCompetencies_CreatedAt ON UserCompetencies(createdAt);
    CREATE INDEX IX_UserCompetencies_UpdatedAt ON UserCompetencies(updatedAt);

    PRINT 'UserCompetencies table created successfully';
END
ELSE
BEGIN
    PRINT 'UserCompetencies table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.25' AND scriptName = '25_create_user_competencies_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.25',
        'Create UserCompetencies table for user-to-competency mapping',
        '25_create_user_competencies_table.sql',
        'SUCCESS',
        'UserCompetencies table supports ISO 9001 competence tracking with acquisition tracking, validity periods, expiration rules, renewal management, and verification workflows'
    );
END
GO


-- =============================================
-- RoleTrainingRequirements Table
-- =============================================
-- Junction table mapping roles to required competencies
-- Defines which competencies are mandatory for each role
-- Supports ISO 9001:2015 competence requirements per role

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoleTrainingRequirements')
BEGIN
    CREATE TABLE RoleTrainingRequirements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        roleId INT NOT NULL, -- Role that requires this competency
        competencyId INT NOT NULL, -- Required competency
        
        -- Requirement Details
        isMandatory BIT DEFAULT 1, -- Whether this competency is mandatory for the role
        isRegulatory BIT DEFAULT 0, -- Whether this is a regulatory requirement
        priority NVARCHAR(50) DEFAULT 'normal', -- Priority level: 'critical', 'high', 'normal', 'low'
        
        -- Grace Period and Compliance
        gracePeriodDays INT, -- Days after role assignment before requirement must be met
        complianceDeadline DATETIME2, -- Optional specific deadline for compliance
        
        -- Training Specifications
        minimumProficiencyLevel NVARCHAR(100), -- Minimum required proficiency level
        refreshFrequencyMonths INT, -- How often competency must be refreshed (NULL = no refresh required)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'deprecated'
        effectiveDate DATETIME2 DEFAULT GETDATE(), -- When this requirement becomes effective
        endDate DATETIME2, -- When this requirement expires (NULL = no expiry)
        
        -- Documentation
        justification NVARCHAR(2000), -- Why this competency is required for this role
        regulatoryReference NVARCHAR(500), -- Reference to regulation/standard if applicable
        notes NVARCHAR(2000), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this requirement
        
        -- Foreign Key Constraints
        CONSTRAINT FK_RoleTrainingRequirements_Role FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_RoleTrainingRequirements_Competency FOREIGN KEY (competencyId) REFERENCES Competencies(id),
        CONSTRAINT FK_RoleTrainingRequirements_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_RoleTrainingRequirements_Priority CHECK (priority IN ('critical', 'high', 'normal', 'low')),
        CONSTRAINT CK_RoleTrainingRequirements_Status CHECK (status IN ('active', 'inactive', 'deprecated')),
        CONSTRAINT CK_RoleTrainingRequirements_GracePeriod CHECK (gracePeriodDays IS NULL OR gracePeriodDays >= 0),
        CONSTRAINT CK_RoleTrainingRequirements_RefreshFrequency CHECK (refreshFrequencyMonths IS NULL OR refreshFrequencyMonths > 0),
        
        -- Unique constraint: One requirement per role-competency combination (active records only)
        CONSTRAINT UQ_RoleTrainingRequirements_Role_Competency UNIQUE (roleId, competencyId)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_RoleTrainingRequirements_RoleId ON RoleTrainingRequirements(roleId);
    CREATE INDEX IX_RoleTrainingRequirements_CompetencyId ON RoleTrainingRequirements(competencyId);
    
    -- Status and lifecycle
    CREATE INDEX IX_RoleTrainingRequirements_Status ON RoleTrainingRequirements(status);
    CREATE INDEX IX_RoleTrainingRequirements_EffectiveDate ON RoleTrainingRequirements(effectiveDate);
    CREATE INDEX IX_RoleTrainingRequirements_EndDate ON RoleTrainingRequirements(endDate);
    
    -- Requirement attributes
    CREATE INDEX IX_RoleTrainingRequirements_IsMandatory ON RoleTrainingRequirements(isMandatory);
    CREATE INDEX IX_RoleTrainingRequirements_IsRegulatory ON RoleTrainingRequirements(isRegulatory);
    CREATE INDEX IX_RoleTrainingRequirements_Priority ON RoleTrainingRequirements(priority);
    
    -- Compliance tracking
    CREATE INDEX IX_RoleTrainingRequirements_ComplianceDeadline ON RoleTrainingRequirements(complianceDeadline);
    CREATE INDEX IX_RoleTrainingRequirements_RefreshFrequency ON RoleTrainingRequirements(refreshFrequencyMonths);
    
    -- Audit trail
    CREATE INDEX IX_RoleTrainingRequirements_CreatedBy ON RoleTrainingRequirements(createdBy);
    CREATE INDEX IX_RoleTrainingRequirements_CreatedAt ON RoleTrainingRequirements(createdAt);
    CREATE INDEX IX_RoleTrainingRequirements_UpdatedAt ON RoleTrainingRequirements(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_RoleTrainingRequirements_Role_Status ON RoleTrainingRequirements(roleId, status);
    CREATE INDEX IX_RoleTrainingRequirements_Competency_Status ON RoleTrainingRequirements(competencyId, status);
    CREATE INDEX IX_RoleTrainingRequirements_Status_Priority ON RoleTrainingRequirements(status, priority);
    CREATE INDEX IX_RoleTrainingRequirements_Role_Mandatory ON RoleTrainingRequirements(roleId, isMandatory) WHERE status = 'active';
    CREATE INDEX IX_RoleTrainingRequirements_Role_Regulatory ON RoleTrainingRequirements(roleId, isRegulatory) WHERE status = 'active';

    PRINT 'RoleTrainingRequirements table created successfully';
END
ELSE
BEGIN
    PRINT 'RoleTrainingRequirements table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.26' AND scriptName = '26_create_role_training_requirements_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.26',
        'Create RoleTrainingRequirements table for role-to-competency mapping',
        '26_create_role_training_requirements_table.sql',
        'SUCCESS',
        'RoleTrainingRequirements table defines which competencies are required for each role, supporting ISO 9001 competence management per role with priority levels, compliance tracking, and refresh requirements'
    );
END
GO


-- =============================================
-- Audits Table (Audit Plans)
-- =============================================
-- Stores planned audits including internal audits, process audits, and external audits
-- Tracks audit scope, schedules, auditors, related processes, and audit criteria
-- Supports ISO 9001 audit planning and execution requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Audits')
BEGIN
    CREATE TABLE Audits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Audit Identification
        auditNumber NVARCHAR(50) UNIQUE NOT NULL, -- Unique audit identifier (e.g., 'AUD-2024-001')
        title NVARCHAR(200) NOT NULL, -- Audit title or name
        description NVARCHAR(2000), -- Detailed audit description and purpose
        
        -- Audit Classification
        auditType NVARCHAR(100) NOT NULL, -- Type of audit (Internal, External, Process, Compliance, Product, System, Supplier, Certification, Management Review)
        scope NVARCHAR(2000) NOT NULL, -- Audit scope definition - what will be audited
        
        -- Audit Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'planned', -- Status: planned, in_progress, completed, closed
        scheduledDate DATETIME2 NOT NULL, -- When the audit is scheduled to occur
        completedDate DATETIME2, -- When the audit was actually completed
        
        -- Personnel
        leadAuditorId INT NOT NULL, -- Lead auditor responsible for the audit
        department NVARCHAR(100), -- Department or area being audited
        
        -- Audit Criteria and Processes
        auditCriteria NVARCHAR(2000), -- Audit criteria and standards being applied (e.g., 'ISO 9001:2015 clauses 4.1, 4.2, 8.5')
        relatedProcesses NVARCHAR(1000), -- Comma-separated list of process IDs or process codes being audited
        
        -- Audit Results and Findings
        findings NVARCHAR(MAX), -- Audit findings and observations (JSON or structured text)
        conclusions NVARCHAR(MAX), -- Audit conclusions and summary
        
        -- Audit Metadata
        createdBy INT NOT NULL, -- User who created/planned this audit
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Audits_LeadAuditor FOREIGN KEY (leadAuditorId) REFERENCES Users(id),
        CONSTRAINT FK_Audits_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_Audits_Status CHECK (status IN ('planned', 'in_progress', 'completed', 'closed')),
        CONSTRAINT CK_Audits_Dates CHECK (completedDate IS NULL OR completedDate >= scheduledDate)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique audit number for quick lookups
    CREATE UNIQUE INDEX IX_Audits_AuditNumber ON Audits(auditNumber);
    
    -- Status filtering (most common query pattern)
    CREATE INDEX IX_Audits_Status ON Audits(status);
    CREATE INDEX IX_Audits_Status_ScheduledDate ON Audits(status, scheduledDate DESC);
    
    -- Date-based queries for audit scheduling and reporting
    CREATE INDEX IX_Audits_ScheduledDate ON Audits(scheduledDate DESC);
    CREATE INDEX IX_Audits_CompletedDate ON Audits(completedDate DESC);
    CREATE INDEX IX_Audits_ScheduledDate_Status ON Audits(scheduledDate DESC, status);
    
    -- Audit type filtering
    CREATE INDEX IX_Audits_AuditType ON Audits(auditType);
    CREATE INDEX IX_Audits_AuditType_Status ON Audits(auditType, status);
    
    -- Personnel tracking
    CREATE INDEX IX_Audits_LeadAuditorId ON Audits(leadAuditorId);
    CREATE INDEX IX_Audits_LeadAuditorId_Status ON Audits(leadAuditorId, status);
    CREATE INDEX IX_Audits_CreatedBy ON Audits(createdBy);
    
    -- Department filtering
    CREATE INDEX IX_Audits_Department ON Audits(department) WHERE department IS NOT NULL;
    CREATE INDEX IX_Audits_Department_Status ON Audits(department, status) WHERE department IS NOT NULL;
    
    -- Process filtering (for queries involving related processes)
    -- Note: This is a text field with comma-separated values, so it's indexed for text search
    CREATE INDEX IX_Audits_RelatedProcesses ON Audits(relatedProcesses) WHERE relatedProcesses IS NOT NULL;
    
    -- Timestamp tracking for audit trail and reporting
    CREATE INDEX IX_Audits_CreatedAt ON Audits(createdAt DESC);
    CREATE INDEX IX_Audits_UpdatedAt ON Audits(updatedAt DESC);

    PRINT 'Audits table created successfully with comprehensive indexing for audit planning and execution';
END
ELSE
BEGIN
    PRINT 'Audits table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.27' AND scriptName = '27_create_audits_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.27',
        'Create Audits table for audit planning and execution',
        '27_create_audits_table.sql',
        'SUCCESS',
        'Audits table stores planned audits including scope, dates, auditors, related processes, and audit criteria. Supports ISO 9001 audit planning requirements with comprehensive indexing for filtering by date and process.'
    );
END
GO


-- =============================================
-- Checklist Templates Table
-- =============================================
-- Stores reusable checklist templates for audits
-- Templates can be assigned to different audit types and reused across multiple audits
-- Supports ISO 9001 audit checklist management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistTemplates')
BEGIN
    CREATE TABLE ChecklistTemplates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Template Identification
        templateCode NVARCHAR(50) UNIQUE NOT NULL, -- Unique template identifier (e.g., 'CHKT-ISO9001-001')
        templateName NVARCHAR(200) NOT NULL, -- Template name or title
        description NVARCHAR(2000), -- Detailed description of the template
        
        -- Template Classification
        category NVARCHAR(100) NOT NULL, -- Category (e.g., 'ISO 9001', 'Process Audit', 'Product Audit', 'System Audit')
        auditType NVARCHAR(100), -- Associated audit type (Internal, External, Process, Compliance, etc.)
        
        -- Template Status
        status NVARCHAR(50) NOT NULL DEFAULT 'draft', -- Status: draft, active, archived, obsolete
        version NVARCHAR(20) NOT NULL DEFAULT '1.0', -- Template version
        
        -- Template Configuration
        isStandard BIT DEFAULT 0, -- Whether this is a standard/mandatory template
        requiresCompletion BIT DEFAULT 1, -- Whether all questions must be answered
        allowCustomQuestions BIT DEFAULT 0, -- Whether auditors can add custom questions
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the template
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistTemplates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistTemplates_Status CHECK (status IN ('draft', 'active', 'archived', 'obsolete'))
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique template code for quick lookups
    CREATE UNIQUE INDEX IX_ChecklistTemplates_TemplateCode ON ChecklistTemplates(templateCode);
    
    -- Status filtering (most common query pattern)
    CREATE INDEX IX_ChecklistTemplates_Status ON ChecklistTemplates(status);
    
    -- Category and audit type filtering
    CREATE INDEX IX_ChecklistTemplates_Category ON ChecklistTemplates(category);
    CREATE INDEX IX_ChecklistTemplates_Category_Status ON ChecklistTemplates(category, status);
    CREATE INDEX IX_ChecklistTemplates_AuditType ON ChecklistTemplates(auditType) WHERE auditType IS NOT NULL;
    
    -- Creator tracking
    CREATE INDEX IX_ChecklistTemplates_CreatedBy ON ChecklistTemplates(createdBy);
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistTemplates_CreatedAt ON ChecklistTemplates(createdAt DESC);
    CREATE INDEX IX_ChecklistTemplates_UpdatedAt ON ChecklistTemplates(updatedAt DESC);

    PRINT 'ChecklistTemplates table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistTemplates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.28' AND scriptName = '28_create_checklist_templates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.28',
        'Create ChecklistTemplates table for reusable audit checklist templates',
        '28_create_checklist_templates_table.sql',
        'SUCCESS',
        'ChecklistTemplates table stores reusable checklist templates that can be assigned to different audit types and reused across multiple audits. Supports template versioning and categorization.'
    );
END
GO


-- =============================================
-- Checklist Questions Table
-- =============================================
-- Stores questions that belong to checklist templates
-- Each question includes expected outcomes and criteria for evaluation
-- Supports structured audit checklist management

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistQuestions')
BEGIN
    CREATE TABLE ChecklistQuestions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Question Association
        templateId INT NOT NULL, -- Reference to the checklist template
        
        -- Question Identification
        questionNumber NVARCHAR(20) NOT NULL, -- Question number within the template (e.g., '1.1', '2.3')
        questionText NVARCHAR(2000) NOT NULL, -- The actual question text
        
        -- Question Details
        category NVARCHAR(100), -- Question category or clause reference (e.g., 'ISO 9001:2015 - Clause 4.1')
        section NVARCHAR(100), -- Section or area being evaluated
        
        -- Expected Outcomes and Criteria
        expectedOutcome NVARCHAR(2000), -- Expected outcome or criteria for compliance
        guidance NVARCHAR(2000), -- Guidance notes for auditors on how to evaluate
        
        -- Question Configuration
        questionType NVARCHAR(50) NOT NULL DEFAULT 'yesno', -- Type: yesno, text, rating, checklist, na
        isMandatory BIT DEFAULT 1, -- Whether this question must be answered
        allowNA BIT DEFAULT 1, -- Whether "Not Applicable" is allowed as a response
        requiresEvidence BIT DEFAULT 0, -- Whether evidence/documentation is required
        
        -- Rating Configuration (for rating type questions)
        minRating INT, -- Minimum rating value
        maxRating INT, -- Maximum rating value
        passingScore INT, -- Minimum passing score for compliance
        
        -- Question Order
        displayOrder INT NOT NULL, -- Order in which question should appear
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the question
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistQuestions_Template FOREIGN KEY (templateId) REFERENCES ChecklistTemplates(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChecklistQuestions_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistQuestions_QuestionType CHECK (questionType IN ('yesno', 'text', 'rating', 'checklist', 'na')),
        CONSTRAINT CK_ChecklistQuestions_Rating CHECK (
            (questionType = 'rating' AND minRating IS NOT NULL AND maxRating IS NOT NULL AND minRating < maxRating)
            OR (questionType != 'rating')
        )
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Template association (most common query pattern)
    CREATE INDEX IX_ChecklistQuestions_TemplateId ON ChecklistQuestions(templateId);
    CREATE INDEX IX_ChecklistQuestions_Template_DisplayOrder ON ChecklistQuestions(templateId, displayOrder);
    
    -- Question number lookups
    CREATE INDEX IX_ChecklistQuestions_QuestionNumber ON ChecklistQuestions(templateId, questionNumber);
    
    -- Category and section filtering
    CREATE INDEX IX_ChecklistQuestions_Category ON ChecklistQuestions(category) WHERE category IS NOT NULL;
    CREATE INDEX IX_ChecklistQuestions_Section ON ChecklistQuestions(section) WHERE section IS NOT NULL;
    
    -- Question type filtering
    CREATE INDEX IX_ChecklistQuestions_QuestionType ON ChecklistQuestions(questionType);
    
    -- Mandatory questions filtering
    CREATE INDEX IX_ChecklistQuestions_IsMandatory ON ChecklistQuestions(templateId, isMandatory);
    
    -- Creator tracking
    CREATE INDEX IX_ChecklistQuestions_CreatedBy ON ChecklistQuestions(createdBy);
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistQuestions_CreatedAt ON ChecklistQuestions(createdAt DESC);

    PRINT 'ChecklistQuestions table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistQuestions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.29' AND scriptName = '29_create_checklist_questions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.29',
        'Create ChecklistQuestions table for checklist template questions',
        '29_create_checklist_questions_table.sql',
        'SUCCESS',
        'ChecklistQuestions table stores questions that belong to checklist templates with expected outcomes, evaluation criteria, and flexible question types. Supports structured audit checklist management with various question formats.'
    );
END
GO


-- =============================================
-- Checklist Responses Table
-- =============================================
-- Stores actual responses/answers to checklist questions during audits
-- Links audit execution to checklist templates and tracks compliance
-- Supports audit evidence collection and findings documentation

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistResponses')
BEGIN
    CREATE TABLE ChecklistResponses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Response Association
        auditId INT NOT NULL, -- Reference to the audit being conducted
        templateId INT NOT NULL, -- Reference to the checklist template being used
        questionId INT NOT NULL, -- Reference to the specific question being answered
        
        -- Response Data
        responseType NVARCHAR(50) NOT NULL, -- Type: yesno, text, rating, na
        yesNoResponse BIT, -- For yes/no questions (1=Yes, 0=No, NULL=Not Answered)
        textResponse NVARCHAR(MAX), -- For text-based responses or additional comments
        ratingResponse INT, -- For rating-based responses
        notApplicable BIT DEFAULT 0, -- Whether the question was marked as Not Applicable
        
        -- Compliance Assessment
        isCompliant BIT, -- Whether the response indicates compliance
        requiresAction BIT DEFAULT 0, -- Whether corrective action is required
        
        -- Supporting Information
        findings NVARCHAR(MAX), -- Detailed findings or observations related to this question
        evidence NVARCHAR(MAX), -- Evidence or documentation references (file paths, document IDs, etc.)
        recommendations NVARCHAR(2000), -- Auditor recommendations based on this response
        
        -- Response Metadata
        respondedBy INT NOT NULL, -- Auditor who recorded the response
        respondedAt DATETIME2 DEFAULT GETDATE() NOT NULL, -- When the response was recorded
        
        -- Review and Verification
        reviewedBy INT, -- Reviewer who verified the response
        reviewedAt DATETIME2, -- When the response was reviewed
        reviewNotes NVARCHAR(2000), -- Review notes or comments
        
        -- Metadata
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistResponses_Audit FOREIGN KEY (auditId) REFERENCES Audits(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChecklistResponses_Template FOREIGN KEY (templateId) REFERENCES ChecklistTemplates(id),
        CONSTRAINT FK_ChecklistResponses_Question FOREIGN KEY (questionId) REFERENCES ChecklistQuestions(id),
        CONSTRAINT FK_ChecklistResponses_RespondedBy FOREIGN KEY (respondedBy) REFERENCES Users(id),
        CONSTRAINT FK_ChecklistResponses_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistResponses_ResponseType CHECK (responseType IN ('yesno', 'text', 'rating', 'na')),
        CONSTRAINT CK_ChecklistResponses_Response CHECK (
            (responseType = 'yesno' AND yesNoResponse IS NOT NULL)
            OR (responseType = 'text' AND textResponse IS NOT NULL)
            OR (responseType = 'rating' AND ratingResponse IS NOT NULL)
            OR (responseType = 'na' AND notApplicable = 1)
            OR (responseType = 'yesno' AND notApplicable = 1)
        ),
        
        -- Unique constraint to prevent duplicate responses for the same question in an audit
        CONSTRAINT UQ_ChecklistResponses_AuditQuestion UNIQUE (auditId, questionId)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Audit association (most common query pattern)
    CREATE INDEX IX_ChecklistResponses_AuditId ON ChecklistResponses(auditId);
    CREATE INDEX IX_ChecklistResponses_Audit_Template ON ChecklistResponses(auditId, templateId);
    
    -- Template and question lookups
    CREATE INDEX IX_ChecklistResponses_TemplateId ON ChecklistResponses(templateId);
    CREATE INDEX IX_ChecklistResponses_QuestionId ON ChecklistResponses(questionId);
    
    -- Compliance filtering
    CREATE INDEX IX_ChecklistResponses_IsCompliant ON ChecklistResponses(isCompliant) WHERE isCompliant IS NOT NULL;
    CREATE INDEX IX_ChecklistResponses_RequiresAction ON ChecklistResponses(requiresAction) WHERE requiresAction = 1;
    CREATE INDEX IX_ChecklistResponses_Audit_Compliance ON ChecklistResponses(auditId, isCompliant) WHERE isCompliant IS NOT NULL;
    
    -- Response type filtering
    CREATE INDEX IX_ChecklistResponses_ResponseType ON ChecklistResponses(responseType);
    CREATE INDEX IX_ChecklistResponses_NotApplicable ON ChecklistResponses(auditId, notApplicable) WHERE notApplicable = 1;
    
    -- Personnel tracking
    CREATE INDEX IX_ChecklistResponses_RespondedBy ON ChecklistResponses(respondedBy);
    CREATE INDEX IX_ChecklistResponses_ReviewedBy ON ChecklistResponses(reviewedBy) WHERE reviewedBy IS NOT NULL;
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistResponses_RespondedAt ON ChecklistResponses(respondedAt DESC);
    CREATE INDEX IX_ChecklistResponses_ReviewedAt ON ChecklistResponses(reviewedAt DESC) WHERE reviewedAt IS NOT NULL;
    CREATE INDEX IX_ChecklistResponses_CreatedAt ON ChecklistResponses(createdAt DESC);

    PRINT 'ChecklistResponses table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistResponses table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.30' AND scriptName = '30_create_checklist_responses_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.30',
        'Create ChecklistResponses table for audit checklist responses',
        '30_create_checklist_responses_table.sql',
        'SUCCESS',
        'ChecklistResponses table stores actual responses to checklist questions during audits. Supports multiple response types, compliance tracking, findings documentation, and evidence collection. Links audit execution to checklist templates.'
    );
END
GO


-- =============================================
-- Audit Findings Table
-- =============================================
-- Stores audit findings with severity, category, and recommended actions
-- Links findings to audits and optionally to NCRs for tracking non-conformances
-- Supports ISO 9001 audit reporting and corrective action requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditFindings')
BEGIN
    CREATE TABLE AuditFindings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Finding Identification
        findingNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique finding identifier (e.g., 'FND-2024-001')
        auditId INT NOT NULL, -- Reference to the audit where finding was identified
        
        -- Finding Details
        title NVARCHAR(500) NOT NULL, -- Brief title/summary of the finding
        description NVARCHAR(MAX) NOT NULL, -- Detailed description of the finding
        category NVARCHAR(200) NOT NULL, -- Category (Process, Documentation, Product Quality, Safety, Compliance, Resource Management, etc.)
        severity NVARCHAR(50) NOT NULL, -- Severity level: observation, minor, major, critical
        
        -- Evidence and Analysis
        evidence NVARCHAR(MAX), -- Evidence supporting the finding (references, photos, documents)
        rootCause NVARCHAR(2000), -- Preliminary root cause analysis
        auditCriteria NVARCHAR(1000), -- Audit criteria/standard against which non-conformance was identified
        clauseReference NVARCHAR(200), -- Specific clause or section reference (e.g., 'ISO 9001:2015 8.5.1')
        
        -- Recommendations and Actions
        recommendations NVARCHAR(2000), -- Auditor's recommendations for addressing the finding
        requiresNCR BIT DEFAULT 0 NOT NULL, -- Whether finding requires a formal NCR
        ncrId INT, -- Reference to NCR if one was created for this finding
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Status: open, under_review, action_planned, resolved, closed
        identifiedDate DATETIME2 NOT NULL, -- When the finding was identified
        targetCloseDate DATETIME2, -- Target date for closing the finding
        closedDate DATETIME2, -- When the finding was actually closed
        
        -- Personnel
        identifiedBy INT NOT NULL, -- Auditor who identified the finding
        assignedTo INT, -- Person responsible for addressing the finding
        verifiedBy INT, -- Person who verified closure of the finding
        verifiedDate DATETIME2, -- When closure was verified
        
        -- Additional Context
        department NVARCHAR(100), -- Department or area where finding was identified
        processId INT, -- Related process if applicable
        affectedArea NVARCHAR(500), -- Specific area, equipment, or process affected
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the finding record
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditFindings_Audit FOREIGN KEY (auditId) REFERENCES Audits(id) ON DELETE CASCADE,
        CONSTRAINT FK_AuditFindings_NCR FOREIGN KEY (ncrId) REFERENCES NCRs(id),
        CONSTRAINT FK_AuditFindings_IdentifiedBy FOREIGN KEY (identifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_AssignedTo FOREIGN KEY (assignedTo) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_AuditFindings_Status CHECK (status IN ('open', 'under_review', 'action_planned', 'resolved', 'closed')),
        CONSTRAINT CK_AuditFindings_Severity CHECK (severity IN ('observation', 'minor', 'major', 'critical'))
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique finding number for quick lookups
    CREATE UNIQUE INDEX IX_AuditFindings_FindingNumber ON AuditFindings(findingNumber);
    
    -- Audit association (most common query pattern)
    CREATE INDEX IX_AuditFindings_AuditId ON AuditFindings(auditId);
    CREATE INDEX IX_AuditFindings_AuditId_Status ON AuditFindings(auditId, status);
    
    -- NCR linkage for tracking findings that resulted in NCRs
    CREATE INDEX IX_AuditFindings_NCRId ON AuditFindings(ncrId) WHERE ncrId IS NOT NULL;
    
    -- Status filtering (for dashboards and reports)
    CREATE INDEX IX_AuditFindings_Status ON AuditFindings(status);
    CREATE INDEX IX_AuditFindings_Severity ON AuditFindings(severity);
    CREATE INDEX IX_AuditFindings_Status_Severity ON AuditFindings(status, severity);
    
    -- Date-based queries for tracking and reporting
    CREATE INDEX IX_AuditFindings_IdentifiedDate ON AuditFindings(identifiedDate DESC);
    CREATE INDEX IX_AuditFindings_TargetCloseDate ON AuditFindings(targetCloseDate) WHERE targetCloseDate IS NOT NULL;
    CREATE INDEX IX_AuditFindings_ClosedDate ON AuditFindings(closedDate DESC) WHERE closedDate IS NOT NULL;
    
    -- Personnel tracking for assignment and workload management
    CREATE INDEX IX_AuditFindings_IdentifiedBy ON AuditFindings(identifiedBy);
    CREATE INDEX IX_AuditFindings_AssignedTo ON AuditFindings(assignedTo) WHERE assignedTo IS NOT NULL;
    CREATE INDEX IX_AuditFindings_AssignedTo_Status ON AuditFindings(assignedTo, status) WHERE assignedTo IS NOT NULL;
    
    -- Category and department filtering
    CREATE INDEX IX_AuditFindings_Category ON AuditFindings(category);
    CREATE INDEX IX_AuditFindings_Department ON AuditFindings(department) WHERE department IS NOT NULL;
    
    -- Process association
    CREATE INDEX IX_AuditFindings_ProcessId ON AuditFindings(processId) WHERE processId IS NOT NULL;
    
    -- Timestamp tracking for audit trail
    CREATE INDEX IX_AuditFindings_CreatedAt ON AuditFindings(createdAt DESC);
    CREATE INDEX IX_AuditFindings_UpdatedAt ON AuditFindings(updatedAt DESC);

    PRINT 'AuditFindings table created successfully with comprehensive indexing for audit findings management';
END
ELSE
BEGIN
    PRINT 'AuditFindings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.31' AND scriptName = '31_create_audit_findings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.31',
        'Create AuditFindings table for recording audit findings with NCR linkage',
        '31_create_audit_findings_table.sql',
        'SUCCESS',
        'AuditFindings table stores audit findings with severity, category, and recommended actions. Supports linking findings to NCRs and tracks resolution status. Includes comprehensive indexing for filtering and reporting.'
    );
END
GO


-- =============================================
-- Add Audit Approval Workflow Fields
-- =============================================
-- Adds reviewer/approver workflow capabilities to the Audits table
-- Supports submission, review, approval, and rejection workflow states

-- Step 1: Add new columns for review workflow
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Audits') AND name = 'reviewerId')
BEGIN
    ALTER TABLE Audits
    ADD reviewerId INT NULL,
        reviewedAt DATETIME2 NULL,
        reviewComments NVARCHAR(2000) NULL;
    
    PRINT 'Added review workflow columns to Audits table';
END
ELSE
BEGIN
    PRINT 'Review workflow columns already exist in Audits table';
END
GO

-- Step 2: Add foreign key constraint for reviewer
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Audits_Reviewer')
BEGIN
    ALTER TABLE Audits
    ADD CONSTRAINT FK_Audits_Reviewer FOREIGN KEY (reviewerId) REFERENCES Users(id);
    
    PRINT 'Added foreign key constraint for reviewer';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint for reviewer already exists';
END
GO

-- Step 3: Update status check constraint to include new statuses
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Audits_Status' AND parent_object_id = OBJECT_ID('Audits'))
BEGIN
    ALTER TABLE Audits DROP CONSTRAINT CK_Audits_Status;
    PRINT 'Dropped old status check constraint';
END
GO

ALTER TABLE Audits
ADD CONSTRAINT CK_Audits_Status CHECK (status IN ('planned', 'in_progress', 'completed', 'pending_review', 'approved', 'rejected', 'closed'));
PRINT 'Added new status check constraint with approval workflow statuses';
GO

-- Step 4: Create indexes for new columns
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_ReviewerId')
BEGIN
    CREATE INDEX IX_Audits_ReviewerId ON Audits(reviewerId) WHERE reviewerId IS NOT NULL;
    PRINT 'Created index on reviewerId';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_ReviewedAt')
BEGIN
    CREATE INDEX IX_Audits_ReviewedAt ON Audits(reviewedAt DESC) WHERE reviewedAt IS NOT NULL;
    PRINT 'Created index on reviewedAt';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Audits_Status_ReviewedAt')
BEGIN
    CREATE INDEX IX_Audits_Status_ReviewedAt ON Audits(status, reviewedAt DESC);
    PRINT 'Created composite index on status and reviewedAt';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.32' AND scriptName = '32_add_audit_approval_workflow.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.32',
        'Add audit approval workflow with reviewer fields and new statuses',
        '32_add_audit_approval_workflow.sql',
        'SUCCESS',
        'Added reviewerId, reviewedAt, reviewComments columns and new statuses: pending_review, approved, rejected. Updated status check constraint and added indexes for workflow queries.'
    );
    PRINT 'Recorded database version 1.0.32';
END
ELSE
BEGIN
    PRINT 'Database version 1.0.32 already recorded';
END
GO


-- =============================================
-- Auditor Access Tokens Table
-- =============================================
-- Stores time-limited, read-only access tokens for external auditors
-- Provides secure temporary access with comprehensive audit logging

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditorAccessTokens')
BEGIN
    CREATE TABLE AuditorAccessTokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Token Information
        token NVARCHAR(255) UNIQUE NOT NULL, -- Unique access token (hashed)
        tokenPreview NVARCHAR(50) NOT NULL, -- First/last characters for display
        
        -- Auditor Information
        auditorName NVARCHAR(255) NOT NULL, -- External auditor's name
        auditorEmail NVARCHAR(255) NOT NULL, -- External auditor's email
        auditorOrganization NVARCHAR(255), -- Auditing organization
        
        -- Token Configuration
        expiresAt DATETIME2 NOT NULL, -- Token expiration timestamp
        maxUses INT, -- Optional maximum number of uses (NULL = unlimited)
        currentUses INT DEFAULT 0, -- Current usage count
        
        -- Access Scope
        scopeType NVARCHAR(50) NOT NULL, -- Type of access (full_read_only, specific_audit, specific_document)
        scopeEntityId INT, -- Entity ID if scoped to specific audit/document
        allowedResources NVARCHAR(MAX), -- JSON array of allowed resource types
        
        -- Status
        active BIT DEFAULT 1, -- Whether token is active
        revokedAt DATETIME2, -- When token was revoked (if applicable)
        revokedBy INT, -- User who revoked the token
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Metadata
        purpose NVARCHAR(500), -- Purpose/reason for generating token
        notes NVARCHAR(MAX), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        createdBy INT NOT NULL, -- User who generated the token
        lastUsedAt DATETIME2, -- Last time token was used
        lastUsedIp NVARCHAR(45), -- Last IP address that used the token
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditorAccessTokens_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditorAccessTokens_RevokedBy FOREIGN KEY (revokedBy) REFERENCES Users(id) ON DELETE NO ACTION,
        
        -- Check Constraints
        CONSTRAINT CK_AuditorAccessTokens_Email CHECK (auditorEmail LIKE '%_@_%._%'),
        CONSTRAINT CK_AuditorAccessTokens_ScopeType CHECK (scopeType IN ('full_read_only', 'specific_audit', 'specific_document', 'specific_ncr', 'specific_capa')),
        CONSTRAINT CK_AuditorAccessTokens_MaxUses CHECK (maxUses IS NULL OR maxUses > 0)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Token lookup (most common operation)
    CREATE UNIQUE INDEX IX_AuditorAccessTokens_Token ON AuditorAccessTokens(token);
    
    -- Active tokens lookup
    CREATE INDEX IX_AuditorAccessTokens_Active_Expires ON AuditorAccessTokens(active, expiresAt) WHERE active = 1;
    
    -- Creator tracking
    CREATE INDEX IX_AuditorAccessTokens_CreatedBy ON AuditorAccessTokens(createdBy);
    CREATE INDEX IX_AuditorAccessTokens_CreatedAt ON AuditorAccessTokens(createdAt DESC);
    
    -- Auditor tracking
    CREATE INDEX IX_AuditorAccessTokens_AuditorEmail ON AuditorAccessTokens(auditorEmail);
    
    -- Expiration tracking (for cleanup)
    CREATE INDEX IX_AuditorAccessTokens_ExpiresAt ON AuditorAccessTokens(expiresAt);
    
    -- Scope tracking
    CREATE INDEX IX_AuditorAccessTokens_ScopeType ON AuditorAccessTokens(scopeType);
    CREATE INDEX IX_AuditorAccessTokens_ScopeEntityId ON AuditorAccessTokens(scopeEntityId) WHERE scopeEntityId IS NOT NULL;

    PRINT 'AuditorAccessTokens table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'AuditorAccessTokens table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.33' AND scriptName = '33_create_auditor_access_tokens_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.33',
        'Create AuditorAccessTokens table for temporary read-only access',
        '33_create_auditor_access_tokens_table.sql',
        'SUCCESS',
        'Supports time-limited, read-only access links for external auditors with comprehensive audit logging and scope control'
    );
END
GO

-- =============================================
-- Risks Table (Risk Register)
-- =============================================
-- Stores risk register items with assessment, mitigation, and review tracking
-- Supports ISO 9001 risk-based thinking and risk management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Risks')
BEGIN
    CREATE TABLE Risks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Risk Identification
        riskNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique risk identifier
        title NVARCHAR(500) NOT NULL, -- Risk title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed risk description
        
        -- Risk Classification
        category NVARCHAR(200) NOT NULL, -- Risk category (operational, financial, compliance, strategic, etc.)
        source NVARCHAR(200), -- Source of risk identification (audit, process review, incident, etc.)
        
        -- Risk Assessment
        likelihood INT NOT NULL, -- Likelihood score (typically 1-5 scale)
        impact INT NOT NULL, -- Impact score (typically 1-5 scale)
        riskScore AS (likelihood * impact) PERSISTED, -- Calculated risk score (likelihood × impact)
        
        -- Risk Level Classification
        riskLevel NVARCHAR(50), -- Risk level (low, medium, high, critical) based on score
        
        -- Risk Response
        mitigationStrategy NVARCHAR(2000), -- Planned mitigation strategy
        mitigationActions NVARCHAR(2000), -- Specific mitigation actions to be taken
        contingencyPlan NVARCHAR(2000), -- Contingency plan if risk occurs
        
        -- Ownership and Accountability
        riskOwner INT NOT NULL, -- User responsible for managing this risk
        department NVARCHAR(100), -- Department or area associated with the risk
        process NVARCHAR(200), -- Related business process
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'identified', -- Current status of risk
        identifiedDate DATETIME2 NOT NULL, -- Date risk was identified
        reviewDate DATETIME2, -- Last review date
        nextReviewDate DATETIME2, -- Next scheduled review date
        reviewFrequency INT, -- Review frequency in days
        closedDate DATETIME2, -- Date risk was closed (if mitigated or no longer relevant)
        
        -- Residual Risk Assessment (after mitigation)
        residualLikelihood INT, -- Likelihood after mitigation
        residualImpact INT, -- Impact after mitigation
        residualRiskScore AS (residualLikelihood * residualImpact) PERSISTED, -- Calculated residual risk score
        
        -- Additional Context
        affectedStakeholders NVARCHAR(1000), -- Stakeholders affected by this risk
        regulatoryImplications NVARCHAR(1000), -- Any regulatory or compliance implications
        relatedRisks NVARCHAR(500), -- References to related risk IDs
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the risk entry
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        lastReviewedBy INT, -- User who last reviewed the risk
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Risks_RiskOwner FOREIGN KEY (riskOwner) REFERENCES Users(id),
        CONSTRAINT FK_Risks_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Risks_LastReviewedBy FOREIGN KEY (lastReviewedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Risks_Status CHECK (status IN (
            'identified',
            'assessed',
            'mitigating',
            'monitoring',
            'closed',
            'accepted'
        )),
        CONSTRAINT CK_Risks_Likelihood CHECK (likelihood BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_Impact CHECK (impact BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_ResidualLikelihood CHECK (residualLikelihood IS NULL OR residualLikelihood BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_ResidualImpact CHECK (residualImpact IS NULL OR residualImpact BETWEEN 1 AND 5),
        CONSTRAINT CK_Risks_RiskLevel CHECK (riskLevel IN (
            'low',
            'medium',
            'high',
            'critical'
        ) OR riskLevel IS NULL),
        CONSTRAINT CK_Risks_ReviewFrequency CHECK (reviewFrequency IS NULL OR reviewFrequency > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Risks_RiskNumber ON Risks(riskNumber);
    
    -- Status and level tracking
    CREATE INDEX IX_Risks_Status ON Risks(status);
    CREATE INDEX IX_Risks_RiskLevel ON Risks(riskLevel);
    CREATE INDEX IX_Risks_Status_RiskLevel ON Risks(status, riskLevel);
    
    -- Risk scoring and prioritization
    CREATE INDEX IX_Risks_RiskScore ON Risks(riskScore DESC);
    CREATE INDEX IX_Risks_ResidualRiskScore ON Risks(residualRiskScore DESC);
    CREATE INDEX IX_Risks_Likelihood_Impact ON Risks(likelihood DESC, impact DESC);
    
    -- Date-based queries
    CREATE INDEX IX_Risks_IdentifiedDate ON Risks(identifiedDate DESC);
    CREATE INDEX IX_Risks_ReviewDate ON Risks(reviewDate);
    CREATE INDEX IX_Risks_NextReviewDate ON Risks(nextReviewDate);
    CREATE INDEX IX_Risks_ClosedDate ON Risks(closedDate);
    CREATE INDEX IX_Risks_CreatedAt ON Risks(createdAt DESC);
    
    -- Personnel tracking
    CREATE INDEX IX_Risks_RiskOwner ON Risks(riskOwner);
    CREATE INDEX IX_Risks_CreatedBy ON Risks(createdBy);
    CREATE INDEX IX_Risks_LastReviewedBy ON Risks(lastReviewedBy);
    
    -- Classification tracking
    CREATE INDEX IX_Risks_Category ON Risks(category);
    CREATE INDEX IX_Risks_Department ON Risks(department);
    CREATE INDEX IX_Risks_Process ON Risks(process);
    CREATE INDEX IX_Risks_Source ON Risks(source);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Risks_Status_RiskScore ON Risks(status, riskScore DESC);
    CREATE INDEX IX_Risks_RiskOwner_Status ON Risks(riskOwner, status);
    CREATE INDEX IX_Risks_Category_Status ON Risks(category, status);
    CREATE INDEX IX_Risks_Department_Status ON Risks(department, status);
    CREATE INDEX IX_Risks_Status_NextReviewDate ON Risks(status, nextReviewDate ASC);
    CREATE INDEX IX_Risks_RiskLevel_Status ON Risks(riskLevel, status);
    
    -- Search optimization
    CREATE INDEX IX_Risks_Title ON Risks(title);

    PRINT 'Risks table created successfully';
END
ELSE
BEGIN
    PRINT 'Risks table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.34' AND scriptName = '34_create_risks_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.34',
        'Create Risks table for risk register and risk management',
        '34_create_risks_table.sql',
        'SUCCESS',
        'Risks table supports ISO 9001 risk-based thinking with assessment, mitigation, and review tracking. Includes likelihood and impact scoring with calculated risk scores.'
    );
END
GO


-- =============================================
-- Suppliers Table
-- =============================================
-- Stores supplier details including contact info, categories, approval status, and related audit/evaluation data
-- Supports ISO 9001 supplier quality management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suppliers')
BEGIN
    CREATE TABLE Suppliers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Supplier Identification
        supplierNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique supplier identifier
        name NVARCHAR(500) NOT NULL, -- Supplier company name
        description NVARCHAR(2000), -- Detailed supplier description
        
        -- Contact Information
        contactPerson NVARCHAR(200), -- Primary contact person name
        email NVARCHAR(255), -- Supplier email address
        phone NVARCHAR(50), -- Primary phone number
        alternatePhone NVARCHAR(50), -- Secondary phone number
        fax NVARCHAR(50), -- Fax number
        website NVARCHAR(500), -- Supplier website URL
        
        -- Address Information
        addressLine1 NVARCHAR(500), -- Street address line 1
        addressLine2 NVARCHAR(500), -- Street address line 2
        city NVARCHAR(200), -- City
        stateProvince NVARCHAR(200), -- State or province
        postalCode NVARCHAR(50), -- Postal or ZIP code
        country NVARCHAR(100), -- Country
        
        -- Supplier Classification
        category NVARCHAR(200) NOT NULL, -- Supplier category (Raw Materials, Components, Services, Equipment, etc.)
        supplierType NVARCHAR(100), -- Supplier type (Manufacturer, Distributor, Service Provider, Contractor)
        industry NVARCHAR(200), -- Industry sector
        productsServices NVARCHAR(2000), -- Description of products/services provided
        
        -- Approval and Status Management
        approvalStatus NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Current approval status
        approvedDate DATETIME2, -- Date supplier was approved
        approvedBy INT NULL, -- User who approved the supplier
        suspendedDate DATETIME2, -- Date supplier was suspended (if applicable)
        suspendedReason NVARCHAR(1000), -- Reason for suspension
        active BIT DEFAULT 1, -- Active flag (soft delete support)
        
        -- Quality Management
        rating INT, -- Quality rating (1-5 scale)
        performanceScore DECIMAL(5,2), -- Performance score (0-100)
        qualityGrade NVARCHAR(50), -- Quality grade (A, B, C, D, F)
        certifications NVARCHAR(1000), -- List of certifications held by supplier (ISO 9001, ISO 14001, etc.)
        complianceStatus NVARCHAR(50), -- Compliance status (Compliant, Non-Compliant, Under Review)
        
        -- Evaluation and Audit Tracking
        lastEvaluationDate DATETIME2, -- Date of last supplier evaluation
        nextEvaluationDate DATETIME2, -- Next scheduled evaluation date
        evaluationFrequency INT, -- Evaluation frequency in days
        lastAuditDate DATETIME2, -- Date of last supplier audit
        nextAuditDate DATETIME2, -- Next scheduled audit date
        auditFrequency INT, -- Audit frequency in days
        
        -- Risk Assessment
        riskLevel NVARCHAR(50), -- Risk level (Low, Medium, High, Critical)
        criticalSupplier BIT DEFAULT 0, -- Flag for critical suppliers
        backupSupplierAvailable BIT DEFAULT 0, -- Indicates if backup supplier exists
        backupSupplierId INT NULL, -- Reference to backup supplier
        
        -- Business Information
        businessRegistrationNumber NVARCHAR(200), -- Business registration or tax ID
        dunsNumber NVARCHAR(50), -- Dun & Bradstreet number
        establishedYear INT, -- Year supplier was established
        employeeCount INT, -- Number of employees
        annualRevenue DECIMAL(18,2), -- Annual revenue
        currency NVARCHAR(10), -- Currency code (USD, EUR, etc.)
        
        -- Payment and Terms
        paymentTerms NVARCHAR(200), -- Payment terms (Net 30, Net 60, etc.)
        creditLimit DECIMAL(18,2), -- Credit limit
        bankName NVARCHAR(200), -- Bank name
        bankAccountNumber NVARCHAR(100), -- Bank account number (encrypted in application)
        
        -- Relationship Management
        supplierManager INT NULL, -- User responsible for managing this supplier relationship
        department NVARCHAR(100), -- Department associated with supplier
        relationshipStartDate DATETIME2, -- Date relationship started
        contractExpiryDate DATETIME2, -- Contract expiry date
        preferredSupplier BIT DEFAULT 0, -- Flag for preferred suppliers
        
        -- Performance Metrics
        onTimeDeliveryRate DECIMAL(5,2), -- On-time delivery rate (0-100%)
        qualityRejectRate DECIMAL(5,2), -- Quality reject rate (0-100%)
        responsiveness NVARCHAR(50), -- Responsiveness rating (Excellent, Good, Fair, Poor)
        totalPurchaseValue DECIMAL(18,2), -- Total value of purchases to date
        
        -- ISO 9001 Compliance Fields
        iso9001Certified BIT DEFAULT 0, -- ISO 9001 certification flag
        iso9001CertificateNumber NVARCHAR(200), -- ISO 9001 certificate number
        iso9001ExpiryDate DATETIME2, -- ISO 9001 certificate expiry date
        
        -- Additional Metadata
        notes NVARCHAR(MAX), -- Additional notes or comments
        internalReference NVARCHAR(200), -- Internal reference code
        tags NVARCHAR(500), -- Searchable tags
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the supplier record
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deactivatedAt DATETIME2, -- Date when supplier was deactivated
        deactivatedBy INT NULL, -- User who deactivated the supplier
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Suppliers_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_SupplierManager FOREIGN KEY (supplierManager) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_DeactivatedBy FOREIGN KEY (deactivatedBy) REFERENCES Users(id),
        CONSTRAINT FK_Suppliers_BackupSupplier FOREIGN KEY (backupSupplierId) REFERENCES Suppliers(id),
        
        -- Constraints
        CONSTRAINT CK_Suppliers_ApprovalStatus CHECK (approvalStatus IN (
            'pending',
            'under_review',
            'approved',
            'conditional_approval',
            'rejected',
            'suspended',
            'deactivated'
        )),
        CONSTRAINT CK_Suppliers_Rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
        CONSTRAINT CK_Suppliers_PerformanceScore CHECK (performanceScore IS NULL OR performanceScore BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_QualityGrade CHECK (qualityGrade IS NULL OR qualityGrade IN ('A', 'B', 'C', 'D', 'F')),
        CONSTRAINT CK_Suppliers_ComplianceStatus CHECK (complianceStatus IS NULL OR complianceStatus IN (
            'Compliant',
            'Non-Compliant',
            'Under Review',
            'Not Assessed'
        )),
        CONSTRAINT CK_Suppliers_RiskLevel CHECK (riskLevel IS NULL OR riskLevel IN (
            'Low',
            'Medium',
            'High',
            'Critical'
        )),
        CONSTRAINT CK_Suppliers_EvaluationFrequency CHECK (evaluationFrequency IS NULL OR evaluationFrequency > 0),
        CONSTRAINT CK_Suppliers_AuditFrequency CHECK (auditFrequency IS NULL OR auditFrequency > 0),
        CONSTRAINT CK_Suppliers_OnTimeDeliveryRate CHECK (onTimeDeliveryRate IS NULL OR onTimeDeliveryRate BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_QualityRejectRate CHECK (qualityRejectRate IS NULL OR qualityRejectRate BETWEEN 0 AND 100),
        CONSTRAINT CK_Suppliers_Responsiveness CHECK (responsiveness IS NULL OR responsiveness IN (
            'Excellent',
            'Good',
            'Fair',
            'Poor',
            'Not Rated'
        )),
        CONSTRAINT CK_Suppliers_Email CHECK (email IS NULL OR email LIKE '%_@_%._%')
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Suppliers_SupplierNumber ON Suppliers(supplierNumber);
    CREATE INDEX IX_Suppliers_Name ON Suppliers(name);
    
    -- Status and classification tracking
    CREATE INDEX IX_Suppliers_ApprovalStatus ON Suppliers(approvalStatus);
    CREATE INDEX IX_Suppliers_Active ON Suppliers(active);
    CREATE INDEX IX_Suppliers_Category ON Suppliers(category);
    CREATE INDEX IX_Suppliers_SupplierType ON Suppliers(supplierType);
    CREATE INDEX IX_Suppliers_Industry ON Suppliers(industry);
    
    -- Quality and performance tracking
    CREATE INDEX IX_Suppliers_Rating ON Suppliers(rating DESC);
    CREATE INDEX IX_Suppliers_PerformanceScore ON Suppliers(performanceScore DESC);
    CREATE INDEX IX_Suppliers_QualityGrade ON Suppliers(qualityGrade);
    CREATE INDEX IX_Suppliers_ComplianceStatus ON Suppliers(complianceStatus);
    CREATE INDEX IX_Suppliers_RiskLevel ON Suppliers(riskLevel);
    
    -- Date-based queries for evaluation and audit scheduling
    CREATE INDEX IX_Suppliers_LastEvaluationDate ON Suppliers(lastEvaluationDate);
    CREATE INDEX IX_Suppliers_NextEvaluationDate ON Suppliers(nextEvaluationDate);
    CREATE INDEX IX_Suppliers_LastAuditDate ON Suppliers(lastAuditDate);
    CREATE INDEX IX_Suppliers_NextAuditDate ON Suppliers(nextAuditDate);
    CREATE INDEX IX_Suppliers_ApprovedDate ON Suppliers(approvedDate);
    CREATE INDEX IX_Suppliers_ContractExpiryDate ON Suppliers(contractExpiryDate);
    CREATE INDEX IX_Suppliers_ISO9001ExpiryDate ON Suppliers(iso9001ExpiryDate);
    
    -- Personnel and department tracking
    CREATE INDEX IX_Suppliers_ApprovedBy ON Suppliers(approvedBy);
    CREATE INDEX IX_Suppliers_SupplierManager ON Suppliers(supplierManager);
    CREATE INDEX IX_Suppliers_CreatedBy ON Suppliers(createdBy);
    CREATE INDEX IX_Suppliers_Department ON Suppliers(department);
    
    -- Special flags
    CREATE INDEX IX_Suppliers_CriticalSupplier ON Suppliers(criticalSupplier);
    CREATE INDEX IX_Suppliers_PreferredSupplier ON Suppliers(preferredSupplier);
    CREATE INDEX IX_Suppliers_ISO9001Certified ON Suppliers(iso9001Certified);
    
    -- Location tracking
    CREATE INDEX IX_Suppliers_City ON Suppliers(city);
    CREATE INDEX IX_Suppliers_Country ON Suppliers(country);
    
    -- Audit trail
    CREATE INDEX IX_Suppliers_CreatedAt ON Suppliers(createdAt DESC);
    CREATE INDEX IX_Suppliers_UpdatedAt ON Suppliers(updatedAt DESC);
    CREATE INDEX IX_Suppliers_DeactivatedAt ON Suppliers(deactivatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Suppliers_Active_ApprovalStatus ON Suppliers(active, approvalStatus);
    CREATE INDEX IX_Suppliers_Active_Category ON Suppliers(active, category);
    CREATE INDEX IX_Suppliers_ApprovalStatus_Rating ON Suppliers(approvalStatus, rating DESC);
    CREATE INDEX IX_Suppliers_Category_Rating ON Suppliers(category, rating DESC);
    CREATE INDEX IX_Suppliers_RiskLevel_CriticalSupplier ON Suppliers(riskLevel, criticalSupplier);
    CREATE INDEX IX_Suppliers_SupplierManager_Active ON Suppliers(supplierManager, active);
    CREATE INDEX IX_Suppliers_Department_Active ON Suppliers(department, active);
    CREATE INDEX IX_Suppliers_Active_NextEvaluationDate ON Suppliers(active, nextEvaluationDate ASC);
    CREATE INDEX IX_Suppliers_Active_NextAuditDate ON Suppliers(active, nextAuditDate ASC);
    CREATE INDEX IX_Suppliers_PreferredSupplier_Active ON Suppliers(preferredSupplier, active);
    
    -- Search optimization
    CREATE INDEX IX_Suppliers_ContactPerson ON Suppliers(contactPerson);
    CREATE INDEX IX_Suppliers_Email ON Suppliers(email);
    CREATE INDEX IX_Suppliers_Tags ON Suppliers(tags);

    PRINT 'Suppliers table created successfully';
END
ELSE
BEGIN
    PRINT 'Suppliers table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.35' AND scriptName = '35_create_suppliers_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.35',
        'Create Suppliers table for supplier quality management',
        '35_create_suppliers_table.sql',
        'SUCCESS',
        'Suppliers table supports ISO 9001 supplier management with contact info, approval status, quality metrics, evaluation tracking, and audit scheduling. Includes risk assessment, performance metrics, and ISO 9001 certification tracking.'
    );
END
GO


-- =============================================
-- Supplier Evaluations Table
-- =============================================
-- Stores supplier evaluation records with scoring criteria
-- Supports ISO 9001 supplier quality management evaluation requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SupplierEvaluations')
BEGIN
    CREATE TABLE SupplierEvaluations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Supplier Reference
        supplierId INT NOT NULL, -- Reference to the supplier being evaluated
        
        -- Evaluation Identification
        evaluationNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique evaluation identifier
        evaluationDate DATETIME2 NOT NULL, -- Date the evaluation was conducted
        evaluationType NVARCHAR(100) NOT NULL, -- Type of evaluation (Annual, Quarterly, Ad-Hoc, Re-evaluation, etc.)
        
        -- Evaluation Period
        evaluationPeriodStart DATETIME2, -- Start date of the evaluation period
        evaluationPeriodEnd DATETIME2, -- End date of the evaluation period
        
        -- Scoring Criteria
        qualityRating INT NOT NULL, -- Quality rating (1-5 scale: 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent)
        onTimeDeliveryRate DECIMAL(5,2) NOT NULL, -- On-time delivery rate as percentage (0-100)
        complianceStatus NVARCHAR(50) NOT NULL, -- Compliance status (Compliant, Non-Compliant, Under Review, Not Assessed)
        
        -- Additional Scoring Metrics
        qualityScore DECIMAL(5,2), -- Quality score (0-100), calculated or manually entered
        deliveryScore DECIMAL(5,2), -- Delivery performance score (0-100)
        communicationScore DECIMAL(5,2), -- Communication/responsiveness score (0-100)
        technicalCapabilityScore DECIMAL(5,2), -- Technical capability score (0-100)
        priceCompetitivenessScore DECIMAL(5,2), -- Price competitiveness score (0-100)
        
        -- Overall Evaluation Results
        overallScore DECIMAL(5,2), -- Overall weighted score (0-100)
        overallRating NVARCHAR(50), -- Overall rating (Excellent, Good, Satisfactory, Needs Improvement, Unacceptable)
        approved BIT DEFAULT 0, -- Whether the supplier is approved based on this evaluation
        
        -- Performance Metrics
        defectRate DECIMAL(5,2), -- Defect rate as percentage (0-100)
        returnRate DECIMAL(5,2), -- Return rate as percentage (0-100)
        leadTimeAdherence DECIMAL(5,2), -- Lead time adherence as percentage (0-100)
        documentationAccuracy DECIMAL(5,2), -- Documentation accuracy as percentage (0-100)
        
        -- Evaluation Details
        evaluationMethod NVARCHAR(200), -- Method used for evaluation (Audit, Survey, Performance Data, Document Review)
        evaluationScope NVARCHAR(1000), -- Scope of the evaluation
        evaluationCriteria NVARCHAR(MAX), -- Detailed criteria used for evaluation (can be JSON)
        
        -- Findings and Observations
        strengths NVARCHAR(MAX), -- Key strengths identified
        weaknesses NVARCHAR(MAX), -- Key weaknesses identified
        opportunities NVARCHAR(MAX), -- Opportunities for improvement
        risks NVARCHAR(MAX), -- Identified risks
        
        -- Actions and Recommendations
        correctiveActionsRequired BIT DEFAULT 0, -- Whether corrective actions are required
        correctiveActions NVARCHAR(MAX), -- Required corrective actions
        recommendations NVARCHAR(MAX), -- Recommendations for the supplier
        improvementPlan NVARCHAR(MAX), -- Agreed improvement plan
        
        -- Follow-up
        followUpRequired BIT DEFAULT 0, -- Whether follow-up is required
        followUpDate DATETIME2, -- Scheduled follow-up date
        nextEvaluationDate DATETIME2, -- Next scheduled evaluation date
        
        -- Decision and Status
        evaluationStatus NVARCHAR(50) NOT NULL DEFAULT 'draft', -- Status (draft, completed, approved, rejected)
        decision NVARCHAR(50), -- Final decision (Continue, Conditional Continue, Suspend, Terminate, Probation)
        decisionRationale NVARCHAR(MAX), -- Rationale for the decision
        
        -- Approval Workflow
        evaluatedBy INT NOT NULL, -- User who conducted the evaluation
        reviewedBy INT NULL, -- User who reviewed the evaluation
        reviewedDate DATETIME2, -- Date of review
        approvedBy INT NULL, -- User who approved the evaluation
        approvedDate DATETIME2, -- Date of approval
        
        -- Additional Information
        notes NVARCHAR(MAX), -- Additional notes or comments
        attachments NVARCHAR(MAX), -- References to attached documents (can be JSON array of attachment IDs)
        internalReference NVARCHAR(200), -- Internal reference code
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the evaluation record
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SupplierEvaluations_Supplier FOREIGN KEY (supplierId) REFERENCES Suppliers(id),
        CONSTRAINT FK_SupplierEvaluations_EvaluatedBy FOREIGN KEY (evaluatedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_SupplierEvaluations_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SupplierEvaluations_QualityRating CHECK (qualityRating BETWEEN 1 AND 5),
        CONSTRAINT CK_SupplierEvaluations_OnTimeDeliveryRate CHECK (onTimeDeliveryRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_ComplianceStatus CHECK (complianceStatus IN (
            'Compliant',
            'Non-Compliant',
            'Under Review',
            'Not Assessed'
        )),
        CONSTRAINT CK_SupplierEvaluations_QualityScore CHECK (qualityScore IS NULL OR qualityScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_DeliveryScore CHECK (deliveryScore IS NULL OR deliveryScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_CommunicationScore CHECK (communicationScore IS NULL OR communicationScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_TechnicalCapabilityScore CHECK (technicalCapabilityScore IS NULL OR technicalCapabilityScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_PriceCompetitivenessScore CHECK (priceCompetitivenessScore IS NULL OR priceCompetitivenessScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_OverallScore CHECK (overallScore IS NULL OR overallScore BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_OverallRating CHECK (overallRating IS NULL OR overallRating IN (
            'Excellent',
            'Good',
            'Satisfactory',
            'Needs Improvement',
            'Unacceptable'
        )),
        CONSTRAINT CK_SupplierEvaluations_DefectRate CHECK (defectRate IS NULL OR defectRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_ReturnRate CHECK (returnRate IS NULL OR returnRate BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_LeadTimeAdherence CHECK (leadTimeAdherence IS NULL OR leadTimeAdherence BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_DocumentationAccuracy CHECK (documentationAccuracy IS NULL OR documentationAccuracy BETWEEN 0 AND 100),
        CONSTRAINT CK_SupplierEvaluations_EvaluationStatus CHECK (evaluationStatus IN (
            'draft',
            'completed',
            'under_review',
            'approved',
            'rejected'
        )),
        CONSTRAINT CK_SupplierEvaluations_Decision CHECK (decision IS NULL OR decision IN (
            'Continue',
            'Conditional Continue',
            'Suspend',
            'Terminate',
            'Probation'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE UNIQUE INDEX IX_SupplierEvaluations_EvaluationNumber ON SupplierEvaluations(evaluationNumber);
    CREATE INDEX IX_SupplierEvaluations_SupplierId ON SupplierEvaluations(supplierId);
    
    -- Status and date tracking
    CREATE INDEX IX_SupplierEvaluations_EvaluationStatus ON SupplierEvaluations(evaluationStatus);
    CREATE INDEX IX_SupplierEvaluations_EvaluationDate ON SupplierEvaluations(evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_NextEvaluationDate ON SupplierEvaluations(nextEvaluationDate);
    CREATE INDEX IX_SupplierEvaluations_FollowUpDate ON SupplierEvaluations(followUpDate);
    
    -- Scoring and rating
    CREATE INDEX IX_SupplierEvaluations_QualityRating ON SupplierEvaluations(qualityRating DESC);
    CREATE INDEX IX_SupplierEvaluations_OverallScore ON SupplierEvaluations(overallScore DESC);
    CREATE INDEX IX_SupplierEvaluations_OverallRating ON SupplierEvaluations(overallRating);
    CREATE INDEX IX_SupplierEvaluations_ComplianceStatus ON SupplierEvaluations(complianceStatus);
    
    -- Personnel tracking
    CREATE INDEX IX_SupplierEvaluations_EvaluatedBy ON SupplierEvaluations(evaluatedBy);
    CREATE INDEX IX_SupplierEvaluations_ReviewedBy ON SupplierEvaluations(reviewedBy);
    CREATE INDEX IX_SupplierEvaluations_ApprovedBy ON SupplierEvaluations(approvedBy);
    CREATE INDEX IX_SupplierEvaluations_CreatedBy ON SupplierEvaluations(createdBy);
    
    -- Audit trail
    CREATE INDEX IX_SupplierEvaluations_CreatedAt ON SupplierEvaluations(createdAt DESC);
    CREATE INDEX IX_SupplierEvaluations_UpdatedAt ON SupplierEvaluations(updatedAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SupplierEvaluations_Supplier_EvaluationDate ON SupplierEvaluations(supplierId, evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_Supplier_Status ON SupplierEvaluations(supplierId, evaluationStatus);
    CREATE INDEX IX_SupplierEvaluations_Status_EvaluationDate ON SupplierEvaluations(evaluationStatus, evaluationDate DESC);
    CREATE INDEX IX_SupplierEvaluations_Approved_Score ON SupplierEvaluations(approved, overallScore DESC);

    PRINT 'SupplierEvaluations table created successfully';
END
ELSE
BEGIN
    PRINT 'SupplierEvaluations table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.36' AND scriptName = '36_create_supplier_evaluations_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.36',
        'Create SupplierEvaluations table for supplier evaluation and scoring',
        '36_create_supplier_evaluations_table.sql',
        'SUCCESS',
        'SupplierEvaluations table supports ISO 9001 supplier evaluation with scoring criteria (quality rating, on-time delivery, compliance status), performance metrics, findings, and approval workflow.'
    );
END
GO


-- =============================================
-- Inspection Plans Table
-- =============================================
-- Stores inspection plans for equipment with scheduling details
-- Supports both recurring and one-time inspection plans
-- Tracks frequency, responsible inspectors, and due dates
-- Supports ISO 9001 inspection planning and monitoring requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionPlans')
BEGIN
    CREATE TABLE InspectionPlans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Plan Identification
        planNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique plan identifier
        planName NVARCHAR(500) NOT NULL, -- Descriptive name for the inspection plan
        description NVARCHAR(2000), -- Detailed description of what will be inspected
        
        -- Asset/Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Inspection Classification
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection (routine, safety, pre-use, quality, etc.)
        priority NVARCHAR(50) NOT NULL DEFAULT 'normal', -- Priority level (low, normal, high, critical)
        
        -- Scheduling Configuration
        planType NVARCHAR(50) NOT NULL DEFAULT 'recurring', -- 'recurring' or 'one_time'
        frequency NVARCHAR(50), -- Frequency for recurring plans (daily, weekly, monthly, quarterly, semi-annual, annual)
        frequencyInterval INT, -- Interval in days for recurring plans (e.g., 30 for monthly, 90 for quarterly)
        startDate DATETIME2 NOT NULL, -- When the plan starts/becomes active
        endDate DATETIME2, -- When the plan ends (NULL for ongoing plans)
        
        -- Due Date Management
        nextDueDate DATETIME2 NOT NULL, -- Next inspection due date
        lastInspectionDate DATETIME2, -- Last time an inspection was performed under this plan
        reminderDays INT DEFAULT 7, -- Days before due date to send reminder
        
        -- Personnel Assignment
        responsibleInspectorId INT NOT NULL, -- Primary inspector responsible for this plan
        backupInspectorId INT, -- Backup inspector if primary is unavailable
        
        -- Inspection Checklist and Standards
        checklistReference NVARCHAR(500), -- Reference to inspection checklist or procedure document
        inspectionStandard NVARCHAR(200), -- Standard or specification being followed
        requiredCompetencies NVARCHAR(500), -- Required competencies/qualifications for inspectors
        
        -- Estimated Resources
        estimatedDuration INT, -- Estimated time in minutes for inspection
        requiredTools NVARCHAR(500), -- Tools or equipment needed for inspection
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'on_hold', 'completed', 'cancelled'
        
        -- Compliance and Regulatory
        regulatoryRequirement BIT DEFAULT 0, -- Flag if inspection is regulatory requirement
        complianceReference NVARCHAR(200), -- Reference to regulation or standard (e.g., ISO 9001:2015 clause)
        
        -- Notifications and Escalation
        autoSchedule BIT DEFAULT 1, -- Automatically create inspection records when due
        notifyOnOverdue BIT DEFAULT 1, -- Send notification if inspection becomes overdue
        escalationDays INT DEFAULT 3, -- Days overdue before escalating to management
        
        -- Additional Information
        criticality NVARCHAR(50), -- How critical this inspection is (low, medium, high, critical)
        safetyRelated BIT DEFAULT 0, -- Flag if inspection is safety-related
        qualityImpact NVARCHAR(50), -- Impact on quality (none, low, medium, high)
        notes NVARCHAR(2000), -- Additional notes or instructions
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created the plan
        updatedBy INT, -- User who last updated the plan
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionPlans_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_InspectionPlans_ResponsibleInspector FOREIGN KEY (responsibleInspectorId) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_BackupInspector FOREIGN KEY (backupInspectorId) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionPlans_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionPlans_PlanType CHECK (planType IN ('recurring', 'one_time')),
        CONSTRAINT CK_InspectionPlans_Frequency CHECK (frequency IS NULL OR frequency IN (
            'daily', 
            'weekly', 
            'bi-weekly', 
            'monthly', 
            'bi-monthly',
            'quarterly', 
            'semi-annual', 
            'annual',
            'bi-annual'
        )),
        CONSTRAINT CK_InspectionPlans_Priority CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        CONSTRAINT CK_InspectionPlans_Status CHECK (status IN (
            'active',
            'inactive',
            'on_hold',
            'completed',
            'cancelled'
        )),
        CONSTRAINT CK_InspectionPlans_Criticality CHECK (criticality IS NULL OR criticality IN (
            'low',
            'medium',
            'high',
            'critical'
        )),
        CONSTRAINT CK_InspectionPlans_QualityImpact CHECK (qualityImpact IS NULL OR qualityImpact IN (
            'none',
            'low',
            'medium',
            'high'
        )),
        CONSTRAINT CK_InspectionPlans_FrequencyInterval CHECK (frequencyInterval IS NULL OR frequencyInterval > 0),
        CONSTRAINT CK_InspectionPlans_EstimatedDuration CHECK (estimatedDuration IS NULL OR estimatedDuration > 0),
        CONSTRAINT CK_InspectionPlans_ReminderDays CHECK (reminderDays IS NULL OR reminderDays >= 0),
        CONSTRAINT CK_InspectionPlans_EscalationDays CHECK (escalationDays IS NULL OR escalationDays >= 0),
        CONSTRAINT CK_InspectionPlans_DateRange CHECK (endDate IS NULL OR endDate >= startDate),
        CONSTRAINT CK_InspectionPlans_RecurringRequirements CHECK (
            (planType = 'one_time') OR 
            (planType = 'recurring' AND frequency IS NOT NULL AND frequencyInterval IS NOT NULL)
        )
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_InspectionPlans_PlanNumber ON InspectionPlans(planNumber);
    
    -- Equipment lookups
    CREATE INDEX IX_InspectionPlans_EquipmentId ON InspectionPlans(equipmentId);
    CREATE INDEX IX_InspectionPlans_Equipment_Status ON InspectionPlans(equipmentId, status);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionPlans_ResponsibleInspector ON InspectionPlans(responsibleInspectorId);
    CREATE INDEX IX_InspectionPlans_BackupInspector ON InspectionPlans(backupInspectorId);
    CREATE INDEX IX_InspectionPlans_CreatedBy ON InspectionPlans(createdBy);
    
    -- Due date tracking and scheduling
    CREATE INDEX IX_InspectionPlans_NextDueDate ON InspectionPlans(nextDueDate);
    CREATE INDEX IX_InspectionPlans_LastInspectionDate ON InspectionPlans(lastInspectionDate);
    CREATE INDEX IX_InspectionPlans_StartDate ON InspectionPlans(startDate);
    CREATE INDEX IX_InspectionPlans_EndDate ON InspectionPlans(endDate);
    
    -- Status and priority tracking
    CREATE INDEX IX_InspectionPlans_Status ON InspectionPlans(status);
    CREATE INDEX IX_InspectionPlans_Priority ON InspectionPlans(priority);
    CREATE INDEX IX_InspectionPlans_PlanType ON InspectionPlans(planType);
    
    -- Classification and filtering
    CREATE INDEX IX_InspectionPlans_InspectionType ON InspectionPlans(inspectionType);
    CREATE INDEX IX_InspectionPlans_Frequency ON InspectionPlans(frequency);
    CREATE INDEX IX_InspectionPlans_Criticality ON InspectionPlans(criticality);
    
    -- Compliance and regulatory tracking
    CREATE INDEX IX_InspectionPlans_RegulatoryRequirement ON InspectionPlans(regulatoryRequirement);
    CREATE INDEX IX_InspectionPlans_SafetyRelated ON InspectionPlans(safetyRelated);
    
    -- Audit trail
    CREATE INDEX IX_InspectionPlans_CreatedAt ON InspectionPlans(createdAt);
    CREATE INDEX IX_InspectionPlans_UpdatedAt ON InspectionPlans(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionPlans_Status_NextDueDate ON InspectionPlans(status, nextDueDate);
    CREATE INDEX IX_InspectionPlans_Equipment_NextDueDate ON InspectionPlans(equipmentId, nextDueDate);
    CREATE INDEX IX_InspectionPlans_ResponsibleInspector_Status ON InspectionPlans(responsibleInspectorId, status);
    CREATE INDEX IX_InspectionPlans_Status_Priority ON InspectionPlans(status, priority);
    CREATE INDEX IX_InspectionPlans_Type_Status ON InspectionPlans(inspectionType, status);
    CREATE INDEX IX_InspectionPlans_Active_DueDate ON InspectionPlans(status, nextDueDate) WHERE status = 'active';
    
    -- Name search
    CREATE INDEX IX_InspectionPlans_PlanName ON InspectionPlans(planName);

    PRINT 'InspectionPlans table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionPlans table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.37' AND scriptName = '37_create_inspection_plans_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.37',
        'Create InspectionPlans table for inspection planning and scheduling',
        '37_create_inspection_plans_table.sql',
        'SUCCESS',
        'InspectionPlans table supports ISO 9001 inspection planning with both recurring and one-time plans, frequency management, responsible inspector assignment, and full audit trail'
    );
END
GO


-- =============================================
-- Acceptance Criteria Table
-- =============================================
-- Stores acceptance criteria for inspection types
-- Defines pass/fail rules, tolerances, and standardized criteria
-- Supports ISO 9001 inspection validation and quality control requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AcceptanceCriteria')
BEGIN
    CREATE TABLE AcceptanceCriteria (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Criteria Identification
        criteriaCode NVARCHAR(100) UNIQUE NOT NULL, -- Unique identifier for the criteria
        criteriaName NVARCHAR(500) NOT NULL, -- Descriptive name of the criteria
        description NVARCHAR(2000), -- Detailed description of what is being measured/evaluated
        
        -- Inspection Type Association
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection this criteria applies to
        equipmentCategory NVARCHAR(200), -- Optional: specific equipment category or type
        
        -- Measurement Definition
        parameterName NVARCHAR(200) NOT NULL, -- Name of the parameter being measured
        unit NVARCHAR(50), -- Unit of measurement (mm, kg, psi, °C, etc.)
        measurementType NVARCHAR(50) NOT NULL, -- Type of measurement (quantitative, qualitative, binary, range)
        
        -- Pass/Fail Rules
        ruleType NVARCHAR(50) NOT NULL, -- Type of rule (range, min, max, exact, tolerance, checklist)
        
        -- Numeric Thresholds (for quantitative measurements)
        targetValue DECIMAL(18,6), -- Target or nominal value
        minValue DECIMAL(18,6), -- Minimum acceptable value
        maxValue DECIMAL(18,6), -- Maximum acceptable value
        tolerancePlus DECIMAL(18,6), -- Positive tolerance from target
        toleranceMinus DECIMAL(18,6), -- Negative tolerance from target
        
        -- Qualitative Criteria (for non-numeric evaluations)
        acceptableValues NVARCHAR(1000), -- Comma-separated list of acceptable values
        unacceptableValues NVARCHAR(1000), -- Comma-separated list of unacceptable values
        
        -- Severity and Importance
        severity NVARCHAR(50) NOT NULL DEFAULT 'normal', -- Severity if criteria fails (critical, major, minor, normal)
        mandatory BIT NOT NULL DEFAULT 1, -- Whether this criteria must be met (true) or is advisory (false)
        safetyRelated BIT DEFAULT 0, -- Whether this criteria is safety-related
        regulatoryRequirement BIT DEFAULT 0, -- Whether this is a regulatory requirement
        
        -- Decision Logic
        failureAction NVARCHAR(50) NOT NULL DEFAULT 'fail_inspection', -- Action on failure (fail_inspection, flag_for_review, warning_only)
        allowOverride BIT DEFAULT 0, -- Whether failure can be overridden by authorized personnel
        overrideAuthorizationLevel NVARCHAR(100), -- Required role/permission to override
        
        -- Compliance References
        standardReference NVARCHAR(200), -- Reference to standard or specification (e.g., ISO 9001:2015)
        procedureReference NVARCHAR(200), -- Reference to internal procedure or work instruction
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- Criteria status (active, inactive, draft, obsolete)
        effectiveDate DATETIME2 NOT NULL, -- Date when criteria becomes effective
        expiryDate DATETIME2, -- Date when criteria expires (NULL for no expiry)
        
        -- Versioning
        version NVARCHAR(50) NOT NULL DEFAULT '1.0', -- Version of the criteria
        supersedes INT, -- ID of the criteria this version supersedes
        
        -- Additional Information
        inspectionMethod NVARCHAR(500), -- Method or procedure for performing the measurement
        requiredEquipment NVARCHAR(500), -- Equipment or tools required to verify criteria
        frequency NVARCHAR(100), -- How often this criteria should be checked
        sampleSize INT, -- Number of samples required for statistical criteria
        
        notes NVARCHAR(2000), -- Additional notes or instructions
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created the criteria
        updatedBy INT, -- User who last updated the criteria
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AcceptanceCriteria_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_AcceptanceCriteria_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        CONSTRAINT FK_AcceptanceCriteria_Supersedes FOREIGN KEY (supersedes) REFERENCES AcceptanceCriteria(id),
        
        -- Constraints
        CONSTRAINT CK_AcceptanceCriteria_MeasurementType CHECK (measurementType IN (
            'quantitative',     -- Numeric measurements
            'qualitative',      -- Non-numeric assessments
            'binary',          -- Pass/fail, yes/no
            'range',           -- Value within a range
            'checklist'        -- Multiple items to check
        )),
        CONSTRAINT CK_AcceptanceCriteria_RuleType CHECK (ruleType IN (
            'range',           -- Value must be between min and max
            'min',             -- Value must be >= minimum
            'max',             -- Value must be <= maximum
            'exact',           -- Value must match exactly
            'tolerance',       -- Value must be within tolerance of target
            'checklist',       -- All checklist items must pass
            'pass_fail'        -- Simple pass/fail evaluation
        )),
        CONSTRAINT CK_AcceptanceCriteria_Severity CHECK (severity IN (
            'critical',        -- Critical - immediate action required
            'major',           -- Major - significant impact
            'minor',           -- Minor - minimal impact
            'normal'           -- Normal - standard criteria
        )),
        CONSTRAINT CK_AcceptanceCriteria_FailureAction CHECK (failureAction IN (
            'fail_inspection',     -- Fail the entire inspection
            'flag_for_review',     -- Flag for supervisor review
            'warning_only',        -- Log warning but allow to pass
            'conditional_pass'     -- Pass with conditions
        )),
        CONSTRAINT CK_AcceptanceCriteria_Status CHECK (status IN (
            'active',
            'inactive',
            'draft',
            'obsolete'
        )),
        CONSTRAINT CK_AcceptanceCriteria_DateRange CHECK (expiryDate IS NULL OR expiryDate > effectiveDate),
        CONSTRAINT CK_AcceptanceCriteria_RangeValues CHECK (
            (minValue IS NULL OR maxValue IS NULL) OR (minValue <= maxValue)
        ),
        CONSTRAINT CK_AcceptanceCriteria_SampleSize CHECK (sampleSize IS NULL OR sampleSize > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_AcceptanceCriteria_CriteriaCode ON AcceptanceCriteria(criteriaCode);
    
    -- Inspection type lookups
    CREATE INDEX IX_AcceptanceCriteria_InspectionType ON AcceptanceCriteria(inspectionType);
    CREATE INDEX IX_AcceptanceCriteria_InspectionType_Status ON AcceptanceCriteria(inspectionType, status);
    
    -- Equipment category filtering
    CREATE INDEX IX_AcceptanceCriteria_EquipmentCategory ON AcceptanceCriteria(equipmentCategory);
    
    -- Parameter and measurement lookups
    CREATE INDEX IX_AcceptanceCriteria_ParameterName ON AcceptanceCriteria(parameterName);
    CREATE INDEX IX_AcceptanceCriteria_MeasurementType ON AcceptanceCriteria(measurementType);
    CREATE INDEX IX_AcceptanceCriteria_RuleType ON AcceptanceCriteria(ruleType);
    
    -- Status and lifecycle tracking
    CREATE INDEX IX_AcceptanceCriteria_Status ON AcceptanceCriteria(status);
    CREATE INDEX IX_AcceptanceCriteria_EffectiveDate ON AcceptanceCriteria(effectiveDate);
    CREATE INDEX IX_AcceptanceCriteria_ExpiryDate ON AcceptanceCriteria(expiryDate);
    
    -- Severity and criticality
    CREATE INDEX IX_AcceptanceCriteria_Severity ON AcceptanceCriteria(severity);
    CREATE INDEX IX_AcceptanceCriteria_Mandatory ON AcceptanceCriteria(mandatory);
    CREATE INDEX IX_AcceptanceCriteria_SafetyRelated ON AcceptanceCriteria(safetyRelated);
    CREATE INDEX IX_AcceptanceCriteria_RegulatoryRequirement ON AcceptanceCriteria(regulatoryRequirement);
    
    -- Versioning
    CREATE INDEX IX_AcceptanceCriteria_Version ON AcceptanceCriteria(version);
    CREATE INDEX IX_AcceptanceCriteria_Supersedes ON AcceptanceCriteria(supersedes);
    
    -- Personnel tracking
    CREATE INDEX IX_AcceptanceCriteria_CreatedBy ON AcceptanceCriteria(createdBy);
    CREATE INDEX IX_AcceptanceCriteria_UpdatedBy ON AcceptanceCriteria(updatedBy);
    
    -- Audit trail
    CREATE INDEX IX_AcceptanceCriteria_CreatedAt ON AcceptanceCriteria(createdAt);
    CREATE INDEX IX_AcceptanceCriteria_UpdatedAt ON AcceptanceCriteria(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_AcceptanceCriteria_Type_Category ON AcceptanceCriteria(inspectionType, equipmentCategory);
    CREATE INDEX IX_AcceptanceCriteria_Status_EffectiveDate ON AcceptanceCriteria(status, effectiveDate);
    CREATE INDEX IX_AcceptanceCriteria_Active ON AcceptanceCriteria(status, effectiveDate, expiryDate) 
        WHERE status = 'active';
    
    -- Name search
    CREATE INDEX IX_AcceptanceCriteria_CriteriaName ON AcceptanceCriteria(criteriaName);

    PRINT 'AcceptanceCriteria table created successfully';
END
ELSE
BEGIN
    PRINT 'AcceptanceCriteria table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.38' AND scriptName = '38_create_acceptance_criteria_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.38',
        'Create AcceptanceCriteria table for inspection validation rules',
        '38_create_acceptance_criteria_table.sql',
        'SUCCESS',
        'AcceptanceCriteria table supports ISO 9001 quality control with pass/fail rules, tolerances, and standardized criteria linked to inspection types'
    );
END
GO


-- =============================================
-- Inspection Items Table
-- =============================================
-- Stores individual inspection items/checks within an inspection record
-- Links inspection records to acceptance criteria with measured values and pass/fail results
-- Supports ISO 9001 inspection validation and automatic scoring
-- Used for P4:4:3 auto scoring logic implementation

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionItems')
BEGIN
    CREATE TABLE InspectionItems (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Inspection Record Reference
        inspectionRecordId INT NOT NULL, -- Reference to InspectionRecords table
        
        -- Acceptance Criteria Reference
        acceptanceCriteriaId INT NOT NULL, -- Reference to AcceptanceCriteria table
        
        -- Measurement Details
        measuredValue NVARCHAR(500), -- The actual measured/observed value
        measurementUnit NVARCHAR(50), -- Unit of measurement (copied from criteria for reference)
        
        -- Pass/Fail Evaluation
        passed BIT NOT NULL DEFAULT 0, -- Whether this item passed the criteria
        autoScored BIT NOT NULL DEFAULT 0, -- Whether this was automatically scored or manually evaluated
        
        -- Validation Result
        validationMessage NVARCHAR(1000), -- Message from validation logic (e.g., "Value 23.5 is within range [20, 25]")
        
        -- Override Capability
        overridden BIT DEFAULT 0, -- Whether the auto-score was overridden by authorized personnel
        overrideReason NVARCHAR(500), -- Reason for override if applicable
        overriddenBy INT, -- User who performed the override
        overriddenAt DATETIME2, -- When the override occurred
        
        -- Item Status
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped', 'not_applicable'
        
        -- Severity and Impact (copied from criteria)
        severity NVARCHAR(50), -- Severity level from acceptance criteria
        mandatory BIT, -- Whether this is a mandatory check
        
        -- Additional Context
        notes NVARCHAR(2000), -- Inspector's notes or observations
        photoAttachments NVARCHAR(1000), -- References to photo attachments for this specific item
        
        -- Item Order and Organization
        itemOrder INT, -- Display order within the inspection
        sectionName NVARCHAR(200), -- Optional section/category grouping
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the item
        updatedBy INT, -- User who last updated the item
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionItems_InspectionRecord FOREIGN KEY (inspectionRecordId) REFERENCES InspectionRecords(id) ON DELETE CASCADE,
        CONSTRAINT FK_InspectionItems_AcceptanceCriteria FOREIGN KEY (acceptanceCriteriaId) REFERENCES AcceptanceCriteria(id),
        CONSTRAINT FK_InspectionItems_OverriddenBy FOREIGN KEY (overriddenBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionItems_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionItems_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionItems_Status CHECK (status IN (
            'pending',          -- Not yet evaluated
            'completed',        -- Evaluation complete
            'skipped',         -- Intentionally skipped
            'not_applicable'   -- Not applicable for this inspection
        )),
        CONSTRAINT CK_InspectionItems_Severity CHECK (severity IS NULL OR severity IN (
            'critical',
            'major',
            'minor',
            'normal'
        )),
        CONSTRAINT CK_InspectionItems_ItemOrder CHECK (itemOrder IS NULL OR itemOrder > 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_InspectionItems_InspectionRecordId ON InspectionItems(inspectionRecordId);
    CREATE INDEX IX_InspectionItems_AcceptanceCriteriaId ON InspectionItems(acceptanceCriteriaId);
    
    -- Pass/fail tracking
    CREATE INDEX IX_InspectionItems_Passed ON InspectionItems(passed);
    CREATE INDEX IX_InspectionItems_Status ON InspectionItems(status);
    
    -- Scoring method tracking
    CREATE INDEX IX_InspectionItems_AutoScored ON InspectionItems(autoScored);
    CREATE INDEX IX_InspectionItems_Overridden ON InspectionItems(overridden);
    
    -- Severity and criticality
    CREATE INDEX IX_InspectionItems_Severity ON InspectionItems(severity);
    CREATE INDEX IX_InspectionItems_Mandatory ON InspectionItems(mandatory);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionItems_OverriddenBy ON InspectionItems(overriddenBy);
    CREATE INDEX IX_InspectionItems_CreatedBy ON InspectionItems(createdBy);
    CREATE INDEX IX_InspectionItems_UpdatedBy ON InspectionItems(updatedBy);
    
    -- Audit trail
    CREATE INDEX IX_InspectionItems_CreatedAt ON InspectionItems(createdAt);
    CREATE INDEX IX_InspectionItems_UpdatedAt ON InspectionItems(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionItems_Record_Status ON InspectionItems(inspectionRecordId, status);
    CREATE INDEX IX_InspectionItems_Record_Passed ON InspectionItems(inspectionRecordId, passed);
    CREATE INDEX IX_InspectionItems_Record_Order ON InspectionItems(inspectionRecordId, itemOrder);
    CREATE INDEX IX_InspectionItems_Record_Severity ON InspectionItems(inspectionRecordId, severity);
    CREATE INDEX IX_InspectionItems_Failed_Mandatory ON InspectionItems(passed, mandatory) WHERE passed = 0 AND mandatory = 1;
    
    -- Section organization
    CREATE INDEX IX_InspectionItems_SectionName ON InspectionItems(sectionName);

    PRINT 'InspectionItems table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionItems table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.39' AND scriptName = '39_create_inspection_items_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.39',
        'Create InspectionItems table for inspection item tracking and auto scoring',
        '39_create_inspection_items_table.sql',
        'SUCCESS',
        'InspectionItems table links inspection records to acceptance criteria with measured values and automatic pass/fail scoring. Supports P4:4:3 auto scoring logic with override capability and full audit trail.'
    );
END
GO


-- =============================================
-- Add Inspection Record Link to NCRs
-- =============================================
-- Adds optional link from NCR to InspectionRecord for traceability
-- Supports P4:4:4 - Direct-to-NCR integration for failed inspections

-- Add inspectionRecordId column to NCRs table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'NCRs') AND name = 'inspectionRecordId')
BEGIN
    ALTER TABLE NCRs
    ADD inspectionRecordId INT NULL;

    -- Add foreign key constraint
    ALTER TABLE NCRs
    ADD CONSTRAINT FK_NCRs_InspectionRecord FOREIGN KEY (inspectionRecordId) REFERENCES InspectionRecords(id);

    -- Add index for performance
    CREATE INDEX IX_NCRs_InspectionRecordId ON NCRs(inspectionRecordId);

    PRINT 'Added inspectionRecordId column to NCRs table';
END
ELSE
BEGIN
    PRINT 'inspectionRecordId column already exists in NCRs table';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.40' AND scriptName = '40_add_inspection_link_to_ncr.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.40',
        'Add inspection record link to NCRs table',
        '40_add_inspection_link_to_ncr.sql',
        'SUCCESS',
        'Enables direct-to-NCR integration for failed inspections with full traceability'
    );
END
GO


-- =============================================
-- Improvement Ideas Table
-- =============================================
-- Stores improvement ideas submitted by users for continuous improvement initiatives
-- Supports ISO 9001 continuous improvement requirements and innovation tracking

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImprovementIdeas')
BEGIN
    CREATE TABLE ImprovementIdeas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Idea Identification
        ideaNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique idea identifier
        title NVARCHAR(500) NOT NULL, -- Idea title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed idea description
        
        -- Classification
        category NVARCHAR(200) NOT NULL, -- Idea category (process improvement, cost reduction, quality enhancement, safety, etc.)
        
        -- Impact Assessment
        expectedImpact NVARCHAR(2000), -- Expected impact of implementing the idea
        impactArea NVARCHAR(200), -- Area of impact (productivity, quality, cost, safety, customer satisfaction, etc.)
        
        -- Ownership and Accountability
        submittedBy INT NOT NULL, -- User who submitted the idea
        responsibleUser INT, -- User assigned to evaluate/implement the idea
        department NVARCHAR(100), -- Department or area associated with the idea
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'submitted', -- Current status of the idea
        submittedDate DATETIME2 NOT NULL DEFAULT GETDATE(), -- Date idea was submitted
        reviewedDate DATETIME2, -- Date idea was reviewed
        implementedDate DATETIME2, -- Date idea was implemented (if approved and completed)
        
        -- Review and Evaluation
        reviewComments NVARCHAR(2000), -- Comments from reviewer
        reviewedBy INT, -- User who reviewed the idea
        
        -- Implementation Details
        implementationNotes NVARCHAR(2000), -- Notes on implementation
        estimatedCost DECIMAL(18,2), -- Estimated cost to implement
        estimatedBenefit NVARCHAR(1000), -- Estimated benefit from implementation
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ImprovementIdeas_SubmittedBy FOREIGN KEY (submittedBy) REFERENCES Users(id),
        CONSTRAINT FK_ImprovementIdeas_ResponsibleUser FOREIGN KEY (responsibleUser) REFERENCES Users(id),
        CONSTRAINT FK_ImprovementIdeas_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ImprovementIdeas_Status CHECK (status IN (
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'in_progress',
            'implemented',
            'closed'
        )),
        CONSTRAINT CK_ImprovementIdeas_EstimatedCost CHECK (estimatedCost IS NULL OR estimatedCost >= 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_ImprovementIdeas_IdeaNumber ON ImprovementIdeas(ideaNumber);
    
    -- Status tracking
    CREATE INDEX IX_ImprovementIdeas_Status ON ImprovementIdeas(status);
    
    -- Date-based queries
    CREATE INDEX IX_ImprovementIdeas_SubmittedDate ON ImprovementIdeas(submittedDate DESC);
    CREATE INDEX IX_ImprovementIdeas_ReviewedDate ON ImprovementIdeas(reviewedDate);
    CREATE INDEX IX_ImprovementIdeas_ImplementedDate ON ImprovementIdeas(implementedDate);
    CREATE INDEX IX_ImprovementIdeas_CreatedAt ON ImprovementIdeas(createdAt DESC);
    
    -- Personnel tracking
    CREATE INDEX IX_ImprovementIdeas_SubmittedBy ON ImprovementIdeas(submittedBy);
    CREATE INDEX IX_ImprovementIdeas_ResponsibleUser ON ImprovementIdeas(responsibleUser);
    CREATE INDEX IX_ImprovementIdeas_ReviewedBy ON ImprovementIdeas(reviewedBy);
    
    -- Classification tracking
    CREATE INDEX IX_ImprovementIdeas_Category ON ImprovementIdeas(category);
    CREATE INDEX IX_ImprovementIdeas_Department ON ImprovementIdeas(department);
    CREATE INDEX IX_ImprovementIdeas_ImpactArea ON ImprovementIdeas(impactArea);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ImprovementIdeas_Status_SubmittedDate ON ImprovementIdeas(status, submittedDate DESC);
    CREATE INDEX IX_ImprovementIdeas_SubmittedBy_Status ON ImprovementIdeas(submittedBy, status);
    CREATE INDEX IX_ImprovementIdeas_ResponsibleUser_Status ON ImprovementIdeas(responsibleUser, status);
    CREATE INDEX IX_ImprovementIdeas_Category_Status ON ImprovementIdeas(category, status);
    
    -- Search optimization
    CREATE INDEX IX_ImprovementIdeas_Title ON ImprovementIdeas(title);

    PRINT 'ImprovementIdeas table created successfully';
END
ELSE
BEGIN
    PRINT 'ImprovementIdeas table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.41' AND scriptName = '41_create_improvement_ideas_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.41',
        'Create ImprovementIdeas table for continuous improvement tracking',
        '41_create_improvement_ideas_table.sql',
        'SUCCESS',
        'ImprovementIdeas table supports ISO 9001 continuous improvement with submission, review, and implementation tracking.'
    );
END
GO


-- =============================================
-- Implementation Tasks Table
-- =============================================
-- Tracks individual tasks for implementing approved improvement ideas
-- Supports ISO 9001 continuous improvement with progress tracking and accountability

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImplementationTasks')
BEGIN
    CREATE TABLE ImplementationTasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Link to Improvement Idea
        improvementIdeaId INT NOT NULL,
        
        -- Task Details
        taskName NVARCHAR(500) NOT NULL, -- Name/title of the task
        taskDescription NVARCHAR(2000), -- Detailed description of what needs to be done
        
        -- Assignment and Accountability
        assignedTo INT, -- User assigned to complete this task
        
        -- Timeline
        deadline DATETIME2, -- Expected completion date
        startedDate DATETIME2, -- Date task work began
        completedDate DATETIME2, -- Date task was actually completed
        
        -- Progress Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Current status
        progressPercentage INT DEFAULT 0, -- Progress percentage (0-100)
        
        -- Completion Evidence
        completionEvidence NVARCHAR(2000), -- Evidence or notes about task completion
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE(),
        updatedBy INT,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ImplementationTasks_ImprovementIdea FOREIGN KEY (improvementIdeaId) 
            REFERENCES ImprovementIdeas(id) ON DELETE CASCADE,
        CONSTRAINT FK_ImplementationTasks_AssignedTo FOREIGN KEY (assignedTo) 
            REFERENCES Users(id),
        CONSTRAINT FK_ImplementationTasks_CreatedBy FOREIGN KEY (createdBy) 
            REFERENCES Users(id),
        CONSTRAINT FK_ImplementationTasks_UpdatedBy FOREIGN KEY (updatedBy) 
            REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ImplementationTasks_Status CHECK (status IN (
            'pending',      -- Not started yet
            'in_progress',  -- Currently being worked on
            'completed',    -- Task finished
            'blocked',      -- Blocked by dependencies or issues
            'cancelled'     -- Task cancelled
        )),
        CONSTRAINT CK_ImplementationTasks_ProgressPercentage 
            CHECK (progressPercentage >= 0 AND progressPercentage <= 100),
        CONSTRAINT CK_ImplementationTasks_CompletedDateLogic 
            CHECK (
                (status = 'completed' AND completedDate IS NOT NULL) OR 
                (status != 'completed' AND completedDate IS NULL)
            )
    );

    -- Indexes for Performance
    
    -- Link to improvement idea (most common query)
    CREATE INDEX IX_ImplementationTasks_ImprovementIdeaId 
        ON ImplementationTasks(improvementIdeaId);
    
    -- Status tracking
    CREATE INDEX IX_ImplementationTasks_Status 
        ON ImplementationTasks(status);
    
    -- Assignment tracking
    CREATE INDEX IX_ImplementationTasks_AssignedTo 
        ON ImplementationTasks(assignedTo);
    
    -- Deadline tracking
    CREATE INDEX IX_ImplementationTasks_Deadline 
        ON ImplementationTasks(deadline);
    
    -- Completion tracking
    CREATE INDEX IX_ImplementationTasks_CompletedDate 
        ON ImplementationTasks(completedDate);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ImplementationTasks_IdeaId_Status 
        ON ImplementationTasks(improvementIdeaId, status);
    CREATE INDEX IX_ImplementationTasks_AssignedTo_Status 
        ON ImplementationTasks(assignedTo, status);
    CREATE INDEX IX_ImplementationTasks_Status_Deadline 
        ON ImplementationTasks(status, deadline);
    
    -- Audit trail
    CREATE INDEX IX_ImplementationTasks_CreatedAt 
        ON ImplementationTasks(createdAt DESC);

    PRINT 'ImplementationTasks table created successfully';
END
ELSE
BEGIN
    PRINT 'ImplementationTasks table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.42' AND scriptName = '42_create_implementation_tasks_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.42',
        'Create ImplementationTasks table for tracking improvement idea implementation',
        '42_create_implementation_tasks_table.sql',
        'SUCCESS',
        'ImplementationTasks table tracks individual tasks for implementing approved improvements with deadlines, assignments, and completion evidence.'
    );
END
GO


-- =============================================
-- Email Templates Table
-- =============================================
-- Stores customizable email templates for automated notifications
-- Supports NCR notifications, training reminders, and audit assignments
-- Includes placeholder variables for dynamic content

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailTemplates')
BEGIN
    CREATE TABLE EmailTemplates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Template Identification
        name NVARCHAR(200) NOT NULL, -- Internal template name/identifier
        displayName NVARCHAR(200) NOT NULL, -- User-friendly display name
        
        -- Template Classification
        type NVARCHAR(100) NOT NULL, -- 'ncr_notification', 'training_reminder', 'audit_assignment', etc.
        category NVARCHAR(100) NOT NULL, -- 'ncr', 'training', 'audit', 'general'
        
        -- Template Content
        subject NVARCHAR(500) NOT NULL, -- Email subject line (supports placeholders)
        body NVARCHAR(MAX) NOT NULL, -- Email body content (supports placeholders)
        
        -- Template Metadata
        description NVARCHAR(1000), -- Description of when/how to use this template
        placeholders NVARCHAR(2000), -- JSON array of available placeholder variables
        
        -- Template Status
        isActive BIT NOT NULL DEFAULT 1, -- Whether template is active and can be used
        isDefault BIT NOT NULL DEFAULT 0, -- Whether this is the default template for its type
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NULL, -- User who created this template
        updatedBy INT NULL, -- User who last updated this template
        
        -- Foreign Key Constraints
        CONSTRAINT FK_EmailTemplates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_EmailTemplates_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_EmailTemplates_Type CHECK (type IN (
            'ncr_notification',
            'ncr_assignment',
            'ncr_status_update',
            'training_reminder',
            'training_assignment',
            'training_expiry_warning',
            'audit_assignment',
            'audit_notification',
            'audit_finding',
            'capa_assignment',
            'capa_deadline_reminder'
        )),
        CONSTRAINT CK_EmailTemplates_Category CHECK (category IN (
            'ncr',
            'training',
            'audit',
            'capa',
            'general'
        )),
        -- Ensure only one default template per type
        CONSTRAINT UQ_EmailTemplates_DefaultPerType UNIQUE (type, isDefault) 
            
    );

    -- Indexes for Performance
    
    -- Primary lookup by type
    CREATE INDEX IX_EmailTemplates_Type ON EmailTemplates(type);
    
    -- Filter by category and active status
    CREATE INDEX IX_EmailTemplates_Category ON EmailTemplates(category);
    CREATE INDEX IX_EmailTemplates_IsActive ON EmailTemplates(isActive);
    
    -- Find default templates
    CREATE INDEX IX_EmailTemplates_IsDefault ON EmailTemplates(isDefault) WHERE isDefault = 1;
    
    -- Composite indexes for common queries
    CREATE INDEX IX_EmailTemplates_Type_Active ON EmailTemplates(type, isActive);
    CREATE INDEX IX_EmailTemplates_Category_Active ON EmailTemplates(category, isActive);
    
    -- Audit trail lookups
    CREATE INDEX IX_EmailTemplates_CreatedAt ON EmailTemplates(createdAt DESC);
    CREATE INDEX IX_EmailTemplates_UpdatedAt ON EmailTemplates(updatedAt DESC);

    CREATE UNIQUE INDEX UX_EmailTemplates_DefaultPerType ON EmailTemplates(type)
    WHERE isDefault = 1;

    PRINT 'EmailTemplates table created successfully';
END
ELSE
BEGIN
    PRINT 'EmailTemplates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.43' AND scriptName = '43_create_email_templates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.43',
        'Create EmailTemplates table for customizable email notifications',
        '43_create_email_templates_table.sql',
        'SUCCESS',
        'EmailTemplates table supports NCR notifications, training reminders, and audit assignments with placeholder variables'
    );
END
GO

-- Insert default email templates
IF NOT EXISTS (SELECT * FROM EmailTemplates WHERE type = 'ncr_notification')
BEGIN
    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_ncr_notification',
        'NCR Created Notification',
        'ncr_notification',
        'ncr',
        'New NCR Created: {{ncrNumber}} - {{title}}',
        'Hello {{recipientName}},

A new Non-Conformity Report (NCR) has been created:

NCR Number: {{ncrNumber}}
Title: {{title}}
Description: {{description}}
Severity: {{severity}}
Category: {{category}}
Detected Date: {{detectedDate}}
Reported By: {{reportedByName}}

Please review this NCR and take appropriate action.

View NCR: {{ncrUrl}}

Best regards,
E-QMS System',
        'Default template for NCR creation notifications',
        '["recipientName", "ncrNumber", "title", "description", "severity", "category", "detectedDate", "reportedByName", "ncrUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_ncr_assignment',
        'NCR Assignment Notification',
        'ncr_assignment',
        'ncr',
        'NCR Assigned to You: {{ncrNumber}} - {{title}}',
        'Hello {{assigneeName}},

You have been assigned to the following NCR:

NCR Number: {{ncrNumber}}
Title: {{title}}
Description: {{description}}
Severity: {{severity}}
Priority: {{priority}}
Assigned By: {{assignedByName}}
Assigned Date: {{assignedDate}}

Please investigate and take appropriate corrective actions.

View NCR: {{ncrUrl}}

Best regards,
E-QMS System',
        'Default template for NCR assignment notifications',
        '["assigneeName", "ncrNumber", "title", "description", "severity", "priority", "assignedByName", "assignedDate", "ncrUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_training_reminder',
        'Training Session Reminder',
        'training_reminder',
        'training',
        'Reminder: Training Session "{{trainingTitle}}" - {{scheduledDate}}',
        'Hello {{recipientName}},

This is a reminder about your upcoming training session:

Training: {{trainingTitle}}
Date: {{scheduledDate}}
Duration: {{duration}} minutes
Instructor: {{instructor}}
Location: {{location}}

Description: {{description}}

Please ensure you attend this training session.

View Training Details: {{trainingUrl}}

Best regards,
E-QMS System',
        'Default template for training session reminders',
        '["recipientName", "trainingTitle", "scheduledDate", "duration", "instructor", "location", "description", "trainingUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_training_expiry_warning',
        'Training Certificate Expiry Warning',
        'training_expiry_warning',
        'training',
        'Training Certificate Expiring Soon: {{trainingTitle}}',
        'Hello {{recipientName}},

Your training certificate is expiring soon:

Training: {{trainingTitle}}
Certificate Issued: {{completedDate}}
Expiry Date: {{expiryDate}}
Days Until Expiry: {{daysUntilExpiry}}

Please schedule a refresher training session to maintain your certification.

View Training History: {{trainingUrl}}

Best regards,
E-QMS System',
        'Default template for training certificate expiry warnings',
        '["recipientName", "trainingTitle", "completedDate", "expiryDate", "daysUntilExpiry", "trainingUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_audit_assignment',
        'Audit Assignment Notification',
        'audit_assignment',
        'audit',
        'Audit Assignment: {{auditTitle}} - {{auditDate}}',
        'Hello {{auditorName}},

You have been assigned as {{auditorRole}} for the following audit:

Audit: {{auditTitle}}
Type: {{auditType}}
Date: {{auditDate}}
Scope: {{scope}}
Assigned By: {{assignedByName}}

Auditee(s): {{auditees}}

Please review the audit plan and prepare accordingly.

View Audit Details: {{auditUrl}}

Best regards,
E-QMS System',
        'Default template for audit assignment notifications',
        '["auditorName", "auditorRole", "auditTitle", "auditType", "auditDate", "scope", "assignedByName", "auditees", "auditUrl"]',
        1,
        1
    );

    PRINT 'Default email templates inserted successfully';
END
GO


-- Migration: Create ReminderLogs table
-- Description: Table to store execution logs for automated reminder tasks
-- Version: 44
-- Date: 2025-01-18

USE eqms;
GO

-- Create ReminderLogs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReminderLogs' AND type = 'U')
BEGIN
    CREATE TABLE ReminderLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        reminderType NVARCHAR(50) NOT NULL, -- 'training_expiry', 'equipment_calibration', 'equipment_maintenance', 'capa_deadline'
        executionTime DATETIME NOT NULL DEFAULT GETDATE(),
        status NVARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
        itemsProcessed INT DEFAULT 0,
        itemsNotified INT DEFAULT 0,
        errorMessage NVARCHAR(MAX),
        executionDurationMs INT, -- Duration in milliseconds
        configuration NVARCHAR(MAX), -- JSON with execution parameters
        details NVARCHAR(MAX), -- JSON with detailed results
        createdAt DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT CK_ReminderLogs_Status CHECK (status IN ('success', 'failed', 'partial')),
        CONSTRAINT CK_ReminderLogs_Type CHECK (reminderType IN (
            'training_expiry', 
            'equipment_calibration', 
            'equipment_maintenance', 
            'capa_deadline',
            'all_reminders'
        ))
    );
    
    -- Create indexes for performance
    CREATE INDEX IX_ReminderLogs_Type ON ReminderLogs(reminderType);
    CREATE INDEX IX_ReminderLogs_ExecutionTime ON ReminderLogs(executionTime DESC);
    CREATE INDEX IX_ReminderLogs_Status ON ReminderLogs(status);
    
    PRINT 'ReminderLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'ReminderLogs table already exists';
END
GO

-- Create system_settings table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[system_settings]') AND type in (N'U'))
BEGIN
    CREATE TABLE system_settings (
        id INT PRIMARY KEY IDENTITY(1,1),
        setting_key NVARCHAR(100) NOT NULL UNIQUE,
        setting_value NVARCHAR(MAX),
        setting_type NVARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
        category NVARCHAR(50) NOT NULL, -- 'general', 'notifications', 'audit', 'backup', 'permissions'
        display_name NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        is_editable BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Create index on setting_key
    CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
    
    -- Create index on category
    CREATE INDEX idx_system_settings_category ON system_settings(category);

    PRINT 'Table system_settings created successfully';
END
ELSE
BEGIN
    PRINT 'Table system_settings already exists';
END
GO

-- Insert default system settings
IF NOT EXISTS (SELECT * FROM system_settings WHERE setting_key = 'system_name')
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, setting_type, category, display_name, description, is_editable)
    VALUES 
    -- General Settings
    ('system_name', 'E-QMS', 'string', 'general', 'System Name', 'The name of the quality management system displayed to users', 1),
    ('system_version', '1.0.0', 'string', 'general', 'System Version', 'Current version of the system', 0),
    ('organization_name', '', 'string', 'general', 'Organization Name', 'Name of the organization using this system', 1),
    
    -- Notification Settings
    ('reminder_training_days', '30', 'number', 'notifications', 'Training Reminder Days', 'Days before training expiry to send reminders', 1),
    ('reminder_calibration_days', '30', 'number', 'notifications', 'Calibration Reminder Days', 'Days before calibration due to send reminders', 1),
    ('reminder_maintenance_days', '30', 'number', 'notifications', 'Maintenance Reminder Days', 'Days before maintenance due to send reminders', 1),
    ('reminder_capa_days', '7', 'number', 'notifications', 'CAPA Reminder Days', 'Days before CAPA deadline to send reminders', 1),
    ('notification_batch_size', '50', 'number', 'notifications', 'Notification Batch Size', 'Number of notifications to process in each batch', 1),
    
    -- Audit Configuration
    ('audit_log_retention_days', '365', 'number', 'audit', 'Audit Log Retention', 'Number of days to retain audit logs before archiving', 1),
    ('audit_log_level', 'info', 'string', 'audit', 'Audit Log Level', 'Logging level for audit events (debug, info, warning, error)', 1),
    ('audit_sensitive_data', 'false', 'boolean', 'audit', 'Log Sensitive Data', 'Whether to log sensitive data in audit trails', 1),
    
    -- Backup Configuration
    ('backup_retention_days', '30', 'number', 'backup', 'Backup Retention Days', 'Number of days to retain backup files', 1),
    ('backup_auto_enabled', 'true', 'boolean', 'backup', 'Auto Backup Enabled', 'Enable automatic scheduled backups', 1),
    ('backup_compression', 'true', 'boolean', 'backup', 'Backup Compression', 'Enable compression for backup files', 1),
    
    -- Default Permissions
    ('default_user_role', 'user', 'string', 'permissions', 'Default User Role', 'Default role assigned to new users', 1),
    ('allow_self_registration', 'false', 'boolean', 'permissions', 'Allow Self Registration', 'Allow users to self-register accounts', 1),
    ('require_approval_for_new_users', 'true', 'boolean', 'permissions', 'Require Approval for New Users', 'New users require admin approval before access', 1),
    ('session_timeout_minutes', '480', 'number', 'permissions', 'Session Timeout (Minutes)', 'User session timeout in minutes', 1);

    PRINT 'Default system settings inserted successfully';
END
ELSE
BEGIN
    PRINT 'Default system settings already exist';
END
GO


-- Record migration in DatabaseVersion table
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion' AND type = 'U')
BEGIN
    IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.44' AND scriptName = '44_create_sync_configurations_table.sql')
    BEGIN           
        INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
        VALUES(
        '1.0.44',
        'Create SyncConfigurations table for ERP/MES integration',
        '44_create_sync_configurations_table.sql',
        'SUCCESS',
        'System table'
    );
        PRINT 'Migration version 44 recorded in DatabaseVersion';
    END
END
GO
--version, description, scriptName, status, notes
--    VALUES (
--        '1.0.46',
--        'Create SyncConfigurations table for ERP/MES integration',
--        '46_create_sync_configurations_table.sql',
--        'SUCCESS',
--        'SyncConfigurations table supports configuration for external system sync adapters with scheduling, delta detection, and conflict handling'
--    );

PRINT 'Migration 44 completed successfully';
GO


-- =============================================
-- API Keys Table
-- =============================================
-- Stores API keys for integration endpoints
-- Keys are hashed using bcrypt for security

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApiKeys')
BEGIN
    CREATE TABLE ApiKeys (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Key Information
        keyHash NVARCHAR(255) UNIQUE NOT NULL, -- Hashed API key (bcrypt)
        keyPreview NVARCHAR(50) NOT NULL, -- First/last characters for display
        name NVARCHAR(255) NOT NULL, -- Descriptive name for the key
        
        -- Key Configuration
        expiresAt DATETIME2, -- Optional expiration timestamp (NULL = never expires)
        
        -- Access Control
        scopes NVARCHAR(MAX), -- JSON array of allowed scopes/permissions
        allowedIPs NVARCHAR(MAX), -- JSON array of allowed IP addresses (NULL = any IP)
        
        -- Status
        active BIT DEFAULT 1 NOT NULL, -- Whether key is active
        revokedAt DATETIME2, -- When key was revoked (if applicable)
        revokedBy INT, -- User who revoked the key
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Usage Tracking
        lastUsedAt DATETIME2, -- Last time key was used
        lastUsedIp NVARCHAR(45), -- Last IP address that used the key
        usageCount INT DEFAULT 0 NOT NULL, -- Total number of times key was used
        
        -- Metadata
        description NVARCHAR(1000), -- Detailed description/purpose
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        createdBy INT NOT NULL, -- User who created the key
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ApiKeys_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_ApiKeys_RevokedBy FOREIGN KEY (revokedBy) REFERENCES Users(id) ON DELETE NO ACTION
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Key lookup (most common operation)
    CREATE UNIQUE INDEX IX_ApiKeys_KeyHash ON ApiKeys(keyHash);
    
    -- Active keys lookup
    CREATE INDEX IX_ApiKeys_Active ON ApiKeys(active) WHERE active = 1;
    
    -- Expiration tracking
    CREATE INDEX IX_ApiKeys_ExpiresAt ON ApiKeys(expiresAt) WHERE expiresAt IS NOT NULL;
    
    -- Creator tracking
    CREATE INDEX IX_ApiKeys_CreatedBy ON ApiKeys(createdBy);
    CREATE INDEX IX_ApiKeys_CreatedAt ON ApiKeys(createdAt DESC);
    
    -- Name search
    CREATE INDEX IX_ApiKeys_Name ON ApiKeys(name);

    PRINT 'ApiKeys table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ApiKeys table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.45' AND scriptName = '45_create_api_keys_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.45',
        'Create ApiKeys table for integration authentication',
        '45_create_api_keys_table.sql',
        'SUCCESS',
        'Supports secure API key management with bcrypt hashing, scope control, and usage tracking'
    );
END
GO


-- =============================================
-- Sync Configurations Table
-- =============================================
-- Stores configuration for ERP/MES integration sync adapters
-- Supports scheduled sync runs with external systems

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncConfigurations')
BEGIN
    CREATE TABLE SyncConfigurations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Configuration Identity
        name NVARCHAR(200) NOT NULL, -- Human-readable name for this sync configuration
        description NVARCHAR(2000), -- Description of what this sync does
        
        -- System Information
        systemType NVARCHAR(50) NOT NULL, -- Type of external system (ERP, MES, etc.)
        systemName NVARCHAR(200) NOT NULL, -- Name of the external system
        
        -- Connection Configuration
        connectionString NVARCHAR(MAX), -- Encrypted connection string
        apiEndpoint NVARCHAR(500), -- API endpoint URL if REST-based
        authType NVARCHAR(50), -- Authentication type (basic, oauth, apikey, windows)
        authCredentials NVARCHAR(MAX), -- Encrypted authentication credentials
        
        -- Sync Configuration
        syncDirection NVARCHAR(50) NOT NULL, -- Direction of sync (inbound, outbound, bidirectional)
        syncType NVARCHAR(50) NOT NULL, -- Type of sync (full, delta, incremental)
        entityType NVARCHAR(100) NOT NULL, -- Entity being synced (equipment, orders, suppliers, etc.)
        
        -- Scheduling
        enabled BIT DEFAULT 1, -- Whether this sync is active
        scheduleType NVARCHAR(50) NOT NULL DEFAULT 'manual', -- Scheduling type (manual, cron, interval)
        cronExpression NVARCHAR(100), -- Cron expression for scheduled runs
        intervalMinutes INT, -- Interval in minutes for interval-based scheduling
        
        -- Delta Detection
        deltaEnabled BIT DEFAULT 1, -- Enable delta/change detection
        deltaField NVARCHAR(100), -- Field used for delta detection (lastModified, version, etc.)
        lastSyncTimestamp DATETIME2, -- Timestamp of last successful sync
        lastSyncRecordId INT, -- Last record ID synced (for ID-based delta)
        
        -- Conflict Handling
        conflictStrategy NVARCHAR(50) NOT NULL DEFAULT 'log', -- Strategy for conflicts (log, source_wins, target_wins, manual)
        
        -- Mapping Configuration
        mappingConfigJson NVARCHAR(MAX), -- JSON configuration for field mappings
        
        -- Performance Settings
        batchSize INT DEFAULT 100, -- Number of records to process in each batch
        timeoutSeconds INT DEFAULT 300, -- Timeout for sync operations
        maxRetries INT DEFAULT 3, -- Maximum retry attempts on failure
        
        -- Status Tracking
        lastRunAt DATETIME2, -- Last time this sync ran
        lastRunStatus NVARCHAR(50), -- Status of last run (success, failed, partial)
        lastRunDuration INT, -- Duration of last run in seconds
        lastRunRecordsProcessed INT, -- Number of records processed in last run
        lastRunRecordsFailed INT, -- Number of records that failed in last run
        lastRunErrorMessage NVARCHAR(MAX), -- Error message from last run if failed
        nextRunAt DATETIME2, -- Scheduled next run time
        
        -- Statistics
        totalRunsCount INT DEFAULT 0, -- Total number of runs
        successfulRunsCount INT DEFAULT 0, -- Number of successful runs
        failedRunsCount INT DEFAULT 0, -- Number of failed runs
        totalRecordsProcessed INT DEFAULT 0, -- Total records processed across all runs
        totalRecordsFailed INT DEFAULT 0, -- Total records failed across all runs
        
        -- Audit Trail
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deactivatedAt DATETIME2,
        deactivatedBy INT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncConfigurations_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_SyncConfigurations_DeactivatedBy FOREIGN KEY (deactivatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SyncConfigurations_SystemType CHECK (systemType IN (
            'ERP',
            'MES',
            'WMS',
            'CRM',
            'PLM',
            'Other'
        )),
        CONSTRAINT CK_SyncConfigurations_SyncDirection CHECK (syncDirection IN (
            'inbound',
            'outbound',
            'bidirectional'
        )),
        CONSTRAINT CK_SyncConfigurations_SyncType CHECK (syncType IN (
            'full',
            'delta',
            'incremental'
        )),
        CONSTRAINT CK_SyncConfigurations_EntityType CHECK (entityType IN (
            'equipment',
            'suppliers',
            'orders',
            'inventory',
            'employees',
            'customers',
            'products',
            'processes',
            'quality_records',
            'inspections',
            'ncr',
            'capa'
        )),
        CONSTRAINT CK_SyncConfigurations_ScheduleType CHECK (scheduleType IN (
            'manual',
            'cron',
            'interval'
        )),
        CONSTRAINT CK_SyncConfigurations_AuthType CHECK (authType IN (
            'basic',
            'oauth',
            'apikey',
            'windows',
            'certificate',
            'none'
        )),
        CONSTRAINT CK_SyncConfigurations_ConflictStrategy CHECK (conflictStrategy IN (
            'log',
            'source_wins',
            'target_wins',
            'manual',
            'newest_wins',
            'skip'
        )),
        CONSTRAINT CK_SyncConfigurations_LastRunStatus CHECK (lastRunStatus IS NULL OR lastRunStatus IN (
            'success',
            'failed',
            'partial',
            'cancelled',
            'in_progress'
        )),
        CONSTRAINT CK_SyncConfigurations_IntervalMinutes CHECK (intervalMinutes IS NULL OR intervalMinutes > 0),
        CONSTRAINT CK_SyncConfigurations_BatchSize CHECK (batchSize > 0),
        CONSTRAINT CK_SyncConfigurations_TimeoutSeconds CHECK (timeoutSeconds > 0),
        CONSTRAINT CK_SyncConfigurations_MaxRetries CHECK (maxRetries >= 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncConfigurations_Name ON SyncConfigurations(name);
    CREATE INDEX IX_SyncConfigurations_SystemType ON SyncConfigurations(systemType);
    CREATE INDEX IX_SyncConfigurations_EntityType ON SyncConfigurations(entityType);
    
    -- Status and scheduling
    CREATE INDEX IX_SyncConfigurations_Enabled ON SyncConfigurations(enabled);
    CREATE INDEX IX_SyncConfigurations_ScheduleType ON SyncConfigurations(scheduleType);
    CREATE INDEX IX_SyncConfigurations_NextRunAt ON SyncConfigurations(nextRunAt ASC);
    CREATE INDEX IX_SyncConfigurations_LastRunAt ON SyncConfigurations(lastRunAt DESC);
    CREATE INDEX IX_SyncConfigurations_LastRunStatus ON SyncConfigurations(lastRunStatus);
    
    -- Audit trail
    CREATE INDEX IX_SyncConfigurations_CreatedBy ON SyncConfigurations(createdBy);
    CREATE INDEX IX_SyncConfigurations_CreatedAt ON SyncConfigurations(createdAt DESC);
    CREATE INDEX IX_SyncConfigurations_DeactivatedAt ON SyncConfigurations(deactivatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncConfigurations_Enabled_ScheduleType ON SyncConfigurations(enabled, scheduleType);
    CREATE INDEX IX_SyncConfigurations_Enabled_NextRunAt ON SyncConfigurations(enabled, nextRunAt ASC);
    CREATE INDEX IX_SyncConfigurations_SystemType_EntityType ON SyncConfigurations(systemType, entityType);
    CREATE INDEX IX_SyncConfigurations_Enabled_LastRunStatus ON SyncConfigurations(enabled, lastRunStatus);

    PRINT 'SyncConfigurations table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncConfigurations table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.46' AND scriptName = '46_create_sync_configurations_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.46',
        'Create SyncConfigurations table for ERP/MES integration',
        '46_create_sync_configurations_table.sql',
        'SUCCESS',
        'SyncConfigurations table supports configuration for external system sync adapters with scheduling, delta detection, and conflict handling'
    );
END
GO


-- =============================================
-- Sync Logs Table
-- =============================================
-- Stores execution history and results of sync operations
-- Provides audit trail for all sync runs

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncLogs')
BEGIN
    CREATE TABLE SyncLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference to Configuration
        configurationId INT NOT NULL,
        
        -- Run Information
        runId NVARCHAR(100) NOT NULL, -- Unique identifier for this sync run
        status NVARCHAR(50) NOT NULL, -- Current status of this run
        
        -- Timing Information
        startedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        completedAt DATETIME2, -- Time when sync completed
        durationSeconds INT, -- Duration in seconds
        
        -- Processing Statistics
        recordsProcessed INT DEFAULT 0, -- Total records processed
        recordsCreated INT DEFAULT 0, -- Records created in target system
        recordsUpdated INT DEFAULT 0, -- Records updated in target system
        recordsSkipped INT DEFAULT 0, -- Records skipped (no changes)
        recordsFailed INT DEFAULT 0, -- Records that failed to process
        recordsConflicted INT DEFAULT 0, -- Records with conflicts
        
        -- Data Range
        fromTimestamp DATETIME2, -- Start of data range synced
        toTimestamp DATETIME2, -- End of data range synced
        fromRecordId INT, -- Starting record ID (for ID-based sync)
        toRecordId INT, -- Ending record ID (for ID-based sync)
        
        -- Result Information
        resultMessage NVARCHAR(MAX), -- Detailed result message
        errorMessage NVARCHAR(MAX), -- Error message if failed
        errorStack NVARCHAR(MAX), -- Error stack trace
        
        -- Performance Metrics
        apiCallsCount INT DEFAULT 0, -- Number of API calls made
        avgResponseTimeMs INT, -- Average API response time in milliseconds
        totalDataSizeBytes BIGINT, -- Total size of data transferred
        
        -- Retry Information
        retryCount INT DEFAULT 0, -- Number of retries attempted
        previousLogId INT NULL, -- Reference to previous log if this is a retry
        
        -- Metadata
        triggeredBy NVARCHAR(50), -- How sync was triggered (scheduled, manual, api)
        triggeredByUserId INT NULL, -- User who triggered manual sync
        serverHostname NVARCHAR(200), -- Server hostname that executed the sync
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncLogs_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncLogs_TriggeredByUser FOREIGN KEY (triggeredByUserId) REFERENCES Users(id),
        CONSTRAINT FK_SyncLogs_PreviousLog FOREIGN KEY (previousLogId) REFERENCES SyncLogs(id),
        
        -- Constraints
        CONSTRAINT CK_SyncLogs_Status CHECK (status IN (
            'queued',
            'in_progress',
            'success',
            'partial',
            'failed',
            'cancelled',
            'timeout'
        )),
        CONSTRAINT CK_SyncLogs_TriggeredBy CHECK (triggeredBy IN (
            'scheduled',
            'manual',
            'api',
            'webhook',
            'retry'
        )),
        CONSTRAINT CK_SyncLogs_DurationSeconds CHECK (durationSeconds IS NULL OR durationSeconds >= 0),
        CONSTRAINT CK_SyncLogs_RecordCounts CHECK (
            recordsProcessed >= 0 AND
            recordsCreated >= 0 AND
            recordsUpdated >= 0 AND
            recordsSkipped >= 0 AND
            recordsFailed >= 0 AND
            recordsConflicted >= 0
        )
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE UNIQUE INDEX IX_SyncLogs_RunId ON SyncLogs(runId);
    CREATE INDEX IX_SyncLogs_ConfigurationId ON SyncLogs(configurationId);
    
    -- Status tracking
    CREATE INDEX IX_SyncLogs_Status ON SyncLogs(status);
    CREATE INDEX IX_SyncLogs_StartedAt ON SyncLogs(startedAt DESC);
    CREATE INDEX IX_SyncLogs_CompletedAt ON SyncLogs(completedAt DESC);
    
    -- Trigger information
    CREATE INDEX IX_SyncLogs_TriggeredBy ON SyncLogs(triggeredBy);
    CREATE INDEX IX_SyncLogs_TriggeredByUserId ON SyncLogs(triggeredByUserId);
    
    -- Retry tracking
    CREATE INDEX IX_SyncLogs_PreviousLogId ON SyncLogs(previousLogId);
    CREATE INDEX IX_SyncLogs_RetryCount ON SyncLogs(retryCount);
    
    -- Audit trail
    CREATE INDEX IX_SyncLogs_CreatedAt ON SyncLogs(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncLogs_ConfigurationId_Status ON SyncLogs(configurationId, status);
    CREATE INDEX IX_SyncLogs_ConfigurationId_StartedAt ON SyncLogs(configurationId, startedAt DESC);
    CREATE INDEX IX_SyncLogs_Status_StartedAt ON SyncLogs(status, startedAt DESC);
    CREATE INDEX IX_SyncLogs_ConfigurationId_Status_StartedAt ON SyncLogs(configurationId, status, startedAt DESC);

    PRINT 'SyncLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncLogs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.47' AND scriptName = '47_create_sync_logs_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.47',
        'Create SyncLogs table for sync execution tracking',
        '47_create_sync_logs_table.sql',
        'SUCCESS',
        'SyncLogs table provides audit trail and execution history for all sync operations with performance metrics'
    );
END
GO



-- =============================================
-- Sync Conflicts Table
-- =============================================
-- Stores conflicts detected during sync operations
-- Supports manual conflict resolution and audit trail

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncConflicts')
BEGIN
    CREATE TABLE SyncConflicts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference Information
        configurationId INT NOT NULL,
        logId INT NOT NULL, -- The sync run that detected this conflict
        
        -- Conflict Identity
        conflictType NVARCHAR(50) NOT NULL, -- Type of conflict
        entityType NVARCHAR(100) NOT NULL, -- Entity type involved
        entityId NVARCHAR(200) NOT NULL, -- ID of the entity in E-QMS
        externalEntityId NVARCHAR(200), -- ID of the entity in external system
        
        -- Conflict Details
        fieldName NVARCHAR(100), -- Specific field with conflict (if field-level)
        sourceValue NVARCHAR(MAX), -- Value from source system
        targetValue NVARCHAR(MAX), -- Value in target system
        sourceTimestamp DATETIME2, -- Last modified timestamp in source
        targetTimestamp DATETIME2, -- Last modified timestamp in target
        
        -- Resolution Information
        status NVARCHAR(50) NOT NULL DEFAULT 'unresolved', -- Resolution status
        resolution NVARCHAR(50), -- How conflict was resolved
        resolvedValue NVARCHAR(MAX), -- The value after resolution
        resolvedAt DATETIME2, -- When conflict was resolved
        resolvedBy INT NULL, -- User who resolved the conflict
        resolutionNotes NVARCHAR(2000), -- Notes about resolution
        
        -- Automatic Resolution Attempt
        autoResolveAttempted BIT DEFAULT 0, -- Whether auto-resolve was attempted
        autoResolveStrategy NVARCHAR(50), -- Strategy used for auto-resolve
        autoResolveSuccess BIT, -- Whether auto-resolve succeeded
        autoResolveReason NVARCHAR(1000), -- Reason for auto-resolve result
        
        -- Priority and Impact
        severity NVARCHAR(50) NOT NULL DEFAULT 'medium', -- Severity level
        impactAssessment NVARCHAR(2000), -- Assessment of business impact
        requiresManualReview BIT DEFAULT 1, -- Whether manual review is needed
        
        -- Additional Context
        contextData NVARCHAR(MAX), -- JSON with additional context
        errorMessage NVARCHAR(MAX), -- Error message if conflict caused failure
        
        -- Audit Trail
        detectedAt DATETIME2 DEFAULT GETDATE(),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncConflicts_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncConflicts_Log FOREIGN KEY (logId) REFERENCES SyncLogs(id) ON DELETE NO ACTION,
        CONSTRAINT FK_SyncConflicts_ResolvedBy FOREIGN KEY (resolvedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SyncConflicts_ConflictType CHECK (conflictType IN (
            'data_mismatch',
            'duplicate_record',
            'missing_reference',
            'validation_error',
            'concurrent_modification',
            'version_conflict',
            'constraint_violation',
            'mapping_error',
            'business_rule_violation',
            'data_integrity'
        )),
        CONSTRAINT CK_SyncConflicts_Status CHECK (status IN (
            'unresolved',
            'resolved',
            'ignored',
            'escalated',
            'auto_resolved'
        )),
        CONSTRAINT CK_SyncConflicts_Resolution CHECK (resolution IS NULL OR resolution IN (
            'source_wins',
            'target_wins',
            'manual_merge',
            'custom_value',
            'ignored',
            'newest_wins',
            'oldest_wins'
        )),
        CONSTRAINT CK_SyncConflicts_Severity CHECK (severity IN (
            'low',
            'medium',
            'high',
            'critical'
        )),
        CONSTRAINT CK_SyncConflicts_AutoResolveStrategy CHECK (autoResolveStrategy IS NULL OR autoResolveStrategy IN (
            'source_wins',
            'target_wins',
            'newest_wins',
            'oldest_wins',
            'none'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncConflicts_ConfigurationId ON SyncConflicts(configurationId);
    CREATE INDEX IX_SyncConflicts_LogId ON SyncConflicts(logId);
    
    -- Entity tracking
    CREATE INDEX IX_SyncConflicts_EntityType ON SyncConflicts(entityType);
    CREATE INDEX IX_SyncConflicts_EntityId ON SyncConflicts(entityId);
    CREATE INDEX IX_SyncConflicts_ExternalEntityId ON SyncConflicts(externalEntityId);
    
    -- Status and resolution tracking
    CREATE INDEX IX_SyncConflicts_Status ON SyncConflicts(status);
    CREATE INDEX IX_SyncConflicts_ConflictType ON SyncConflicts(conflictType);
    CREATE INDEX IX_SyncConflicts_Severity ON SyncConflicts(severity);
    CREATE INDEX IX_SyncConflicts_RequiresManualReview ON SyncConflicts(requiresManualReview);
    CREATE INDEX IX_SyncConflicts_ResolvedBy ON SyncConflicts(resolvedBy);
    CREATE INDEX IX_SyncConflicts_ResolvedAt ON SyncConflicts(resolvedAt DESC);
    
    -- Audit trail
    CREATE INDEX IX_SyncConflicts_DetectedAt ON SyncConflicts(detectedAt DESC);
    CREATE INDEX IX_SyncConflicts_CreatedAt ON SyncConflicts(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncConflicts_ConfigurationId_Status ON SyncConflicts(configurationId, status);
    CREATE INDEX IX_SyncConflicts_Status_Severity ON SyncConflicts(status, severity);
    CREATE INDEX IX_SyncConflicts_EntityType_EntityId ON SyncConflicts(entityType, entityId);
    CREATE INDEX IX_SyncConflicts_Status_RequiresManualReview ON SyncConflicts(status, requiresManualReview);
    CREATE INDEX IX_SyncConflicts_ConfigurationId_DetectedAt ON SyncConflicts(configurationId, detectedAt DESC);

    PRINT 'SyncConflicts table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncConflicts table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.48' AND scriptName = '48_create_sync_conflicts_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.48',
        'Create SyncConflicts table for conflict tracking and resolution',
        '48_create_sync_conflicts_table.sql',
        'SUCCESS',
        'SyncConflicts table tracks conflicts detected during sync operations with support for manual and automatic resolution'
    );
END
GO


-- =============================================
-- Sync Mappings Table
-- =============================================
-- Stores field-level mapping configurations between E-QMS and external systems
-- Supports complex transformation rules and data type conversions

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncMappings')
BEGIN
    CREATE TABLE SyncMappings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference to Configuration
        configurationId INT NOT NULL,
        
        -- Mapping Identity
        mappingName NVARCHAR(200) NOT NULL, -- Name of this mapping
        description NVARCHAR(2000), -- Description of what this mapping does
        
        -- Source Configuration
        sourceField NVARCHAR(200) NOT NULL, -- Source field name/path
        sourceType NVARCHAR(50) NOT NULL, -- Source data type
        sourceFormat NVARCHAR(100), -- Source format (for dates, numbers, etc.)
        
        -- Target Configuration
        targetField NVARCHAR(200) NOT NULL, -- Target field name/path
        targetType NVARCHAR(50) NOT NULL, -- Target data type
        targetFormat NVARCHAR(100), -- Target format (for dates, numbers, etc.)
        
        -- Transformation Rules
        transformationType NVARCHAR(50) NOT NULL DEFAULT 'direct', -- Type of transformation
        transformationRule NVARCHAR(MAX), -- Transformation logic (JS expression, SQL, etc.)
        
        -- Validation Rules
        required BIT DEFAULT 0, -- Whether this field is required
        validationRule NVARCHAR(MAX), -- Validation expression
        validationErrorMessage NVARCHAR(500), -- Error message for validation failures
        
        -- Default Values
        defaultValue NVARCHAR(MAX), -- Default value if source is null/empty
        nullHandling NVARCHAR(50) NOT NULL DEFAULT 'skip', -- How to handle null values
        
        -- Conditional Mapping
        conditionalMapping BIT DEFAULT 0, -- Whether mapping is conditional
        conditionExpression NVARCHAR(MAX), -- Condition for applying this mapping
        alternativeMappingId INT NULL, -- Alternative mapping if condition fails
        
        -- Lookup/Reference Handling
        isLookup BIT DEFAULT 0, -- Whether this is a lookup/reference field
        lookupSourceField NVARCHAR(200), -- Field to use for lookup
        lookupTargetField NVARCHAR(200), -- Field to match in target
        lookupDefaultValue NVARCHAR(MAX), -- Default if lookup fails
        
        -- Multi-Value Handling
        isMultiValue BIT DEFAULT 0, -- Whether field contains multiple values
        multiValueDelimiter NVARCHAR(10), -- Delimiter for multi-value fields
        multiValueHandling NVARCHAR(50), -- How to handle multi-value (split, join, first, last)
        
        -- Status and Configuration
        enabled BIT DEFAULT 1, -- Whether this mapping is active
        priority INT DEFAULT 100, -- Execution priority (lower executes first)
        
        -- Statistics
        successCount INT DEFAULT 0, -- Number of successful transformations
        failureCount INT DEFAULT 0, -- Number of failed transformations
        lastUsedAt DATETIME2, -- Last time this mapping was used
        
        -- Audit Trail
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncMappings_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncMappings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_SyncMappings_AlternativeMapping FOREIGN KEY (alternativeMappingId) REFERENCES SyncMappings(id),
        
        -- Constraints
        CONSTRAINT CK_SyncMappings_SourceType CHECK (sourceType IN (
            'string',
            'number',
            'integer',
            'decimal',
            'boolean',
            'date',
            'datetime',
            'time',
            'json',
            'xml',
            'binary',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_TargetType CHECK (targetType IN (
            'string',
            'number',
            'integer',
            'decimal',
            'boolean',
            'date',
            'datetime',
            'time',
            'json',
            'xml',
            'binary',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_TransformationType CHECK (transformationType IN (
            'direct',
            'expression',
            'lookup',
            'concat',
            'split',
            'format',
            'calculate',
            'custom'
        )),
        CONSTRAINT CK_SyncMappings_NullHandling CHECK (nullHandling IN (
            'skip',
            'default',
            'error',
            'empty_string',
            'null'
        )),
        CONSTRAINT CK_SyncMappings_MultiValueHandling CHECK (multiValueHandling IS NULL OR multiValueHandling IN (
            'split',
            'join',
            'first',
            'last',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_Priority CHECK (priority >= 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncMappings_ConfigurationId ON SyncMappings(configurationId);
    CREATE INDEX IX_SyncMappings_MappingName ON SyncMappings(mappingName);
    
    -- Field lookups
    CREATE INDEX IX_SyncMappings_SourceField ON SyncMappings(sourceField);
    CREATE INDEX IX_SyncMappings_TargetField ON SyncMappings(targetField);
    
    -- Status and configuration
    CREATE INDEX IX_SyncMappings_Enabled ON SyncMappings(enabled);
    CREATE INDEX IX_SyncMappings_Priority ON SyncMappings(priority ASC);
    CREATE INDEX IX_SyncMappings_TransformationType ON SyncMappings(transformationType);
    
    -- Lookup tracking
    CREATE INDEX IX_SyncMappings_IsLookup ON SyncMappings(isLookup);
    CREATE INDEX IX_SyncMappings_ConditionalMapping ON SyncMappings(conditionalMapping);
    CREATE INDEX IX_SyncMappings_AlternativeMappingId ON SyncMappings(alternativeMappingId);
    
    -- Audit trail
    CREATE INDEX IX_SyncMappings_CreatedBy ON SyncMappings(createdBy);
    CREATE INDEX IX_SyncMappings_CreatedAt ON SyncMappings(createdAt DESC);
    CREATE INDEX IX_SyncMappings_LastUsedAt ON SyncMappings(lastUsedAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncMappings_ConfigurationId_Enabled ON SyncMappings(configurationId, enabled);
    CREATE INDEX IX_SyncMappings_ConfigurationId_Priority ON SyncMappings(configurationId, priority ASC);
    CREATE INDEX IX_SyncMappings_Enabled_Priority ON SyncMappings(enabled, priority ASC);

    PRINT 'SyncMappings table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncMappings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.49' AND scriptName = '49_create_sync_mappings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.49',
        'Create SyncMappings table for field-level mapping configurations',
        '49_create_sync_mappings_table.sql',
        'SUCCESS',
        'SyncMappings table supports complex field transformations, lookups, and validation rules for data synchronization'
    );
END
GO


-- =============================================
-- Webhook Subscriptions Table
-- =============================================
-- Stores webhook subscription configurations for external systems
-- Supports event-driven notifications for NCR and CAPA events

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WebhookSubscriptions')
BEGIN
    CREATE TABLE WebhookSubscriptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Subscription Identity
        name NVARCHAR(200) NOT NULL, -- Friendly name for the subscription
        url NVARCHAR(2000) NOT NULL, -- Target webhook URL
        secret NVARCHAR(500) NOT NULL, -- Secret for HMAC signature verification
        
        -- Event Configuration
        events NVARCHAR(MAX) NOT NULL, -- JSON array of subscribed events (e.g., ["ncr.created", "ncr.updated", "capa.closed"])
        
        -- Status and Settings
        active BIT NOT NULL DEFAULT 1, -- Whether the subscription is active
        retryEnabled BIT NOT NULL DEFAULT 1, -- Whether to retry failed deliveries
        maxRetries INT NOT NULL DEFAULT 3, -- Maximum number of retry attempts
        retryDelaySeconds INT NOT NULL DEFAULT 60, -- Delay between retries in seconds
        
        -- Headers (optional custom headers)
        customHeaders NVARCHAR(MAX), -- JSON object of custom HTTP headers
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the subscription
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        lastTriggeredAt DATETIME2, -- Last time a webhook was triggered
        
        -- Foreign Key Constraints
        CONSTRAINT FK_WebhookSubscriptions_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
    );

    -- Indexes for Performance
    CREATE INDEX IX_WebhookSubscriptions_Active ON WebhookSubscriptions(active);
    CREATE INDEX IX_WebhookSubscriptions_CreatedBy ON WebhookSubscriptions(createdBy);
    CREATE INDEX IX_WebhookSubscriptions_LastTriggeredAt ON WebhookSubscriptions(lastTriggeredAt);

    PRINT 'WebhookSubscriptions table created successfully';
END
ELSE
BEGIN
    PRINT 'WebhookSubscriptions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.50' AND scriptName = '50_create_webhook_subscriptions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.50',
        'Create WebhookSubscriptions table for webhook event subscriptions',
        '50_create_webhook_subscriptions_table.sql',
        'SUCCESS',
        'Supports event-driven notifications for NCR and CAPA lifecycle events'
    );
END
GO


-- =============================================
-- Webhook Deliveries Table
-- =============================================
-- Stores webhook delivery logs and retry information
-- Supports audit trail and debugging of webhook deliveries

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WebhookDeliveries')
BEGIN
    CREATE TABLE WebhookDeliveries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationship
        subscriptionId INT NOT NULL, -- Reference to webhook subscription
        
        -- Event Information
        eventType NVARCHAR(100) NOT NULL, -- Type of event (e.g., "ncr.created")
        entityType NVARCHAR(50) NOT NULL, -- Entity type (NCR or CAPA)
        entityId INT NOT NULL, -- ID of the entity (NCR/CAPA)
        
        -- Request Details
        requestUrl NVARCHAR(2000) NOT NULL, -- Target URL at time of delivery
        requestPayload NVARCHAR(MAX) NOT NULL, -- JSON payload sent
        requestHeaders NVARCHAR(MAX), -- JSON object of request headers
        
        -- Response Details
        responseStatus INT, -- HTTP response status code
        responseBody NVARCHAR(MAX), -- Response body received
        responseTime INT, -- Response time in milliseconds
        
        -- Retry Information
        attempt INT NOT NULL DEFAULT 1, -- Attempt number (1 = first attempt)
        maxAttempts INT NOT NULL DEFAULT 3, -- Maximum attempts allowed
        nextRetryAt DATETIME2, -- Scheduled time for next retry
        
        -- Status
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying
        errorMessage NVARCHAR(MAX), -- Error message if failed
        
        -- Timestamps
        createdAt DATETIME2 DEFAULT GETDATE(),
        deliveredAt DATETIME2, -- Time of successful delivery
        
        -- Foreign Key Constraints
        CONSTRAINT FK_WebhookDeliveries_Subscription FOREIGN KEY (subscriptionId) REFERENCES WebhookSubscriptions(id) ON DELETE CASCADE,
        
        -- Constraints
        CONSTRAINT CK_WebhookDeliveries_Status CHECK (status IN (
            'pending',
            'success',
            'failed',
            'retrying'
        )),
        CONSTRAINT CK_WebhookDeliveries_EntityType CHECK (entityType IN (
            'NCR',
            'CAPA'
        ))
    );

    -- Indexes for Performance
    CREATE INDEX IX_WebhookDeliveries_SubscriptionId ON WebhookDeliveries(subscriptionId);
    CREATE INDEX IX_WebhookDeliveries_Status ON WebhookDeliveries(status);
    CREATE INDEX IX_WebhookDeliveries_EventType ON WebhookDeliveries(eventType);
    CREATE INDEX IX_WebhookDeliveries_EntityType_EntityId ON WebhookDeliveries(entityType, entityId);
    CREATE INDEX IX_WebhookDeliveries_NextRetryAt ON WebhookDeliveries(nextRetryAt) WHERE status = 'retrying';
    CREATE INDEX IX_WebhookDeliveries_CreatedAt ON WebhookDeliveries(createdAt);
    CREATE INDEX IX_WebhookDeliveries_Status_NextRetryAt ON WebhookDeliveries(status, nextRetryAt);

    PRINT 'WebhookDeliveries table created successfully';
END
ELSE
BEGIN
    PRINT 'WebhookDeliveries table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.51' AND scriptName = '51_create_webhook_deliveries_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.51',
        'Create WebhookDeliveries table for webhook delivery logs',
        '51_create_webhook_deliveries_table.sql',
        'SUCCESS',
        'Tracks all webhook delivery attempts with retry information and response details'
    );
END
GO


-- Create company_branding table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[company_branding]') AND type in (N'U'))
BEGIN
    CREATE TABLE company_branding (
        id INT PRIMARY KEY IDENTITY(1,1),
        company_name NVARCHAR(200) NOT NULL,
        company_logo_url NVARCHAR(500),
        company_logo_path NVARCHAR(500),
        primary_color NVARCHAR(20) DEFAULT '#1976d2',
        secondary_color NVARCHAR(20) DEFAULT '#dc004e',
        company_website NVARCHAR(500),
        company_email NVARCHAR(200),
        company_phone NVARCHAR(50),
        company_address NVARCHAR(500),
        company_city NVARCHAR(100),
        company_state NVARCHAR(100),
        company_postal_code NVARCHAR(20),
        company_country NVARCHAR(100),
        tagline NVARCHAR(200),
        description NVARCHAR(1000),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    PRINT 'Table company_branding created successfully';
END
ELSE
BEGIN
    PRINT 'Table company_branding already exists';
END
GO

-- Insert default company branding record (only one record should exist)
IF NOT EXISTS (SELECT * FROM company_branding WHERE id = 1)
BEGIN
    INSERT INTO company_branding (
        company_name,
        primary_color,
        secondary_color,
        description
    )
    VALUES (
        'E-QMS',
        '#1976d2',
        '#dc004e',
        'Quality Management System'
    );

    PRINT 'Default company branding record created successfully';
END
ELSE
BEGIN
    PRINT 'Default company branding record already exists';
END
GO


-- =============================================
-- DocumentContents Table
-- =============================================
-- Stores rich text content for documents (HTML or ProseMirror JSON)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentContents')
BEGIN
    CREATE TABLE DocumentContents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        documentId INT NOT NULL,
        content NVARCHAR(MAX) NOT NULL, -- HTML or JSON string
        contentFormat NVARCHAR(50) NOT NULL DEFAULT 'prosemirror', -- 'html' | 'prosemirror'
        updatedBy INT NOT NULL,
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_DocumentContents_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentContents_User FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );

    CREATE UNIQUE INDEX UX_DocumentContents_DocumentId ON DocumentContents(documentId);
    CREATE INDEX IX_DocumentContents_UpdatedAt ON DocumentContents(updatedAt);

    PRINT 'DocumentContents table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentContents table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.52' AND scriptName = '52_create_document_contents_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.52',
        'Create DocumentContents table to store rich text content and support autosave',
        '52_CreateDocumentContentsTable.sql',
        'SUCCESS',
        'Stores editor content as HTML or ProseMirror JSON; linked to Documents'
    );
END
GO

-- =============================================
-- Alter Processes: add hierarchy and type
-- =============================================

IF COL_LENGTH('Processes', 'processType') IS NULL
BEGIN
    ALTER TABLE Processes ADD processType NVARCHAR(20) NULL; -- 'main' | 'sub' | 'support'
    PRINT 'Added processType to Processes';
END
GO

IF COL_LENGTH('Processes', 'parentProcessId') IS NULL
BEGIN
    ALTER TABLE Processes ADD parentProcessId INT NULL;
    ALTER TABLE Processes ADD CONSTRAINT FK_Processes_Parent FOREIGN KEY (parentProcessId) REFERENCES Processes(id);
    PRINT 'Added parentProcessId to Processes';
END
GO

-- Optional flowchart storage (SVG) for process detail visualization
IF COL_LENGTH('Processes', 'flowchartSvg') IS NULL
BEGIN
    ALTER TABLE Processes ADD flowchartSvg NVARCHAR(MAX) NULL;
    PRINT 'Added flowchartSvg to Processes';
END
GO

-- Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_ProcessType' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_ProcessType ON Processes(processType);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_Parent' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_Parent ON Processes(parentProcessId);
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.53' AND scriptName = '45_alter_processes_hierarchy.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.53',
        'Add processType, parentProcessId, and flowchartSvg to Processes',
        '45_alter_processes_hierarchy.sql',
        'SUCCESS',
        'Supports Main/Sub/Support processes and simple flowchart storage'
    );
END
GO

-- =============================================
-- ProcessDocuments Link Table
-- =============================================
-- Many-to-many mapping between Processes and Documents

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProcessDocuments')
BEGIN
    CREATE TABLE ProcessDocuments (
        processId INT NOT NULL,
        documentId INT NOT NULL,
        linkedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        linkedBy INT NULL,
        CONSTRAINT PK_ProcessDocuments PRIMARY KEY (processId, documentId),
        CONSTRAINT FK_ProcessDocuments_Process FOREIGN KEY (processId) REFERENCES Processes(id) ON DELETE CASCADE,
        CONSTRAINT FK_ProcessDocuments_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_ProcessDocuments_User FOREIGN KEY (linkedBy) REFERENCES Users(id)
    );

    CREATE INDEX IX_ProcessDocuments_Document ON ProcessDocuments(documentId);
    CREATE INDEX IX_ProcessDocuments_Process ON ProcessDocuments(processId);

    PRINT 'ProcessDocuments table created successfully';
END
ELSE
BEGIN
    PRINT 'ProcessDocuments table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.54' AND scriptName = '54_create_process_documents_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.54',
        'Create ProcessDocuments link table for filtering documents by process',
        '54_create_process_documents_table.sql',
        'SUCCESS',
        'Supports document library filtering by process and subprocess'
    );
END
GO


-- =============================================
-- Add displayOrder to Processes table
-- =============================================
-- Enables custom ordering of main, support, and sub processes

IF COL_LENGTH('Processes', 'displayOrder') IS NULL
BEGIN
    ALTER TABLE Processes ADD displayOrder INT NULL;
    PRINT 'Added displayOrder to Processes';
END
GO

-- Set default displayOrder based on existing id (for existing records)
IF EXISTS (SELECT * FROM Processes WHERE displayOrder IS NULL)
BEGIN
    UPDATE Processes SET displayOrder = id WHERE displayOrder IS NULL;
    PRINT 'Set default displayOrder values for existing processes';
END
GO

-- Create index for efficient ordering queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_DisplayOrder' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_DisplayOrder ON Processes(displayOrder);
    PRINT 'Created index IX_Processes_DisplayOrder';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.55' AND scriptName = '55_add_process_display_order.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.55',
        'Add displayOrder column to Processes for custom ordering',
        '55_add_process_display_order.sql',
        'SUCCESS',
        'Allows manual reordering of main, support, and sub processes in the UI'
    );
END
GO


-- =============================================
-- Drop unique constraint(s)/index on Processes.name
-- =============================================

DECLARE @schema sysname = 'dbo';
DECLARE @table sysname = 'Processes';
DECLARE @full nvarchar(300) = QUOTENAME(@schema) + '.' + QUOTENAME(@table);

-- Drop explicit filtered unique index if exists
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Processes_Name' AND object_id = OBJECT_ID(@full))
BEGIN
    PRINT 'Dropping index IX_Processes_Name...';
    EXEC ('DROP INDEX IX_Processes_Name ON ' + @full + ';');
END

-- Drop any unique constraint that only targets the [name] column
;WITH uq AS (
  SELECT kc.name AS constraint_name
  FROM sys.key_constraints kc
  JOIN sys.tables t ON t.object_id = kc.parent_object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE kc.[type] = 'UQ' AND t.[name] = @table AND s.[name] = @schema
), cols AS (
  SELECT i.name AS index_name,
         COUNT(*) AS col_count,
         SUM(CASE WHEN c.name = 'name' THEN 1 ELSE 0 END) AS name_count
  FROM sys.indexes i
  JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID(@full) AND i.is_unique = 1
  GROUP BY i.name
)
SELECT * INTO #toDrop FROM (
  SELECT i.name
  FROM sys.indexes i
  JOIN cols ON cols.index_name = i.name
  WHERE i.object_id = OBJECT_ID(@full)
    AND i.is_unique = 1
    AND cols.col_count = 1 AND cols.name_count = 1
) x;

 DECLARE @sql NVARCHAR(MAX);
 DECLARE @idx NVARCHAR(200);


WHILE EXISTS (SELECT 1 FROM #toDrop)
BEGIN
  SELECT TOP 1 @idx = name FROM #toDrop;
  PRINT 'Dropping unique index/constraint ' + @idx + ' on Processes.name...';

  BEGIN TRY
    SET @sql = N'ALTER TABLE ' + @full + ' DROP CONSTRAINT ' + QUOTENAME(@idx) + ';';
    EXEC(@sql);
  END TRY
  BEGIN CATCH
    SET @sql = N'DROP INDEX ' + QUOTENAME(@idx) + ' ON ' + @full + ';';
    EXEC(@sql);
  END CATCH

  DELETE FROM #toDrop WHERE name = @idx;
END

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.57' AND scriptName = '57_drop_unique_on_processes_name.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.57',
        'Remove unique constraint/index on Processes.name',
        '57_drop_unique_on_processes_name.sql',
        'SUCCESS',
        'Allows duplicate process names; code remains unique'
    );
END
GO