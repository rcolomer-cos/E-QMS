-- =============================================
-- Inspection Records Table
-- =============================================
-- Stores inspection records for equipment
-- Tracks inspection history, findings, and compliance
-- Supports ISO 9001 inspection and monitoring requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionRecords')
BEGIN
    CREATE TABLE InspectionRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Inspection Scheduling
        inspectionDate DATETIME2 NOT NULL, -- Date inspection was performed
        dueDate DATETIME2, -- Date inspection was originally due
        nextDueDate DATETIME2, -- Date of next inspection due
        
        -- Personnel
        inspectedBy INT NOT NULL, -- User who performed the inspection
        reviewedBy INT, -- User who reviewed the inspection
        
        -- Inspection Details
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection (routine, safety, pre-use, etc.)
        inspectionChecklist NVARCHAR(500), -- Reference to inspection checklist/procedure
        
        -- Results
        result NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Overall inspection result
        findings NVARCHAR(2000), -- Detailed inspection findings and observations
        defectsFound NVARCHAR(2000), -- List of defects or issues identified
        
        -- Pass/Fail Status
        passed BIT NOT NULL DEFAULT 1, -- Overall pass/fail flag
        safetyCompliant BIT DEFAULT 1, -- Safety compliance flag
        operationalCompliant BIT DEFAULT 1, -- Operational compliance flag
        
        -- Measurements and Values
        measurementsTaken NVARCHAR(2000), -- Measurements or readings taken during inspection
        parameters NVARCHAR(1000), -- Inspection parameters evaluated
        
        -- Actions and Follow-up
        correctiveAction NVARCHAR(2000), -- Immediate corrective actions taken
        recommendedAction NVARCHAR(2000), -- Recommended actions for future
        followUpRequired BIT DEFAULT 0, -- Flag if follow-up inspection needed
        followUpDate DATETIME2, -- Date for follow-up inspection
        
        -- Documentation
        attachments NVARCHAR(1000), -- File paths to inspection reports/photos
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        severity NVARCHAR(50), -- Severity of findings (if issues found)
        
        -- Additional Information
        duration INT, -- Inspection duration in minutes
        notes NVARCHAR(2000), -- Additional notes or comments
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_InspectionRecords_InspectedBy FOREIGN KEY (inspectedBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionRecords_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionRecords_Result CHECK (result IN (
            'pending',
            'passed',
            'passed_with_observations',
            'failed',
            'conditional'
        )),
        CONSTRAINT CK_InspectionRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled'
        )),
        CONSTRAINT CK_InspectionRecords_Severity CHECK (severity IS NULL OR severity IN (
            'none',
            'minor',
            'moderate',
            'major',
            'critical'
        )),
        CONSTRAINT CK_InspectionRecords_Duration CHECK (duration IS NULL OR duration > 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_InspectionRecords_EquipmentId ON InspectionRecords(equipmentId);
    CREATE INDEX IX_InspectionRecords_Equipment_Date ON InspectionRecords(equipmentId, inspectionDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_InspectionRecords_InspectionDate ON InspectionRecords(inspectionDate);
    CREATE INDEX IX_InspectionRecords_DueDate ON InspectionRecords(dueDate);
    CREATE INDEX IX_InspectionRecords_NextDueDate ON InspectionRecords(nextDueDate);
    CREATE INDEX IX_InspectionRecords_FollowUpDate ON InspectionRecords(followUpDate);
    
    -- Status and result tracking
    CREATE INDEX IX_InspectionRecords_Status ON InspectionRecords(status);
    CREATE INDEX IX_InspectionRecords_Result ON InspectionRecords(result);
    CREATE INDEX IX_InspectionRecords_Passed ON InspectionRecords(passed);
    CREATE INDEX IX_InspectionRecords_Severity ON InspectionRecords(severity);
    
    -- Type and compliance tracking
    CREATE INDEX IX_InspectionRecords_InspectionType ON InspectionRecords(inspectionType);
    CREATE INDEX IX_InspectionRecords_SafetyCompliant ON InspectionRecords(safetyCompliant);
    CREATE INDEX IX_InspectionRecords_FollowUpRequired ON InspectionRecords(followUpRequired);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionRecords_InspectedBy ON InspectionRecords(inspectedBy);
    CREATE INDEX IX_InspectionRecords_ReviewedBy ON InspectionRecords(reviewedBy);
    CREATE INDEX IX_InspectionRecords_CreatedBy ON InspectionRecords(createdBy);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionRecords_Status_DueDate ON InspectionRecords(status, dueDate);
    CREATE INDEX IX_InspectionRecords_Equipment_Status ON InspectionRecords(equipmentId, status);
    CREATE INDEX IX_InspectionRecords_Equipment_Result ON InspectionRecords(equipmentId, result);
    CREATE INDEX IX_InspectionRecords_Type_Status ON InspectionRecords(inspectionType, status);
    
    -- Audit trail
    CREATE INDEX IX_InspectionRecords_CreatedAt ON InspectionRecords(createdAt);

    PRINT 'InspectionRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.15' AND scriptName = '15_create_inspection_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.15',
        'Create InspectionRecords table for equipment inspection tracking',
        '15_create_inspection_records_table.sql',
        'SUCCESS',
        'InspectionRecords table supports ISO 9001 inspection and monitoring with full audit trail and compliance tracking'
    );
END
GO
