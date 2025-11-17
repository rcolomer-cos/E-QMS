-- =============================================
-- Audits Table (Audit Plans)
-- =============================================
-- Stores planned audits including internal audits, process audits, and external audits
-- Tracks audit scope, schedules, auditors, related processes, and audit criteria
-- Supports ISO 9001 audit planning and execution requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Audits')
BEGIN
    CREATE TABLE Audits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Audit Identification
        auditNumber NVARCHAR(50) UNIQUE NOT NULL, -- Unique audit identifier (e.g., 'AUD-2024-001')
        title NVARCHAR(200) NOT NULL, -- Audit title or name
        description NVARCHAR(2000), -- Detailed audit description and purpose
        
        -- Audit Classification
        auditType NVARCHAR(100) NOT NULL, -- Type of audit (Internal, External, Process, Compliance, Product, System, Supplier, Certification, Management Review)
        scope NVARCHAR(2000) NOT NULL, -- Audit scope definition - what will be audited
        
        -- Audit Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'planned', -- Status: planned, in_progress, completed, closed
        scheduledDate DATETIME2 NOT NULL, -- When the audit is scheduled to occur
        completedDate DATETIME2, -- When the audit was actually completed
        
        -- Personnel
        leadAuditorId INT NOT NULL, -- Lead auditor responsible for the audit
        department NVARCHAR(100), -- Department or area being audited
        
        -- Audit Criteria and Processes
        auditCriteria NVARCHAR(2000), -- Audit criteria and standards being applied (e.g., 'ISO 9001:2015 clauses 4.1, 4.2, 8.5')
        relatedProcesses NVARCHAR(1000), -- Comma-separated list of process IDs or process codes being audited
        
        -- Audit Results and Findings
        findings NVARCHAR(MAX), -- Audit findings and observations (JSON or structured text)
        conclusions NVARCHAR(MAX), -- Audit conclusions and summary
        
        -- Audit Metadata
        createdBy INT NOT NULL, -- User who created/planned this audit
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Audits_LeadAuditor FOREIGN KEY (leadAuditorId) REFERENCES Users(id),
        CONSTRAINT FK_Audits_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_Audits_Status CHECK (status IN ('planned', 'in_progress', 'completed', 'closed')),
        CONSTRAINT CK_Audits_Dates CHECK (completedDate IS NULL OR completedDate >= scheduledDate)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique audit number for quick lookups
    CREATE UNIQUE INDEX IX_Audits_AuditNumber ON Audits(auditNumber);
    
    -- Status filtering (most common query pattern)
    CREATE INDEX IX_Audits_Status ON Audits(status);
    CREATE INDEX IX_Audits_Status_ScheduledDate ON Audits(status, scheduledDate DESC);
    
    -- Date-based queries for audit scheduling and reporting
    CREATE INDEX IX_Audits_ScheduledDate ON Audits(scheduledDate DESC);
    CREATE INDEX IX_Audits_CompletedDate ON Audits(completedDate DESC);
    CREATE INDEX IX_Audits_ScheduledDate_Status ON Audits(scheduledDate DESC, status);
    
    -- Audit type filtering
    CREATE INDEX IX_Audits_AuditType ON Audits(auditType);
    CREATE INDEX IX_Audits_AuditType_Status ON Audits(auditType, status);
    
    -- Personnel tracking
    CREATE INDEX IX_Audits_LeadAuditorId ON Audits(leadAuditorId);
    CREATE INDEX IX_Audits_LeadAuditorId_Status ON Audits(leadAuditorId, status);
    CREATE INDEX IX_Audits_CreatedBy ON Audits(createdBy);
    
    -- Department filtering
    CREATE INDEX IX_Audits_Department ON Audits(department) WHERE department IS NOT NULL;
    CREATE INDEX IX_Audits_Department_Status ON Audits(department, status) WHERE department IS NOT NULL;
    
    -- Process filtering (for queries involving related processes)
    -- Note: This is a text field with comma-separated values, so it's indexed for text search
    CREATE INDEX IX_Audits_RelatedProcesses ON Audits(relatedProcesses) WHERE relatedProcesses IS NOT NULL;
    
    -- Timestamp tracking for audit trail and reporting
    CREATE INDEX IX_Audits_CreatedAt ON Audits(createdAt DESC);
    CREATE INDEX IX_Audits_UpdatedAt ON Audits(updatedAt DESC);

    PRINT 'Audits table created successfully with comprehensive indexing for audit planning and execution';
END
ELSE
BEGIN
    PRINT 'Audits table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.27' AND scriptName = '27_create_audits_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.27',
        'Create Audits table for audit planning and execution',
        '27_create_audits_table.sql',
        'SUCCESS',
        'Audits table stores planned audits including scope, dates, auditors, related processes, and audit criteria. Supports ISO 9001 audit planning requirements with comprehensive indexing for filtering by date and process.'
    );
END
GO
