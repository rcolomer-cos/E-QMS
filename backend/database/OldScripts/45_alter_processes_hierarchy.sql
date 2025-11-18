-- =============================================
-- Alter Processes: add hierarchy and type
-- =============================================

IF COL_LENGTH('Processes', 'processType') IS NULL
BEGIN
    ALTER TABLE Processes ADD processType NVARCHAR(20) NULL; -- 'main' | 'sub' | 'support'
    PRINT 'Added processType to Processes';
END
GO

IF COL_LENGTH('Processes', 'parentProcessId') IS NULL
BEGIN
    ALTER TABLE Processes ADD parentProcessId INT NULL;
    ALTER TABLE Processes ADD CONSTRAINT FK_Processes_Parent FOREIGN KEY (parentProcessId) REFERENCES Processes(id);
    PRINT 'Added parentProcessId to Processes';
END
GO

-- Optional flowchart storage (SVG) for process detail visualization
IF COL_LENGTH('Processes', 'flowchartSvg') IS NULL
BEGIN
    ALTER TABLE Processes ADD flowchartSvg NVARCHAR(MAX) NULL;
    PRINT 'Added flowchartSvg to Processes';
END
GO

-- Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_ProcessType' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_ProcessType ON Processes(processType);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Processes_Parent' AND object_id = OBJECT_ID('Processes'))
BEGIN
    CREATE INDEX IX_Processes_Parent ON Processes(parentProcessId);
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.45' AND scriptName = '45_alter_processes_hierarchy.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.45',
        'Add processType, parentProcessId, and flowchartSvg to Processes',
        '45_alter_processes_hierarchy.sql',
        'SUCCESS',
        'Supports Main/Sub/Support processes and simple flowchart storage'
    );
END
GO
