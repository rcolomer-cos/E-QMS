-- =============================================
-- ProcessOwners Table
-- =============================================
-- Junction table for process ownership assignments
-- Tracks which users are responsible for which processes

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProcessOwners')
BEGIN
    CREATE TABLE ProcessOwners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        processId INT NOT NULL,
        ownerId INT NOT NULL, -- User ID who owns the process
        assignedAt DATETIME2 DEFAULT GETDATE(),
        assignedBy INT, -- User ID who made the assignment
        isPrimaryOwner BIT DEFAULT 0, -- Flag to indicate primary vs secondary owner
        active BIT DEFAULT 1,
        notes NVARCHAR(500), -- Optional notes about the ownership assignment
        CONSTRAINT FK_ProcessOwners_Process FOREIGN KEY (processId) REFERENCES Processes(id),
        CONSTRAINT FK_ProcessOwners_Owner FOREIGN KEY (ownerId) REFERENCES Users(id),
        CONSTRAINT FK_ProcessOwners_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_ProcessOwners_Active UNIQUE (processId, ownerId, active)
    );

    -- Indexes for performance
    CREATE INDEX IX_ProcessOwners_Process ON ProcessOwners(processId);
    CREATE INDEX IX_ProcessOwners_Owner ON ProcessOwners(ownerId);
    CREATE INDEX IX_ProcessOwners_Active ON ProcessOwners(active);
    CREATE INDEX IX_ProcessOwners_PrimaryOwner ON ProcessOwners(isPrimaryOwner) WHERE isPrimaryOwner = 1;

    PRINT 'ProcessOwners table created successfully';
END
ELSE
BEGIN
    PRINT 'ProcessOwners table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.7' AND scriptName = '07_create_process_owners_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.7',
        'Create ProcessOwners table for process ownership management',
        '07_create_process_owners_table.sql',
        'SUCCESS',
        'ProcessOwners track user assignments to processes with primary/secondary designation'
    );
END
GO
