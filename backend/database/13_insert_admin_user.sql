-- =============================================
-- Insert Admin User Script
-- =============================================
-- This script creates a default admin user for initial system setup
-- 
-- IMPORTANT SECURITY NOTES:
--   1. This script should ONLY be used for initial setup or development
--   2. Change the default password immediately after first login
--   3. Delete or secure this file after use in production
--   4. The password is hashed using bcrypt (bcrypt rounds: 10)
--
-- Default Credentials:
--   Email: admin@eqms.local
--   Password: Admin@123
--
-- User Details:
--   Role: admin (Administrative access)
--   Name: System Administrator
--   Department: Quality Assurance
--   Must Change Password: Yes (enforced on first login)
--
-- Usage:
--   1. Ensure tables are created (run scripts 01-12 first)
--   2. Execute this script in SSMS or Azure Data Studio
--   3. Login with the credentials above
--   4. Change password immediately
--
-- =============================================

USE eqms;
GO

PRINT '========================================';
PRINT 'Insert Admin User Script';
PRINT '========================================';
PRINT '';

-- =============================================
-- Check Prerequisites
-- =============================================
PRINT 'Checking prerequisites...';

-- Verify required tables exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    PRINT 'ERROR: Users table does not exist. Please run 03_create_users_table.sql first.';
    RAISERROR('Required table Users not found', 16, 1);
    RETURN;
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    PRINT 'ERROR: Roles table does not exist. Please run 02_create_roles_table.sql first.';
    RAISERROR('Required table Roles not found', 16, 1);
    RETURN;
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    PRINT 'ERROR: UserRoles table does not exist. Please run 04_create_user_roles_table.sql first.';
    RAISERROR('Required table UserRoles not found', 16, 1);
    RETURN;
END

PRINT '✓ All required tables exist';
PRINT '';

-- =============================================
-- Insert Admin User
-- =============================================
PRINT 'Creating admin user...';

-- Check if admin user already exists
IF EXISTS (SELECT * FROM Users WHERE email = 'admin@eqms.local')
BEGIN
    PRINT '⚠ Admin user (admin@eqms.local) already exists. Skipping user creation.';
END
ELSE
BEGIN
    -- Insert admin user
    -- Password: Admin@123 (bcrypt hash with 10 rounds)
    -- IMPORTANT: User must change this password on first login
    INSERT INTO Users (
        email,
        password,
        firstName,
        lastName,
        department,
        active,
        mustChangePassword,
        passwordChangedAt,
        createdBy,
        createdAt,
        updatedAt
    )
    VALUES (
        'admin@eqms.local',
        '$2b$10$QvcXg43dqCeqDLNXjwztz.W/bY72AROuWYIbx2qDsjid9Z43vcD1a', -- Admin@123
        'System',
        'Administrator',
        'Quality Assurance',
        1, -- active
        1, -- mustChangePassword - forces password change on first login
        GETDATE(), -- passwordChangedAt
        NULL, -- createdBy (NULL for initial system user)
        GETDATE(), -- createdAt
        GETDATE()  -- updatedAt
    );

    DECLARE @AdminUserId INT = SCOPE_IDENTITY();
    
    PRINT '✓ Admin user created successfully';
    PRINT '  - User ID: ' + CAST(@AdminUserId AS NVARCHAR(10));
    PRINT '  - Email: admin@eqms.local';
    PRINT '  - Name: System Administrator';
    PRINT '  - Department: Quality Assurance';
    PRINT '';

    -- =============================================
    -- Assign Admin Role
    -- =============================================
    PRINT 'Assigning admin role...';

    -- Get admin role ID
    DECLARE @AdminRoleId INT = (SELECT id FROM Roles WHERE name = 'admin');

    IF @AdminRoleId IS NULL
    BEGIN
        PRINT 'ERROR: Admin role not found in Roles table.';
        RAISERROR('Admin role not found', 16, 1);
        RETURN;
    END

    -- Check if role assignment already exists
    IF EXISTS (SELECT * FROM UserRoles WHERE userId = @AdminUserId AND roleId = @AdminRoleId)
    BEGIN
        PRINT '⚠ Admin role already assigned to this user.';
    END
    ELSE
    BEGIN
        -- Assign admin role to user
        INSERT INTO UserRoles (
            userId,
            roleId,
            assignedBy,
            assignedAt,
            active,
            notes
        )
        VALUES (
            @AdminUserId,
            @AdminRoleId,
            NULL, -- assignedBy (NULL for initial system setup)
            GETDATE(),
            1, -- active
            'Initial admin user - created by setup script'
        );

        PRINT '✓ Admin role assigned successfully';
        PRINT '  - Role: admin (Administrator)';
        PRINT '  - Permission Level: 90';
        PRINT '';
    END

    PRINT '========================================';
    PRINT 'Admin User Setup Complete';
    PRINT '========================================';
    PRINT '';
    PRINT 'Login Credentials:';
    PRINT '  Email: admin@eqms.local';
    PRINT '  Password: Admin@123';
    PRINT '';
    PRINT '⚠ SECURITY WARNING:';
    PRINT '  1. Change the default password immediately after first login';
    PRINT '  2. The system will enforce a password change on first login';
    PRINT '  3. Delete or secure this script file after use in production';
    PRINT '  4. This user has administrative privileges';
    PRINT '';
    PRINT 'Next Steps:';
    PRINT '  1. Start the E-QMS application';
    PRINT '  2. Login with the credentials above';
    PRINT '  3. Change your password when prompted';
    PRINT '  4. Create additional users as needed';
    PRINT '  5. Optionally run 12_seed_example_data.sql for sample data';
    PRINT '========================================';
END
GO

-- =============================================
-- Record Schema Version
-- =============================================
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.4' AND scriptName = '13_insert_admin_user.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.4',
        'Insert default admin user for initial setup',
        '13_insert_admin_user.sql',
        'SUCCESS',
        'Created admin@eqms.local with admin role. Password must be changed on first login.'
    );
END
GO
