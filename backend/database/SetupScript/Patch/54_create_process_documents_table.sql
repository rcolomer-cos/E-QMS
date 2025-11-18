-- =============================================
-- ProcessDocuments Link Table
-- =============================================
-- Many-to-many mapping between Processes and Documents

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProcessDocuments')
BEGIN
    CREATE TABLE ProcessDocuments (
        processId INT NOT NULL,
        documentId INT NOT NULL,
        linkedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        linkedBy INT NULL,
        CONSTRAINT PK_ProcessDocuments PRIMARY KEY (processId, documentId),
        CONSTRAINT FK_ProcessDocuments_Process FOREIGN KEY (processId) REFERENCES Processes(id) ON DELETE CASCADE,
        CONSTRAINT FK_ProcessDocuments_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_ProcessDocuments_User FOREIGN KEY (linkedBy) REFERENCES Users(id)
    );

    CREATE INDEX IX_ProcessDocuments_Document ON ProcessDocuments(documentId);
    CREATE INDEX IX_ProcessDocuments_Process ON ProcessDocuments(processId);

    PRINT 'ProcessDocuments table created successfully';
END
ELSE
BEGIN
    PRINT 'ProcessDocuments table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.54' AND scriptName = '54_create_process_documents_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.54',
        'Create ProcessDocuments link table for filtering documents by process',
        '54_create_process_documents_table.sql',
        'SUCCESS',
        'Supports document library filtering by process and subprocess'
    );
END
GO
