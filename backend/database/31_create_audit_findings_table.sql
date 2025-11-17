-- =============================================
-- Audit Findings Table
-- =============================================
-- Stores audit findings with severity, category, and recommended actions
-- Links findings to audits and optionally to NCRs for tracking non-conformances
-- Supports ISO 9001 audit reporting and corrective action requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditFindings')
BEGIN
    CREATE TABLE AuditFindings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Finding Identification
        findingNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique finding identifier (e.g., 'FND-2024-001')
        auditId INT NOT NULL, -- Reference to the audit where finding was identified
        
        -- Finding Details
        title NVARCHAR(500) NOT NULL, -- Brief title/summary of the finding
        description NVARCHAR(MAX) NOT NULL, -- Detailed description of the finding
        category NVARCHAR(200) NOT NULL, -- Category (Process, Documentation, Product Quality, Safety, Compliance, Resource Management, etc.)
        severity NVARCHAR(50) NOT NULL, -- Severity level: observation, minor, major, critical
        
        -- Evidence and Analysis
        evidence NVARCHAR(MAX), -- Evidence supporting the finding (references, photos, documents)
        rootCause NVARCHAR(2000), -- Preliminary root cause analysis
        auditCriteria NVARCHAR(1000), -- Audit criteria/standard against which non-conformance was identified
        clauseReference NVARCHAR(200), -- Specific clause or section reference (e.g., 'ISO 9001:2015 8.5.1')
        
        -- Recommendations and Actions
        recommendations NVARCHAR(2000), -- Auditor's recommendations for addressing the finding
        requiresNCR BIT DEFAULT 0 NOT NULL, -- Whether finding requires a formal NCR
        ncrId INT, -- Reference to NCR if one was created for this finding
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Status: open, under_review, action_planned, resolved, closed
        identifiedDate DATETIME2 NOT NULL, -- When the finding was identified
        targetCloseDate DATETIME2, -- Target date for closing the finding
        closedDate DATETIME2, -- When the finding was actually closed
        
        -- Personnel
        identifiedBy INT NOT NULL, -- Auditor who identified the finding
        assignedTo INT, -- Person responsible for addressing the finding
        verifiedBy INT, -- Person who verified closure of the finding
        verifiedDate DATETIME2, -- When closure was verified
        
        -- Additional Context
        department NVARCHAR(100), -- Department or area where finding was identified
        processId INT, -- Related process if applicable
        affectedArea NVARCHAR(500), -- Specific area, equipment, or process affected
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the finding record
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditFindings_Audit FOREIGN KEY (auditId) REFERENCES Audits(id) ON DELETE CASCADE,
        CONSTRAINT FK_AuditFindings_NCR FOREIGN KEY (ncrId) REFERENCES NCRs(id),
        CONSTRAINT FK_AuditFindings_IdentifiedBy FOREIGN KEY (identifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_AssignedTo FOREIGN KEY (assignedTo) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditFindings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_AuditFindings_Status CHECK (status IN ('open', 'under_review', 'action_planned', 'resolved', 'closed')),
        CONSTRAINT CK_AuditFindings_Severity CHECK (severity IN ('observation', 'minor', 'major', 'critical'))
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique finding number for quick lookups
    CREATE UNIQUE INDEX IX_AuditFindings_FindingNumber ON AuditFindings(findingNumber);
    
    -- Audit association (most common query pattern)
    CREATE INDEX IX_AuditFindings_AuditId ON AuditFindings(auditId);
    CREATE INDEX IX_AuditFindings_AuditId_Status ON AuditFindings(auditId, status);
    
    -- NCR linkage for tracking findings that resulted in NCRs
    CREATE INDEX IX_AuditFindings_NCRId ON AuditFindings(ncrId) WHERE ncrId IS NOT NULL;
    
    -- Status filtering (for dashboards and reports)
    CREATE INDEX IX_AuditFindings_Status ON AuditFindings(status);
    CREATE INDEX IX_AuditFindings_Severity ON AuditFindings(severity);
    CREATE INDEX IX_AuditFindings_Status_Severity ON AuditFindings(status, severity);
    
    -- Date-based queries for tracking and reporting
    CREATE INDEX IX_AuditFindings_IdentifiedDate ON AuditFindings(identifiedDate DESC);
    CREATE INDEX IX_AuditFindings_TargetCloseDate ON AuditFindings(targetCloseDate) WHERE targetCloseDate IS NOT NULL;
    CREATE INDEX IX_AuditFindings_ClosedDate ON AuditFindings(closedDate DESC) WHERE closedDate IS NOT NULL;
    
    -- Personnel tracking for assignment and workload management
    CREATE INDEX IX_AuditFindings_IdentifiedBy ON AuditFindings(identifiedBy);
    CREATE INDEX IX_AuditFindings_AssignedTo ON AuditFindings(assignedTo) WHERE assignedTo IS NOT NULL;
    CREATE INDEX IX_AuditFindings_AssignedTo_Status ON AuditFindings(assignedTo, status) WHERE assignedTo IS NOT NULL;
    
    -- Category and department filtering
    CREATE INDEX IX_AuditFindings_Category ON AuditFindings(category);
    CREATE INDEX IX_AuditFindings_Department ON AuditFindings(department) WHERE department IS NOT NULL;
    
    -- Process association
    CREATE INDEX IX_AuditFindings_ProcessId ON AuditFindings(processId) WHERE processId IS NOT NULL;
    
    -- Timestamp tracking for audit trail
    CREATE INDEX IX_AuditFindings_CreatedAt ON AuditFindings(createdAt DESC);
    CREATE INDEX IX_AuditFindings_UpdatedAt ON AuditFindings(updatedAt DESC);

    PRINT 'AuditFindings table created successfully with comprehensive indexing for audit findings management';
END
ELSE
BEGIN
    PRINT 'AuditFindings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.31' AND scriptName = '31_create_audit_findings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.31',
        'Create AuditFindings table for recording audit findings with NCR linkage',
        '31_create_audit_findings_table.sql',
        'SUCCESS',
        'AuditFindings table stores audit findings with severity, category, and recommended actions. Supports linking findings to NCRs and tracks resolution status. Includes comprehensive indexing for filtering and reporting.'
    );
END
GO
