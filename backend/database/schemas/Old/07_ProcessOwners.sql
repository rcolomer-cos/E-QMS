-- ProcessOwners Schema
-- Junction table for process ownership assignments
CREATE TABLE ProcessOwners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    processId INT NOT NULL,
    ownerId INT NOT NULL,
    assignedAt DATETIME2 DEFAULT GETDATE(),
    assignedBy INT,
    isPrimaryOwner BIT DEFAULT 0,
    active BIT DEFAULT 1,
    notes NVARCHAR(500),
    CONSTRAINT FK_ProcessOwners_Process FOREIGN KEY (processId) REFERENCES Processes(id),
    CONSTRAINT FK_ProcessOwners_Owner FOREIGN KEY (ownerId) REFERENCES Users(id),
    CONSTRAINT FK_ProcessOwners_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
    CONSTRAINT UQ_ProcessOwners_Active UNIQUE (processId, ownerId, active)
);
