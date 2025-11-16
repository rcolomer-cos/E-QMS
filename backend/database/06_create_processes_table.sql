-- =============================================
-- Processes Table
-- =============================================
-- Stores business processes within the quality management system
-- Used to define, track, and manage organizational processes per ISO 9001

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Processes')
BEGIN
    CREATE TABLE Processes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) UNIQUE NOT NULL,
        code NVARCHAR(50) UNIQUE NOT NULL, -- Short code for process (e.g., 'PROC-001', 'QA-REVIEW')
        description NVARCHAR(1000),
        departmentId INT, -- Reference to Departments table (optional department association)
        processCategory NVARCHAR(100), -- e.g., 'Management', 'Core', 'Support'
        objective NVARCHAR(500), -- Process objective/purpose
        scope NVARCHAR(500), -- Process scope definition
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User ID who created this process
        CONSTRAINT FK_Processes_Department FOREIGN KEY (departmentId) REFERENCES Departments(id),
        CONSTRAINT FK_Processes_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
    );

    -- Indexes for performance
    CREATE UNIQUE INDEX IX_Processes_Name ON Processes(name) WHERE active = 1;
    CREATE UNIQUE INDEX IX_Processes_Code ON Processes(code) WHERE active = 1;
    CREATE INDEX IX_Processes_Active ON Processes(active);
    CREATE INDEX IX_Processes_Department ON Processes(departmentId);
    CREATE INDEX IX_Processes_Category ON Processes(processCategory);

    PRINT 'Processes table created successfully';
END
ELSE
BEGIN
    PRINT 'Processes table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.6' AND scriptName = '06_create_processes_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.6',
        'Create Processes table for ISO 9001 process management',
        '06_create_processes_table.sql',
        'SUCCESS',
        'Processes store business processes with unique name and code'
    );
END
GO
