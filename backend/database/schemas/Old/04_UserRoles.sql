-- =============================================
-- UserRoles Junction Table
-- =============================================
-- Many-to-many relationship between Users and Roles
-- Allows users to have multiple roles
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE UserRoles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        roleId INT NOT NULL,
        assignedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        assignedBy INT NULL,
        CONSTRAINT FK_UserRoles_UserId FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_RoleId FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_UserRoles_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_UserRoles_UserRole UNIQUE (userId, roleId)
    );

    -- Create indexes for better query performance
    CREATE INDEX IX_UserRoles_UserId ON UserRoles(userId);
    CREATE INDEX IX_UserRoles_RoleId ON UserRoles(roleId);

    PRINT 'UserRoles table created successfully';
END
ELSE
BEGIN
    PRINT 'UserRoles table already exists';
END
GO

-- Update database version
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName)
    VALUES ('1.0.3', 'UserRoles junction table creation', '04_UserRoles.sql');
END
GO
