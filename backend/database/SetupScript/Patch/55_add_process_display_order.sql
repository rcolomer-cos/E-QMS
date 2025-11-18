-- =============================================
-- Add displayOrder to Processes table
-- =============================================
-- Enables custom ordering of main, support, and sub processes

IF COL_LENGTH('Processes', 'displayOrder') IS NULL
BEGIN
    ALTER TABLE Processes ADD displayOrder INT NULL;
    PRINT 'Added displayOrder to Processes';
END
GO

-- Set default displayOrder based on existing id (for existing records)
IF EXISTS (SELECT * FROM Processes WHERE displayOrder IS NULL)
BEGIN
    UPDATE Processes SET displayOrder = id WHERE displayOrder IS NULL;
    PRINT 'Set default displayOrder values for existing processes';
END
GO

-- Create index for efficient ordering queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_DisplayOrder' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_DisplayOrder ON Processes(displayOrder);
    PRINT 'Created index IX_Processes_DisplayOrder';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.55' AND scriptName = '55_add_process_display_order.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.55',
        'Add displayOrder column to Processes for custom ordering',
        '55_add_process_display_order.sql',
        'SUCCESS',
        'Allows manual reordering of main, support, and sub processes in the UI'
    );
END
GO
