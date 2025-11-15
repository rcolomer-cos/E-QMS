-- =============================================
-- Roles Table
-- =============================================
-- Defines system roles with permissions
-- Users can have multiple roles via UserRoles junction table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        displayName NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        isSuperUser BIT DEFAULT 0,
        permissions NVARCHAR(MAX), -- JSON array of permission strings
        active BIT DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_Roles_Name CHECK (name IN ('superuser', 'admin', 'manager', 'auditor', 'user', 'viewer'))
    );

    -- Create index for faster lookups
    CREATE INDEX IX_Roles_Name ON Roles(name) WHERE active = 1;
    CREATE INDEX IX_Roles_Active ON Roles(active);

    -- Insert default roles
    INSERT INTO Roles (name, displayName, description, isSuperUser, permissions) VALUES
    ('superuser', 'Super User', 'Full system access including user elevation to superuser', 1, 
     '["all"]'),
    ('admin', 'Administrator', 'Full administrative access except superuser elevation', 0,
     '["user.manage", "role.assign", "document.approve", "audit.manage", "ncr.manage", "capa.manage", "equipment.manage", "training.manage", "settings.manage"]'),
    ('manager', 'Manager', 'Quality management and approval authority', 0,
     '["document.approve", "audit.conduct", "ncr.create", "capa.create", "equipment.manage", "training.manage", "reports.view"]'),
    ('auditor', 'Auditor', 'Conduct audits and create NCRs', 0,
     '["audit.conduct", "audit.view", "ncr.create", "ncr.view", "document.view", "reports.view"]'),
    ('user', 'User', 'Create and edit documents, view reports', 0,
     '["document.create", "document.edit", "document.view", "ncr.view", "audit.view", "equipment.view", "training.view", "reports.view"]'),
    ('viewer', 'Viewer', 'Read-only access to system', 0,
     '["document.view", "audit.view", "ncr.view", "equipment.view", "training.view", "reports.view"]');

    PRINT 'Roles table created and default roles inserted successfully';
END
ELSE
BEGIN
    PRINT 'Roles table already exists';
END
GO

-- Update database version
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName)
    VALUES ('1.0.1', 'Roles table creation', '02_Roles.sql');
END
GO
