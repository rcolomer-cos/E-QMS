-- =============================================
-- Backfill defaults for Processes.processType and displayOrder
-- =============================================

-- Set missing processType to 'main'
UPDATE Processes
SET processType = 'main'
WHERE processType IS NULL;
GO

-- Set missing displayOrder to id for stable default ordering
UPDATE Processes
SET displayOrder = id
WHERE displayOrder IS NULL;
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.56' AND scriptName = '56_update_process_defaults.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.56',
        'Backfill processType and displayOrder defaults in Processes',
        '56_update_process_defaults.sql',
        'SUCCESS',
        'Ensures existing processes appear in UI groupings and ordering'
    );
END
GO
