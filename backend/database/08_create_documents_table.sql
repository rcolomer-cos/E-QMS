-- =============================================
-- Documents Table
-- =============================================
-- Stores document metadata, versioning, and lifecycle management
-- Supports ISO 9001 document control requirements with version history

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
BEGIN
    CREATE TABLE Documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Document Metadata
        title NVARCHAR(500) NOT NULL,
        description NVARCHAR(2000),
        documentType NVARCHAR(100) NOT NULL, -- e.g., 'Policy', 'Procedure', 'Work Instruction', 'Form', 'Record'
        category NVARCHAR(100) NOT NULL, -- e.g., 'Quality', 'Safety', 'HR', 'Operations'
        
        -- Versioning
        version NVARCHAR(50) NOT NULL DEFAULT '1.0', -- Version number (e.g., '1.0', '1.1', '2.0')
        parentDocumentId INT NULL, -- Reference to previous version (NULL for first version)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'obsolete'
        
        -- Ownership and Approval
        ownerId INT NULL, -- Primary document owner/responsible person
        createdBy INT NOT NULL, -- User who created this version
        approvedBy INT NULL, -- User who approved the document
        approvedAt DATETIME2 NULL, -- Approval timestamp
        
        -- File Information
        filePath NVARCHAR(1000), -- Physical/logical path to document file
        fileName NVARCHAR(500), -- Original file name
        fileSize INT, -- File size in bytes
        
        -- Date Management
        effectiveDate DATETIME2, -- When document becomes effective
        reviewDate DATETIME2, -- Next scheduled review date
        expiryDate DATETIME2, -- Document expiration date (if applicable)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Documents_ParentDocument FOREIGN KEY (parentDocumentId) REFERENCES Documents(id),
        CONSTRAINT FK_Documents_Owner FOREIGN KEY (ownerId) REFERENCES Users(id),
        CONSTRAINT FK_Documents_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Documents_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Documents_Status CHECK (status IN ('draft', 'review', 'approved', 'obsolete')),
        CONSTRAINT CK_Documents_Version CHECK (LEN(version) > 0)
    );

    -- Indexes for Performance
    
    -- Primary indexes for filtering and searching
    CREATE INDEX IX_Documents_Status ON Documents(status);
    CREATE INDEX IX_Documents_DocumentType ON Documents(documentType);
    CREATE INDEX IX_Documents_Category ON Documents(category);
    CREATE INDEX IX_Documents_OwnerId ON Documents(ownerId);
    
    -- Version history and tracking
    CREATE INDEX IX_Documents_ParentDocumentId ON Documents(parentDocumentId);
    CREATE INDEX IX_Documents_Version ON Documents(version);
    
    -- Date-based queries
    CREATE INDEX IX_Documents_EffectiveDate ON Documents(effectiveDate);
    CREATE INDEX IX_Documents_ReviewDate ON Documents(reviewDate);
    CREATE INDEX IX_Documents_ExpiryDate ON Documents(expiryDate);
    CREATE INDEX IX_Documents_CreatedAt ON Documents(createdAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Documents_Title_Version ON Documents(title, version);
    CREATE INDEX IX_Documents_Status_DocumentType ON Documents(status, documentType);
    CREATE INDEX IX_Documents_Status_Category ON Documents(status, category);
    
    -- Audit trail
    CREATE INDEX IX_Documents_CreatedBy ON Documents(createdBy);
    CREATE INDEX IX_Documents_ApprovedBy ON Documents(approvedBy);

    PRINT 'Documents table created successfully';
END
ELSE
BEGIN
    PRINT 'Documents table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.8' AND scriptName = '08_create_documents_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.8',
        'Create Documents table with metadata, versioning, and audit trail',
        '08_create_documents_table.sql',
        'SUCCESS',
        'Documents table supports ISO 9001 document control with version history tracking via parentDocumentId'
    );
END
GO
