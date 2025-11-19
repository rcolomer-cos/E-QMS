-- Migration: Add phone field to Users table
-- Date: 2025-11-19
-- Description: Add optional phone field to Users table for contact information

USE EQMS;
GO

-- Check if phone column already exists
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' 
    AND COLUMN_NAME = 'phone'
)
BEGIN
    ALTER TABLE Users
    ADD phone NVARCHAR(50) NULL;
    
    PRINT '✓ Phone column added to Users table';
END
ELSE
BEGIN
    PRINT '○ Phone column already exists in Users table';
END
GO
