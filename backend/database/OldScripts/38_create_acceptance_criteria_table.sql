-- =============================================
-- Acceptance Criteria Table
-- =============================================
-- Stores acceptance criteria for inspection types
-- Defines pass/fail rules, tolerances, and standardized criteria
-- Supports ISO 9001 inspection validation and quality control requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AcceptanceCriteria')
BEGIN
    CREATE TABLE AcceptanceCriteria (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Criteria Identification
        criteriaCode NVARCHAR(100) UNIQUE NOT NULL, -- Unique identifier for the criteria
        criteriaName NVARCHAR(500) NOT NULL, -- Descriptive name of the criteria
        description NVARCHAR(2000), -- Detailed description of what is being measured/evaluated
        
        -- Inspection Type Association
        inspectionType NVARCHAR(100) NOT NULL, -- Type of inspection this criteria applies to
        equipmentCategory NVARCHAR(200), -- Optional: specific equipment category or type
        
        -- Measurement Definition
        parameterName NVARCHAR(200) NOT NULL, -- Name of the parameter being measured
        unit NVARCHAR(50), -- Unit of measurement (mm, kg, psi, °C, etc.)
        measurementType NVARCHAR(50) NOT NULL, -- Type of measurement (quantitative, qualitative, binary, range)
        
        -- Pass/Fail Rules
        ruleType NVARCHAR(50) NOT NULL, -- Type of rule (range, min, max, exact, tolerance, checklist)
        
        -- Numeric Thresholds (for quantitative measurements)
        targetValue DECIMAL(18,6), -- Target or nominal value
        minValue DECIMAL(18,6), -- Minimum acceptable value
        maxValue DECIMAL(18,6), -- Maximum acceptable value
        tolerancePlus DECIMAL(18,6), -- Positive tolerance from target
        toleranceMinus DECIMAL(18,6), -- Negative tolerance from target
        
        -- Qualitative Criteria (for non-numeric evaluations)
        acceptableValues NVARCHAR(1000), -- Comma-separated list of acceptable values
        unacceptableValues NVARCHAR(1000), -- Comma-separated list of unacceptable values
        
        -- Severity and Importance
        severity NVARCHAR(50) NOT NULL DEFAULT 'normal', -- Severity if criteria fails (critical, major, minor, normal)
        mandatory BIT NOT NULL DEFAULT 1, -- Whether this criteria must be met (true) or is advisory (false)
        safetyRelated BIT DEFAULT 0, -- Whether this criteria is safety-related
        regulatoryRequirement BIT DEFAULT 0, -- Whether this is a regulatory requirement
        
        -- Decision Logic
        failureAction NVARCHAR(50) NOT NULL DEFAULT 'fail_inspection', -- Action on failure (fail_inspection, flag_for_review, warning_only)
        allowOverride BIT DEFAULT 0, -- Whether failure can be overridden by authorized personnel
        overrideAuthorizationLevel NVARCHAR(100), -- Required role/permission to override
        
        -- Compliance References
        standardReference NVARCHAR(200), -- Reference to standard or specification (e.g., ISO 9001:2015)
        procedureReference NVARCHAR(200), -- Reference to internal procedure or work instruction
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- Criteria status (active, inactive, draft, obsolete)
        effectiveDate DATETIME2 NOT NULL, -- Date when criteria becomes effective
        expiryDate DATETIME2, -- Date when criteria expires (NULL for no expiry)
        
        -- Versioning
        version NVARCHAR(50) NOT NULL DEFAULT '1.0', -- Version of the criteria
        supersedes INT, -- ID of the criteria this version supersedes
        
        -- Additional Information
        inspectionMethod NVARCHAR(500), -- Method or procedure for performing the measurement
        requiredEquipment NVARCHAR(500), -- Equipment or tools required to verify criteria
        frequency NVARCHAR(100), -- How often this criteria should be checked
        sampleSize INT, -- Number of samples required for statistical criteria
        
        notes NVARCHAR(2000), -- Additional notes or instructions
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created the criteria
        updatedBy INT, -- User who last updated the criteria
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AcceptanceCriteria_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_AcceptanceCriteria_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        CONSTRAINT FK_AcceptanceCriteria_Supersedes FOREIGN KEY (supersedes) REFERENCES AcceptanceCriteria(id),
        
        -- Constraints
        CONSTRAINT CK_AcceptanceCriteria_MeasurementType CHECK (measurementType IN (
            'quantitative',     -- Numeric measurements
            'qualitative',      -- Non-numeric assessments
            'binary',          -- Pass/fail, yes/no
            'range',           -- Value within a range
            'checklist'        -- Multiple items to check
        )),
        CONSTRAINT CK_AcceptanceCriteria_RuleType CHECK (ruleType IN (
            'range',           -- Value must be between min and max
            'min',             -- Value must be >= minimum
            'max',             -- Value must be <= maximum
            'exact',           -- Value must match exactly
            'tolerance',       -- Value must be within tolerance of target
            'checklist',       -- All checklist items must pass
            'pass_fail'        -- Simple pass/fail evaluation
        )),
        CONSTRAINT CK_AcceptanceCriteria_Severity CHECK (severity IN (
            'critical',        -- Critical - immediate action required
            'major',           -- Major - significant impact
            'minor',           -- Minor - minimal impact
            'normal'           -- Normal - standard criteria
        )),
        CONSTRAINT CK_AcceptanceCriteria_FailureAction CHECK (failureAction IN (
            'fail_inspection',     -- Fail the entire inspection
            'flag_for_review',     -- Flag for supervisor review
            'warning_only',        -- Log warning but allow to pass
            'conditional_pass'     -- Pass with conditions
        )),
        CONSTRAINT CK_AcceptanceCriteria_Status CHECK (status IN (
            'active',
            'inactive',
            'draft',
            'obsolete'
        )),
        CONSTRAINT CK_AcceptanceCriteria_DateRange CHECK (expiryDate IS NULL OR expiryDate > effectiveDate),
        CONSTRAINT CK_AcceptanceCriteria_RangeValues CHECK (
            (minValue IS NULL OR maxValue IS NULL) OR (minValue <= maxValue)
        ),
        CONSTRAINT CK_AcceptanceCriteria_SampleSize CHECK (sampleSize IS NULL OR sampleSize > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_AcceptanceCriteria_CriteriaCode ON AcceptanceCriteria(criteriaCode);
    
    -- Inspection type lookups
    CREATE INDEX IX_AcceptanceCriteria_InspectionType ON AcceptanceCriteria(inspectionType);
    CREATE INDEX IX_AcceptanceCriteria_InspectionType_Status ON AcceptanceCriteria(inspectionType, status);
    
    -- Equipment category filtering
    CREATE INDEX IX_AcceptanceCriteria_EquipmentCategory ON AcceptanceCriteria(equipmentCategory);
    
    -- Parameter and measurement lookups
    CREATE INDEX IX_AcceptanceCriteria_ParameterName ON AcceptanceCriteria(parameterName);
    CREATE INDEX IX_AcceptanceCriteria_MeasurementType ON AcceptanceCriteria(measurementType);
    CREATE INDEX IX_AcceptanceCriteria_RuleType ON AcceptanceCriteria(ruleType);
    
    -- Status and lifecycle tracking
    CREATE INDEX IX_AcceptanceCriteria_Status ON AcceptanceCriteria(status);
    CREATE INDEX IX_AcceptanceCriteria_EffectiveDate ON AcceptanceCriteria(effectiveDate);
    CREATE INDEX IX_AcceptanceCriteria_ExpiryDate ON AcceptanceCriteria(expiryDate);
    
    -- Severity and criticality
    CREATE INDEX IX_AcceptanceCriteria_Severity ON AcceptanceCriteria(severity);
    CREATE INDEX IX_AcceptanceCriteria_Mandatory ON AcceptanceCriteria(mandatory);
    CREATE INDEX IX_AcceptanceCriteria_SafetyRelated ON AcceptanceCriteria(safetyRelated);
    CREATE INDEX IX_AcceptanceCriteria_RegulatoryRequirement ON AcceptanceCriteria(regulatoryRequirement);
    
    -- Versioning
    CREATE INDEX IX_AcceptanceCriteria_Version ON AcceptanceCriteria(version);
    CREATE INDEX IX_AcceptanceCriteria_Supersedes ON AcceptanceCriteria(supersedes);
    
    -- Personnel tracking
    CREATE INDEX IX_AcceptanceCriteria_CreatedBy ON AcceptanceCriteria(createdBy);
    CREATE INDEX IX_AcceptanceCriteria_UpdatedBy ON AcceptanceCriteria(updatedBy);
    
    -- Audit trail
    CREATE INDEX IX_AcceptanceCriteria_CreatedAt ON AcceptanceCriteria(createdAt);
    CREATE INDEX IX_AcceptanceCriteria_UpdatedAt ON AcceptanceCriteria(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_AcceptanceCriteria_Type_Category ON AcceptanceCriteria(inspectionType, equipmentCategory);
    CREATE INDEX IX_AcceptanceCriteria_Status_EffectiveDate ON AcceptanceCriteria(status, effectiveDate);
    CREATE INDEX IX_AcceptanceCriteria_Active ON AcceptanceCriteria(status, effectiveDate, expiryDate) 
        WHERE status = 'active';
    
    -- Name search
    CREATE INDEX IX_AcceptanceCriteria_CriteriaName ON AcceptanceCriteria(criteriaName);

    PRINT 'AcceptanceCriteria table created successfully';
END
ELSE
BEGIN
    PRINT 'AcceptanceCriteria table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.38' AND scriptName = '38_create_acceptance_criteria_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.38',
        'Create AcceptanceCriteria table for inspection validation rules',
        '38_create_acceptance_criteria_table.sql',
        'SUCCESS',
        'AcceptanceCriteria table supports ISO 9001 quality control with pass/fail rules, tolerances, and standardized criteria linked to inspection types'
    );
END
GO
