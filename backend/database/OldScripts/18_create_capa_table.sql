-- =============================================
-- Corrective and Preventive Actions (CAPA) Table
-- =============================================
-- Stores CAPA records with root causes, actions, deadlines, and verification data
-- Establishes relations to NCR entries and supports ISO 9001 CAPA management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CAPAs')
BEGIN
    CREATE TABLE CAPAs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- CAPA Identification
        capaNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique CAPA identifier
        title NVARCHAR(500) NOT NULL, -- CAPA title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed description of the CAPA
        
        -- Classification
        type NVARCHAR(50) NOT NULL, -- Type: corrective, preventive
        source NVARCHAR(200) NOT NULL, -- Source of CAPA (NCR, audit, risk assessment, etc.)
        priority NVARCHAR(50) NOT NULL, -- Priority level (low, medium, high, urgent)
        
        -- Related Records
        ncrId INT, -- Optional link to related NCR
        auditId INT, -- Optional link to related audit
        
        -- Analysis and Actions
        rootCause NVARCHAR(2000), -- Root cause analysis findings
        proposedAction NVARCHAR(2000) NOT NULL, -- Proposed corrective or preventive action
        
        -- Personnel and Timeline
        actionOwner INT NOT NULL, -- User responsible for implementing the action
        targetDate DATETIME2 NOT NULL, -- Target completion date
        completedDate DATETIME2, -- Actual completion date
        
        -- Status and Verification
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- Current status of CAPA
        effectiveness NVARCHAR(2000), -- Effectiveness verification notes
        verifiedBy INT, -- User who verified the effectiveness
        verifiedDate DATETIME2, -- Date verification was completed
        closedDate DATETIME2, -- Date CAPA was closed
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the CAPA
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_CAPAs_NCR FOREIGN KEY (ncrId) REFERENCES NCRs(id),
        CONSTRAINT FK_CAPAs_ActionOwner FOREIGN KEY (actionOwner) REFERENCES Users(id),
        CONSTRAINT FK_CAPAs_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_CAPAs_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_CAPAs_Type CHECK (type IN (
            'corrective',
            'preventive'
        )),
        CONSTRAINT CK_CAPAs_Priority CHECK (priority IN (
            'low',
            'medium',
            'high',
            'urgent'
        )),
        CONSTRAINT CK_CAPAs_Status CHECK (status IN (
            'open',
            'in_progress',
            'completed',
            'verified',
            'closed'
        ))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_CAPAs_CAPANumber ON CAPAs(capaNumber);
    
    -- Status and priority tracking
    CREATE INDEX IX_CAPAs_Status ON CAPAs(status);
    CREATE INDEX IX_CAPAs_Priority ON CAPAs(priority);
    CREATE INDEX IX_CAPAs_Type ON CAPAs(type);
    CREATE INDEX IX_CAPAs_Status_Priority ON CAPAs(status, priority);
    
    -- Date-based queries
    CREATE INDEX IX_CAPAs_TargetDate ON CAPAs(targetDate);
    CREATE INDEX IX_CAPAs_CompletedDate ON CAPAs(completedDate);
    CREATE INDEX IX_CAPAs_ClosedDate ON CAPAs(closedDate);
    CREATE INDEX IX_CAPAs_CreatedAt ON CAPAs(createdAt);
    
    -- Personnel tracking
    CREATE INDEX IX_CAPAs_ActionOwner ON CAPAs(actionOwner);
    CREATE INDEX IX_CAPAs_VerifiedBy ON CAPAs(verifiedBy);
    CREATE INDEX IX_CAPAs_CreatedBy ON CAPAs(createdBy);
    
    -- Related records tracking
    CREATE INDEX IX_CAPAs_NCRId ON CAPAs(ncrId);
    CREATE INDEX IX_CAPAs_AuditId ON CAPAs(auditId);
    
    -- Source tracking
    CREATE INDEX IX_CAPAs_Source ON CAPAs(source);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_CAPAs_Status_TargetDate ON CAPAs(status, targetDate ASC);
    CREATE INDEX IX_CAPAs_ActionOwner_Status ON CAPAs(actionOwner, status);
    CREATE INDEX IX_CAPAs_Type_Status ON CAPAs(type, status);
    CREATE INDEX IX_CAPAs_Priority_Status ON CAPAs(priority, status);
    CREATE INDEX IX_CAPAs_NCRId_Status ON CAPAs(ncrId, status);

    PRINT 'CAPAs table created successfully';
END
ELSE
BEGIN
    PRINT 'CAPAs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.18' AND scriptName = '18_create_capa_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.18',
        'Create CAPAs table for corrective and preventive action tracking',
        '18_create_capa_table.sql',
        'SUCCESS',
        'CAPAs table supports ISO 9001 CAPA management with relations to NCRs, full audit trail, and effectiveness verification'
    );
END
GO
