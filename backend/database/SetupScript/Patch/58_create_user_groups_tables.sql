/*
    Patch 58: Create User Groups Tables
    Description: Add support for user groups for document access control and notifications
    Author: Copilot
    Date: 2025-11-19
*/

USE [eqms];
GO

-- Create Groups table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Groups')
BEGIN
    CREATE TABLE Groups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        active BIT DEFAULT 1,
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Groups_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
    );

    -- Indexes for Performance
    CREATE INDEX IX_Groups_Active ON Groups(active);
    CREATE INDEX IX_Groups_Name ON Groups(name);

    PRINT '✓ Groups table created';
END
ELSE
BEGIN
    PRINT '○ Groups table already exists';
END
GO

-- Create UserGroups junction table (many-to-many between Users and Groups)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGroups')
BEGIN
    CREATE TABLE UserGroups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        groupId INT NOT NULL,
        addedBy INT NOT NULL,
        addedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_UserGroups_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserGroups_Group FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserGroups_AddedBy FOREIGN KEY (addedBy) REFERENCES Users(id),
        
        -- Ensure unique user-group combinations
        CONSTRAINT UQ_UserGroups_UserGroup UNIQUE (userId, groupId)
    );

    -- Indexes for Performance
    CREATE INDEX IX_UserGroups_UserId ON UserGroups(userId);
    CREATE INDEX IX_UserGroups_GroupId ON UserGroups(groupId);

    PRINT '✓ UserGroups table created';
END
ELSE
BEGIN
    PRINT '○ UserGroups table already exists';
END
GO

-- Create DocumentGroups junction table (many-to-many between Documents and Groups)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentGroups')
BEGIN
    CREATE TABLE DocumentGroups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        documentId INT NOT NULL,
        groupId INT NOT NULL,
        assignedBy INT NOT NULL,
        assignedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_DocumentGroups_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentGroups_Group FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentGroups_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        
        -- Ensure unique document-group combinations
        CONSTRAINT UQ_DocumentGroups_DocumentGroup UNIQUE (documentId, groupId)
    );

    -- Indexes for Performance
    CREATE INDEX IX_DocumentGroups_DocumentId ON DocumentGroups(documentId);
    CREATE INDEX IX_DocumentGroups_GroupId ON DocumentGroups(groupId);

    PRINT '✓ DocumentGroups table created';
END
ELSE
BEGIN
    PRINT '○ DocumentGroups table already exists';
END
GO

PRINT 'Patch 58 completed successfully: User Groups tables created';
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.58' AND scriptName = '58_create_user_groups_tables.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.58',
        'Add document compliance acknowledgement support',
        '58_create_user_groups_tables.sql',
        'SUCCESS',
        'Added complianceRequired field to Documents table and created DocumentComplianceAcknowledgements table for tracking user read & understand confirmations'
    );
END
GO