-- =============================================
-- Add orgChartData to Departments Table
-- Migration Script for Issue #252
-- =============================================
-- This script adds a field to store organizational chart flowchart data
-- in JSON format (ReactFlow nodes and edges) to the Departments table.
-- 
-- Only superuser and management users can edit the org chart.
-- All users can view the org chart.

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Departments') AND name = 'orgChartData'
)
BEGIN
    ALTER TABLE Departments
    ADD orgChartData NVARCHAR(MAX);

    PRINT 'Added orgChartData column to Departments table';
END
ELSE
BEGIN
    PRINT 'orgChartData column already exists in Departments table';
END

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE scriptName = '65_add_orgchart_to_departments.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.65',
        'Add orgChartData field to Departments table',
        '65_add_orgchart_to_departments.sql',
        'SUCCESS',
        'Adds NVARCHAR(MAX) field to store organizational chart flowchart data in JSON format for Issue #252'
    );
    PRINT 'Recorded migration in DatabaseVersion table';
END
ELSE
BEGIN
    PRINT 'Migration already recorded in DatabaseVersion table';
END

PRINT 'Migration completed successfully';
