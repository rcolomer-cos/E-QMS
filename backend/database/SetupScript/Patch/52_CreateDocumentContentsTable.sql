-- =============================================
-- DocumentContents Table
-- =============================================
-- Stores rich text content for documents (HTML or ProseMirror JSON)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentContents')
BEGIN
    CREATE TABLE DocumentContents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        documentId INT NOT NULL,
        content NVARCHAR(MAX) NOT NULL, -- HTML or JSON string
        contentFormat NVARCHAR(50) NOT NULL DEFAULT 'prosemirror', -- 'html' | 'prosemirror'
        updatedBy INT NOT NULL,
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_DocumentContents_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentContents_User FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );

    CREATE UNIQUE INDEX UX_DocumentContents_DocumentId ON DocumentContents(documentId);
    CREATE INDEX IX_DocumentContents_UpdatedAt ON DocumentContents(updatedAt);

    PRINT 'DocumentContents table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentContents table already exists';
END
GO

IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.52' AND scriptName = '52_CreateDocumentContentsTable.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.52',
        'Create DocumentContents table to store rich text content and support autosave',
        '52_CreateDocumentContentsTable.sql',
        'SUCCESS',
        'Stores editor content as HTML or ProseMirror JSON; linked to Documents'
    );
END
GO
