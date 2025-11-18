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
