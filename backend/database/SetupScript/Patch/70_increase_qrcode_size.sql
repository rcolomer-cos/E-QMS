-- =============================================
-- Patch 70: Increase QR Code Column Size
-- =============================================
-- Description: Increases qrCode column size from NVARCHAR(500) to NVARCHAR(MAX)
-- to accommodate base64-encoded QR code images which can exceed 500 characters.
-- Version: 1.0.70
-- Author: E-QMS System
-- Date: 2025-11-24
-- =============================================

USE eqms;
GO

PRINT '======================================';
PRINT 'Patch 70: Increasing QR Code Column Size';
PRINT '======================================';
PRINT '';

-- =============================================
-- Increase qrCode Column Size in Equipment Table
-- =============================================

-- Check current column size
DECLARE @currentType NVARCHAR(128);
SELECT @currentType = DATA_TYPE + '(' + 
    CASE 
        WHEN CHARACTER_MAXIMUM_LENGTH = -1 THEN 'MAX'
        ELSE CAST(CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(10))
    END + ')'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Equipment' AND COLUMN_NAME = 'qrCode';

IF @currentType LIKE '%500%' OR @currentType NOT LIKE '%MAX%'
BEGIN
    ALTER TABLE Equipment
    ALTER COLUMN qrCode NVARCHAR(MAX) NULL;
    
    PRINT '✓ qrCode column increased to NVARCHAR(MAX)';
END
ELSE
BEGIN
    PRINT '○ qrCode column already NVARCHAR(MAX)';
END
GO

-- =============================================
-- Record Database Version
-- =============================================

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.70' AND scriptName = '70_increase_qrcode_size.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.70',
        'Increase qrCode column size from NVARCHAR(500) to NVARCHAR(MAX)',
        '70_increase_qrcode_size.sql',
        'SUCCESS',
        'Base64-encoded QR code images require more than 500 characters. NVARCHAR(MAX) allows up to 2GB of data.'
    );
    PRINT '✓ Database version 1.0.70 recorded';
END
ELSE
BEGIN
    PRINT '○ Database version 1.0.70 already recorded';
END
GO

PRINT '';
PRINT '======================================';
PRINT 'Patch 70: Completed Successfully';
PRINT '======================================';
