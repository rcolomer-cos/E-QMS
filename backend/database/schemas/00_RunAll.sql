-- =============================================
-- Master Script - Run All Schema Scripts
-- =============================================
-- This script runs all schema creation scripts in order
-- Run this script in SQL Server Management Studio (SSMS)
-- =============================================
-- Prerequisites:
-- 1. Create database: CREATE DATABASE eqms;
-- 2. USE eqms;
-- 3. Execute this script
-- =============================================

USE eqms;
GO

PRINT '=================================================';
PRINT 'E-QMS Database Schema Initialization';
PRINT 'Started at: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=================================================';
GO

-- Step 1: Database Version Table
PRINT '';
PRINT 'Step 1: Creating DatabaseVersion table...';
:r .\01_DatabaseVersion.sql
GO

-- Step 2: Roles Table
PRINT '';
PRINT 'Step 2: Creating Roles table...';
:r .\02_Roles.sql
GO

-- Step 3: Users Table
PRINT '';
PRINT 'Step 3: Creating Users table...';
:r .\03_Users.sql
GO

-- Step 4: UserRoles Junction Table
PRINT '';
PRINT 'Step 4: Creating UserRoles table...';
:r .\04_UserRoles.sql
GO

PRINT '';
PRINT '=================================================';
PRINT 'Database schema initialization completed!';
PRINT 'Completed at: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=================================================';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Run application-specific table creation scripts';
PRINT '2. Configure application connection string';
PRINT '3. Start the application';
GO
