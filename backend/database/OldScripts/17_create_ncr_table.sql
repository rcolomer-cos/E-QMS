-- =============================================
-- Non-Conformity Report (NCR) Table
-- =============================================
-- Stores non-conformity records (NCRs) with tracking for category, severity, root cause, and resolution
-- Supports ISO 9001 non-conformance management and corrective action requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NCRs')
BEGIN
    CREATE TABLE NCRs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- NCR Identification
        ncrNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique NCR identifier
        title NVARCHAR(500) NOT NULL, -- NCR title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed description of non-conformity
        
        -- Classification
        source NVARCHAR(200) NOT NULL, -- Source of NCR (internal audit, customer complaint, inspection, etc.)
        category NVARCHAR(200) NOT NULL, -- Category of non-conformity (process, product, documentation, etc.)
        severity NVARCHAR(50) NOT NULL, -- Severity level (minor, major, critical)
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Current status of NCR
        detectedDate DATETIME2 NOT NULL, -- Date non-conformity was detected
        closedDate DATETIME2, -- Date NCR was closed
        
        -- Personnel
        reportedBy INT NOT NULL, -- User who reported the NCR
        assignedTo INT, -- User assigned to resolve the NCR
        verifiedBy INT, -- User who verified the resolution
        verifiedDate DATETIME2, -- Date verification was completed
        
        -- Analysis and Actions
        rootCause NVARCHAR(2000), -- Root cause analysis findings
        containmentAction NVARCHAR(2000), -- Immediate containment actions taken
        correctiveAction NVARCHAR(2000), -- Corrective actions to prevent recurrence
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_NCRs_ReportedBy FOREIGN KEY (reportedBy) REFERENCES Users(id),
        CONSTRAINT FK_NCRs_AssignedTo FOREIGN KEY (assignedTo) REFERENCES Users(id),
        CONSTRAINT FK_NCRs_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_NCRs_Status CHECK (status IN (
            'open',
            'in_progress',
            'resolved',
            'closed',
            'rejected'
        )),
        CONSTRAINT CK_NCRs_Severity CHECK (severity IN (
            'minor',
            'major',
            'critical'
        ))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_NCRs_NCRNumber ON NCRs(ncrNumber);
    
    -- Status and severity tracking
    CREATE INDEX IX_NCRs_Status ON NCRs(status);
    CREATE INDEX IX_NCRs_Severity ON NCRs(severity);
    CREATE INDEX IX_NCRs_Status_Severity ON NCRs(status, severity);
    
    -- Date-based queries
    CREATE INDEX IX_NCRs_DetectedDate ON NCRs(detectedDate);
    CREATE INDEX IX_NCRs_ClosedDate ON NCRs(closedDate);
    CREATE INDEX IX_NCRs_CreatedAt ON NCRs(createdAt);
    
    -- Personnel tracking
    CREATE INDEX IX_NCRs_ReportedBy ON NCRs(reportedBy);
    CREATE INDEX IX_NCRs_AssignedTo ON NCRs(assignedTo);
    CREATE INDEX IX_NCRs_VerifiedBy ON NCRs(verifiedBy);
    
    -- Classification tracking
    CREATE INDEX IX_NCRs_Source ON NCRs(source);
    CREATE INDEX IX_NCRs_Category ON NCRs(category);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_NCRs_Status_DetectedDate ON NCRs(status, detectedDate DESC);
    CREATE INDEX IX_NCRs_AssignedTo_Status ON NCRs(assignedTo, status);
    CREATE INDEX IX_NCRs_Category_Status ON NCRs(category, status);
    CREATE INDEX IX_NCRs_Severity_Status ON NCRs(severity, status);

    PRINT 'NCRs table created successfully';
END
ELSE
BEGIN
    PRINT 'NCRs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.17' AND scriptName = '17_create_ncr_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.17',
        'Create NCRs table for non-conformity report tracking',
        '17_create_ncr_table.sql',
        'SUCCESS',
        'NCRs table supports ISO 9001 non-conformance management with full audit trail and corrective action tracking'
    );
END
GO
