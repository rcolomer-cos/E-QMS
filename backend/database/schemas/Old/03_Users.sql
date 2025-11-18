-- =============================================
-- Users Table
-- =============================================
-- Stores user accounts for authentication
-- Email is used as the login username
-- Users can have multiple roles via UserRoles junction table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        firstName NVARCHAR(50) NOT NULL,
        lastName NVARCHAR(50) NOT NULL,
        department NVARCHAR(100),
        active BIT DEFAULT 1,
        lastLoginAt DATETIME2,
        passwordChangedAt DATETIME2,
        mustChangePassword BIT DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        createdBy INT NULL,
        CONSTRAINT CK_Users_Email CHECK (email LIKE '%@%')
    );

    -- Create indexes for better performance
    CREATE INDEX IX_Users_Email ON Users(email) WHERE active = 1;
    CREATE INDEX IX_Users_Active ON Users(active);
    CREATE INDEX IX_Users_Department ON Users(department) WHERE active = 1;

    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists';
END
GO

-- Update database version
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName)
    VALUES ('1.0.2', 'Users table creation', '03_Users.sql');
END
GO
