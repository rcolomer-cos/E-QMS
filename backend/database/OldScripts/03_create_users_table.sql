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
