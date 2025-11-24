-- =============================================
-- Patch 69: Add Equipment Image Support
-- =============================================
-- Description: Adds imagePath column to Equipment table to support equipment image uploads.
-- Images are displayed in circular format in the UI and stored in uploads/equipment/ directory.
-- Version: 1.0.69
-- Author: E-QMS System
-- Date: 2025-11-24
-- =============================================

USE eqms;
GO

PRINT '======================================';
PRINT 'Patch 69: Adding Equipment Image Support';
PRINT '======================================';
PRINT '';

-- =============================================
-- Add imagePath Column to Equipment Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Equipment') AND name = 'imagePath')
BEGIN
    ALTER TABLE Equipment
    ADD imagePath NVARCHAR(500) NULL;
    
    PRINT '✓ imagePath column added to Equipment table';
END
ELSE
BEGIN
    PRINT '○ imagePath column already exists in Equipment table';
END
GO

-- =============================================
-- Record Database Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.69' AND scriptName = '69_add_equipment_image.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.69',
        'Add imagePath column to Equipment table for image upload support',
        '69_add_equipment_image.sql',
        'SUCCESS',
        'Supports equipment image uploads with circular display. Images stored in uploads/equipment/ directory. Max 5MB, formats: JPEG, PNG, GIF, WebP'
    );
    PRINT '✓ Database version 1.0.69 recorded';
END
ELSE
BEGIN
    PRINT '○ Database version 1.0.69 already recorded';
END
GO

PRINT '';
PRINT '======================================';
PRINT 'Patch 69: Completed Successfully';
PRINT '======================================';
