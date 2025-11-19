-- =============================================
-- Add Compliance Required Field to Documents
-- and Create Document Compliance Acknowledgements Table
-- =============================================
-- Supports ISO 9001 compliance requirements for user read & understand acknowledgements

-- Add complianceRequired field to Documents table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Documents') AND name = 'complianceRequired')
BEGIN
    ALTER TABLE Documents
    ADD complianceRequired BIT NOT NULL DEFAULT 0;
    
    -- Create index for filtering compliance-required documents
    CREATE INDEX IX_Documents_ComplianceRequired ON Documents(complianceRequired);
    
    PRINT 'Added complianceRequired field to Documents table';
END
ELSE
BEGIN
    PRINT 'complianceRequired field already exists in Documents table';
END
GO

-- Create DocumentComplianceAcknowledgements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentComplianceAcknowledgements')
BEGIN
    CREATE TABLE DocumentComplianceAcknowledgements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Document and User Reference
        documentId INT NOT NULL,
        userId INT NOT NULL,
        
        -- Version Tracking
        documentVersion NVARCHAR(50) NOT NULL, -- Version that was acknowledged
        
        -- Acknowledgement Details
        acknowledgedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ipAddress NVARCHAR(50), -- IP address for audit trail
        userAgent NVARCHAR(500), -- Browser/client info for audit trail
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_DocumentComplianceAck_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentComplianceAck_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        
        -- Unique constraint: one acknowledgement per user per document version
        CONSTRAINT UQ_DocumentComplianceAck_User_Document_Version UNIQUE (userId, documentId, documentVersion)
    );

    -- Indexes for Performance
    
    -- Query acknowledgements by document
    CREATE INDEX IX_DocumentComplianceAck_DocumentId ON DocumentComplianceAcknowledgements(documentId);
    
    -- Query acknowledgements by user
    CREATE INDEX IX_DocumentComplianceAck_UserId ON DocumentComplianceAcknowledgements(userId);
    
    -- Query by document and version
    CREATE INDEX IX_DocumentComplianceAck_Document_Version ON DocumentComplianceAcknowledgements(documentId, documentVersion);
    
    -- Audit trail queries
    CREATE INDEX IX_DocumentComplianceAck_AcknowledgedAt ON DocumentComplianceAcknowledgements(acknowledgedAt);
    
    -- Composite index for checking user compliance status
    CREATE INDEX IX_DocumentComplianceAck_User_Document ON DocumentComplianceAcknowledgements(userId, documentId);

    PRINT 'DocumentComplianceAcknowledgements table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentComplianceAcknowledgements table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.102' AND scriptName = '002_add_document_compliance.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.102',
        'Add document compliance acknowledgement support',
        '002_add_document_compliance.sql',
        'SUCCESS',
        'Added complianceRequired field to Documents table and created DocumentComplianceAcknowledgements table for tracking user read & understand confirmations'
    );
END
GO
