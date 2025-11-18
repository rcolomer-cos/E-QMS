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
