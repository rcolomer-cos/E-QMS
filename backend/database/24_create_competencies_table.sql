-- =============================================
-- Competencies Table
-- =============================================
-- Defines competencies/skills that employees can achieve
-- Supports ISO 9001 competence management requirements
-- Competencies can be linked to trainings and required for roles/positions

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Competencies')
BEGIN
    CREATE TABLE Competencies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Competency Identification
        competencyCode NVARCHAR(100) UNIQUE NOT NULL, -- Unique competency identifier
        name NVARCHAR(500) NOT NULL, -- Competency name/title
        description NVARCHAR(2000), -- Detailed description of competency
        
        -- Classification
        category NVARCHAR(200) NOT NULL, -- Category (e.g., 'Technical', 'Safety', 'Quality', 'Management')
        subCategory NVARCHAR(200), -- Sub-category for more granular classification
        competencyType NVARCHAR(100), -- Type (e.g., 'Hard Skill', 'Soft Skill', 'Certification', 'License')
        
        -- Competency Details
        level NVARCHAR(100), -- Proficiency level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        version NVARCHAR(50), -- Version of competency definition (for tracking changes over time)
        
        -- Requirements
        isRegulatory BIT DEFAULT 0, -- Whether this is a regulatory requirement
        isMandatory BIT DEFAULT 0, -- Whether this competency is mandatory for certain roles
        mandatoryForRoles NVARCHAR(500), -- Comma-separated role names requiring this competency
        prerequisiteCompetencies NVARCHAR(500), -- Comma-separated competency IDs that are prerequisites
        
        -- Validity and Expiration
        hasExpiry BIT DEFAULT 0, -- Whether this competency expires
        defaultValidityMonths INT, -- Default validity period in months (NULL = no expiry)
        renewalRequired BIT DEFAULT 0, -- Whether renewal is required after expiry
        
        -- Training Association
        relatedTrainingIds NVARCHAR(500), -- Comma-separated training IDs that provide this competency
        minimumTrainingHours DECIMAL(5,2), -- Minimum training hours required
        
        -- Assessment
        requiresAssessment BIT DEFAULT 0, -- Whether formal assessment is required
        assessmentCriteria NVARCHAR(2000), -- Assessment criteria or method
        minimumScore DECIMAL(5,2), -- Minimum score required (0-100 scale)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'deprecated', 'draft', 'obsolete'
        effectiveDate DATETIME2, -- Date competency definition becomes effective
        obsoleteDate DATETIME2, -- Date competency was marked obsolete
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        externalReference NVARCHAR(500), -- External standard or reference (e.g., ISO certification number)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this competency definition
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Competencies_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Competencies_Status CHECK (status IN ('active', 'deprecated', 'draft', 'obsolete')),
        CONSTRAINT CK_Competencies_DefaultValidityMonths CHECK (defaultValidityMonths IS NULL OR defaultValidityMonths > 0),
        CONSTRAINT CK_Competencies_MinimumTrainingHours CHECK (minimumTrainingHours IS NULL OR minimumTrainingHours >= 0),
        CONSTRAINT CK_Competencies_MinimumScore CHECK (minimumScore IS NULL OR (minimumScore >= 0 AND minimumScore <= 100))
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Competencies_CompetencyCode ON Competencies(competencyCode);
    
    -- Classification and filtering
    CREATE INDEX IX_Competencies_Category ON Competencies(category);
    CREATE INDEX IX_Competencies_SubCategory ON Competencies(subCategory);
    CREATE INDEX IX_Competencies_CompetencyType ON Competencies(competencyType);
    CREATE INDEX IX_Competencies_Level ON Competencies(level);
    
    -- Status and lifecycle
    CREATE INDEX IX_Competencies_Status ON Competencies(status);
    CREATE INDEX IX_Competencies_EffectiveDate ON Competencies(effectiveDate);
    CREATE INDEX IX_Competencies_ObsoleteDate ON Competencies(obsoleteDate);
    
    -- Requirements tracking
    CREATE INDEX IX_Competencies_IsRegulatory ON Competencies(isRegulatory);
    CREATE INDEX IX_Competencies_IsMandatory ON Competencies(isMandatory);
    CREATE INDEX IX_Competencies_HasExpiry ON Competencies(hasExpiry);
    CREATE INDEX IX_Competencies_RenewalRequired ON Competencies(renewalRequired);
    CREATE INDEX IX_Competencies_RequiresAssessment ON Competencies(requiresAssessment);
    
    -- Relationships
    CREATE INDEX IX_Competencies_CreatedBy ON Competencies(createdBy);
    
    -- Date-based queries
    CREATE INDEX IX_Competencies_CreatedAt ON Competencies(createdAt);
    CREATE INDEX IX_Competencies_UpdatedAt ON Competencies(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Competencies_Status_Category ON Competencies(status, category);
    CREATE INDEX IX_Competencies_Category_Level ON Competencies(category, level);
    CREATE INDEX IX_Competencies_Status_EffectiveDate ON Competencies(status, effectiveDate);
    CREATE INDEX IX_Competencies_Mandatory_Status ON Competencies(isMandatory, status);
    CREATE INDEX IX_Competencies_Regulatory_Status ON Competencies(isRegulatory, status);
    
    -- Name search
    CREATE INDEX IX_Competencies_Name ON Competencies(name);

    PRINT 'Competencies table created successfully';
END
ELSE
BEGIN
    PRINT 'Competencies table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.24' AND scriptName = '24_create_competencies_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.24',
        'Create Competencies table for competency definitions',
        '24_create_competencies_table.sql',
        'SUCCESS',
        'Competencies table supports ISO 9001 competence management with competency definitions, classification, validity rules, and training associations'
    );
END
GO
