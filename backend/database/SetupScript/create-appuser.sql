-- =============================================
-- Create Application User for E-QMS
-- =============================================
-- Run this script as SA or a user with sufficient privileges
-- This creates the login and database user for the application
-- =============================================

USE master;
GO

-- Create the login if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'appuser')
BEGIN
    CREATE LOGIN appuser WITH PASSWORD = 'robotic_NATURE_pearls';
    PRINT '✓ Login appuser created';
END
ELSE
BEGIN
    PRINT '○ Login appuser already exists';
END
GO

-- Switch to the EQMS database
USE EQMS;
GO

-- Create the database user if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'appuser')
BEGIN
    CREATE USER appuser FOR LOGIN appuser;
    PRINT '✓ User appuser created in EQMS database';
END
ELSE
BEGIN
    PRINT '○ User appuser already exists in EQMS database';
END
GO

-- Grant necessary permissions
-- db_datareader: allows reading all data from all tables
-- db_datawriter: allows inserting, updating, and deleting data from all tables
ALTER ROLE db_datareader ADD MEMBER appuser;
ALTER ROLE db_datawriter ADD MEMBER appuser;

-- Grant EXECUTE permission on all stored procedures
GRANT EXECUTE TO appuser;

-- Grant VIEW DEFINITION to allow viewing object metadata
GRANT VIEW DEFINITION TO appuser;

PRINT '✓ Permissions granted to appuser';
PRINT '';
PRINT 'Application user setup complete!';
PRINT 'Login: appuser';
PRINT 'Roles: db_datareader, db_datawriter, EXECUTE, VIEW DEFINITION';
GO
