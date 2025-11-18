-- =============================================
-- Document Revisions Table
-- =============================================
-- Stores detailed revision history for documents
-- Tracks version number, author, timestamp, change notes, and file references
-- Supports ISO 9001 audit trail and traceability requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentRevisions')
BEGIN
    CREATE TABLE DocumentRevisions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Document Reference
        documentId INT NOT NULL, -- Reference to the document being revised
        
        -- Version Information
        version NVARCHAR(50) NOT NULL, -- Version number at time of revision (e.g., '1.0', '1.1', '2.0')
        revisionNumber INT NOT NULL DEFAULT 1, -- Sequential revision number for tracking changes
        
        -- Change Details
        changeDescription NVARCHAR(2000), -- Description of changes made in this revision
        changeType NVARCHAR(50) NOT NULL DEFAULT 'update', -- 'create', 'update', 'approve', 'obsolete', 'review'
        changeReason NVARCHAR(1000), -- Reason for the change (e.g., regulatory update, error correction)
        
        -- Author Information
        authorId INT NOT NULL, -- User who made the revision
        authorName NVARCHAR(255), -- Cached author name for audit trail
        
        -- File Information (if file was updated)
        filePath NVARCHAR(1000), -- Path to the file at this revision
        fileName NVARCHAR(500), -- File name at this revision
        fileSize INT, -- File size in bytes at this revision
        fileHash NVARCHAR(128), -- Optional file hash for integrity verification
        
        -- Status at Time of Revision
        statusBefore NVARCHAR(50), -- Document status before this revision
        statusAfter NVARCHAR(50) NOT NULL, -- Document status after this revision
        
        -- Metadata
        previousRevisionId INT NULL, -- Reference to previous revision for linked history
        
        -- Timestamps
        revisionDate DATETIME2 DEFAULT GETDATE(), -- When this revision was created
        
        -- Foreign Key Constraints
        CONSTRAINT FK_DocumentRevisions_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentRevisions_Author FOREIGN KEY (authorId) REFERENCES Users(id),
        CONSTRAINT FK_DocumentRevisions_PreviousRevision FOREIGN KEY (previousRevisionId) REFERENCES DocumentRevisions(id),
        
        -- Constraints
        CONSTRAINT CK_DocumentRevisions_ChangeType CHECK (changeType IN ('create', 'update', 'approve', 'obsolete', 'review', 'version'))
    );

    -- Indexes for Performance
    
    -- Primary lookup by document
    CREATE INDEX IX_DocumentRevisions_DocumentId ON DocumentRevisions(documentId);
    
    -- Version tracking
    CREATE INDEX IX_DocumentRevisions_Version ON DocumentRevisions(version);
    CREATE INDEX IX_DocumentRevisions_RevisionNumber ON DocumentRevisions(revisionNumber);
    
    -- Author tracking
    CREATE INDEX IX_DocumentRevisions_AuthorId ON DocumentRevisions(authorId);
    
    -- Date-based queries for audit trails
    CREATE INDEX IX_DocumentRevisions_RevisionDate ON DocumentRevisions(revisionDate);
    
    -- Change type filtering
    CREATE INDEX IX_DocumentRevisions_ChangeType ON DocumentRevisions(changeType);
    
    -- Status tracking
    CREATE INDEX IX_DocumentRevisions_StatusAfter ON DocumentRevisions(statusAfter);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_DocumentRevisions_Document_Date ON DocumentRevisions(documentId, revisionDate DESC);
    CREATE INDEX IX_DocumentRevisions_Document_Version ON DocumentRevisions(documentId, version);
    
    -- Linked revision history
    CREATE INDEX IX_DocumentRevisions_PreviousRevisionId ON DocumentRevisions(previousRevisionId);

    PRINT 'DocumentRevisions table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentRevisions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.9' AND scriptName = '09_create_document_revisions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.9',
        'Create DocumentRevisions table for detailed revision history and audit trail',
        '09_create_document_revisions_table.sql',
        'SUCCESS',
        'DocumentRevisions table supports ISO 9001 audit trail requirements with version tracking, change notes, and file references'
    );
END
GO
