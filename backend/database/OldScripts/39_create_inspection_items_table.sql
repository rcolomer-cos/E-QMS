-- =============================================
-- Inspection Items Table
-- =============================================
-- Stores individual inspection items/checks within an inspection record
-- Links inspection records to acceptance criteria with measured values and pass/fail results
-- Supports ISO 9001 inspection validation and automatic scoring
-- Used for P4:4:3 auto scoring logic implementation

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InspectionItems')
BEGIN
    CREATE TABLE InspectionItems (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Inspection Record Reference
        inspectionRecordId INT NOT NULL, -- Reference to InspectionRecords table
        
        -- Acceptance Criteria Reference
        acceptanceCriteriaId INT NOT NULL, -- Reference to AcceptanceCriteria table
        
        -- Measurement Details
        measuredValue NVARCHAR(500), -- The actual measured/observed value
        measurementUnit NVARCHAR(50), -- Unit of measurement (copied from criteria for reference)
        
        -- Pass/Fail Evaluation
        passed BIT NOT NULL DEFAULT 0, -- Whether this item passed the criteria
        autoScored BIT NOT NULL DEFAULT 0, -- Whether this was automatically scored or manually evaluated
        
        -- Validation Result
        validationMessage NVARCHAR(1000), -- Message from validation logic (e.g., "Value 23.5 is within range [20, 25]")
        
        -- Override Capability
        overridden BIT DEFAULT 0, -- Whether the auto-score was overridden by authorized personnel
        overrideReason NVARCHAR(500), -- Reason for override if applicable
        overriddenBy INT, -- User who performed the override
        overriddenAt DATETIME2, -- When the override occurred
        
        -- Item Status
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped', 'not_applicable'
        
        -- Severity and Impact (copied from criteria)
        severity NVARCHAR(50), -- Severity level from acceptance criteria
        mandatory BIT, -- Whether this is a mandatory check
        
        -- Additional Context
        notes NVARCHAR(2000), -- Inspector's notes or observations
        photoAttachments NVARCHAR(1000), -- References to photo attachments for this specific item
        
        -- Item Order and Organization
        itemOrder INT, -- Display order within the inspection
        sectionName NVARCHAR(200), -- Optional section/category grouping
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the item
        updatedBy INT, -- User who last updated the item
        
        -- Foreign Key Constraints
        CONSTRAINT FK_InspectionItems_InspectionRecord FOREIGN KEY (inspectionRecordId) REFERENCES InspectionRecords(id) ON DELETE CASCADE,
        CONSTRAINT FK_InspectionItems_AcceptanceCriteria FOREIGN KEY (acceptanceCriteriaId) REFERENCES AcceptanceCriteria(id),
        CONSTRAINT FK_InspectionItems_OverriddenBy FOREIGN KEY (overriddenBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionItems_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_InspectionItems_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_InspectionItems_Status CHECK (status IN (
            'pending',          -- Not yet evaluated
            'completed',        -- Evaluation complete
            'skipped',         -- Intentionally skipped
            'not_applicable'   -- Not applicable for this inspection
        )),
        CONSTRAINT CK_InspectionItems_Severity CHECK (severity IS NULL OR severity IN (
            'critical',
            'major',
            'minor',
            'normal'
        )),
        CONSTRAINT CK_InspectionItems_ItemOrder CHECK (itemOrder IS NULL OR itemOrder > 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_InspectionItems_InspectionRecordId ON InspectionItems(inspectionRecordId);
    CREATE INDEX IX_InspectionItems_AcceptanceCriteriaId ON InspectionItems(acceptanceCriteriaId);
    
    -- Pass/fail tracking
    CREATE INDEX IX_InspectionItems_Passed ON InspectionItems(passed);
    CREATE INDEX IX_InspectionItems_Status ON InspectionItems(status);
    
    -- Scoring method tracking
    CREATE INDEX IX_InspectionItems_AutoScored ON InspectionItems(autoScored);
    CREATE INDEX IX_InspectionItems_Overridden ON InspectionItems(overridden);
    
    -- Severity and criticality
    CREATE INDEX IX_InspectionItems_Severity ON InspectionItems(severity);
    CREATE INDEX IX_InspectionItems_Mandatory ON InspectionItems(mandatory);
    
    -- Personnel tracking
    CREATE INDEX IX_InspectionItems_OverriddenBy ON InspectionItems(overriddenBy);
    CREATE INDEX IX_InspectionItems_CreatedBy ON InspectionItems(createdBy);
    CREATE INDEX IX_InspectionItems_UpdatedBy ON InspectionItems(updatedBy);
    
    -- Audit trail
    CREATE INDEX IX_InspectionItems_CreatedAt ON InspectionItems(createdAt);
    CREATE INDEX IX_InspectionItems_UpdatedAt ON InspectionItems(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_InspectionItems_Record_Status ON InspectionItems(inspectionRecordId, status);
    CREATE INDEX IX_InspectionItems_Record_Passed ON InspectionItems(inspectionRecordId, passed);
    CREATE INDEX IX_InspectionItems_Record_Order ON InspectionItems(inspectionRecordId, itemOrder);
    CREATE INDEX IX_InspectionItems_Record_Severity ON InspectionItems(inspectionRecordId, severity);
    CREATE INDEX IX_InspectionItems_Failed_Mandatory ON InspectionItems(passed, mandatory) WHERE passed = 0 AND mandatory = 1;
    
    -- Section organization
    CREATE INDEX IX_InspectionItems_SectionName ON InspectionItems(sectionName);

    PRINT 'InspectionItems table created successfully';
END
ELSE
BEGIN
    PRINT 'InspectionItems table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.39' AND scriptName = '39_create_inspection_items_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.39',
        'Create InspectionItems table for inspection item tracking and auto scoring',
        '39_create_inspection_items_table.sql',
        'SUCCESS',
        'InspectionItems table links inspection records to acceptance criteria with measured values and automatic pass/fail scoring. Supports P4:4:3 auto scoring logic with override capability and full audit trail.'
    );
END
GO
