-- =============================================
-- RoleTrainingRequirements Table
-- =============================================
-- Junction table mapping roles to required competencies
-- Defines which competencies are mandatory for each role
-- Supports ISO 9001:2015 competence requirements per role

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoleTrainingRequirements')
BEGIN
    CREATE TABLE RoleTrainingRequirements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        roleId INT NOT NULL, -- Role that requires this competency
        competencyId INT NOT NULL, -- Required competency
        
        -- Requirement Details
        isMandatory BIT DEFAULT 1, -- Whether this competency is mandatory for the role
        isRegulatory BIT DEFAULT 0, -- Whether this is a regulatory requirement
        priority NVARCHAR(50) DEFAULT 'normal', -- Priority level: 'critical', 'high', 'normal', 'low'
        
        -- Grace Period and Compliance
        gracePeriodDays INT, -- Days after role assignment before requirement must be met
        complianceDeadline DATETIME2, -- Optional specific deadline for compliance
        
        -- Training Specifications
        minimumProficiencyLevel NVARCHAR(100), -- Minimum required proficiency level
        refreshFrequencyMonths INT, -- How often competency must be refreshed (NULL = no refresh required)
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'deprecated'
        effectiveDate DATETIME2 DEFAULT GETDATE(), -- When this requirement becomes effective
        endDate DATETIME2, -- When this requirement expires (NULL = no expiry)
        
        -- Documentation
        justification NVARCHAR(2000), -- Why this competency is required for this role
        regulatoryReference NVARCHAR(500), -- Reference to regulation/standard if applicable
        notes NVARCHAR(2000), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this requirement
        
        -- Foreign Key Constraints
        CONSTRAINT FK_RoleTrainingRequirements_Role FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_RoleTrainingRequirements_Competency FOREIGN KEY (competencyId) REFERENCES Competencies(id),
        CONSTRAINT FK_RoleTrainingRequirements_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_RoleTrainingRequirements_Priority CHECK (priority IN ('critical', 'high', 'normal', 'low')),
        CONSTRAINT CK_RoleTrainingRequirements_Status CHECK (status IN ('active', 'inactive', 'deprecated')),
        CONSTRAINT CK_RoleTrainingRequirements_GracePeriod CHECK (gracePeriodDays IS NULL OR gracePeriodDays >= 0),
        CONSTRAINT CK_RoleTrainingRequirements_RefreshFrequency CHECK (refreshFrequencyMonths IS NULL OR refreshFrequencyMonths > 0),
        
        -- Unique constraint: One requirement per role-competency combination (active records only)
        CONSTRAINT UQ_RoleTrainingRequirements_Role_Competency UNIQUE (roleId, competencyId)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_RoleTrainingRequirements_RoleId ON RoleTrainingRequirements(roleId);
    CREATE INDEX IX_RoleTrainingRequirements_CompetencyId ON RoleTrainingRequirements(competencyId);
    
    -- Status and lifecycle
    CREATE INDEX IX_RoleTrainingRequirements_Status ON RoleTrainingRequirements(status);
    CREATE INDEX IX_RoleTrainingRequirements_EffectiveDate ON RoleTrainingRequirements(effectiveDate);
    CREATE INDEX IX_RoleTrainingRequirements_EndDate ON RoleTrainingRequirements(endDate);
    
    -- Requirement attributes
    CREATE INDEX IX_RoleTrainingRequirements_IsMandatory ON RoleTrainingRequirements(isMandatory);
    CREATE INDEX IX_RoleTrainingRequirements_IsRegulatory ON RoleTrainingRequirements(isRegulatory);
    CREATE INDEX IX_RoleTrainingRequirements_Priority ON RoleTrainingRequirements(priority);
    
    -- Compliance tracking
    CREATE INDEX IX_RoleTrainingRequirements_ComplianceDeadline ON RoleTrainingRequirements(complianceDeadline);
    CREATE INDEX IX_RoleTrainingRequirements_RefreshFrequency ON RoleTrainingRequirements(refreshFrequencyMonths);
    
    -- Audit trail
    CREATE INDEX IX_RoleTrainingRequirements_CreatedBy ON RoleTrainingRequirements(createdBy);
    CREATE INDEX IX_RoleTrainingRequirements_CreatedAt ON RoleTrainingRequirements(createdAt);
    CREATE INDEX IX_RoleTrainingRequirements_UpdatedAt ON RoleTrainingRequirements(updatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_RoleTrainingRequirements_Role_Status ON RoleTrainingRequirements(roleId, status);
    CREATE INDEX IX_RoleTrainingRequirements_Competency_Status ON RoleTrainingRequirements(competencyId, status);
    CREATE INDEX IX_RoleTrainingRequirements_Status_Priority ON RoleTrainingRequirements(status, priority);
    CREATE INDEX IX_RoleTrainingRequirements_Role_Mandatory ON RoleTrainingRequirements(roleId, isMandatory) WHERE status = 'active';
    CREATE INDEX IX_RoleTrainingRequirements_Role_Regulatory ON RoleTrainingRequirements(roleId, isRegulatory) WHERE status = 'active';

    PRINT 'RoleTrainingRequirements table created successfully';
END
ELSE
BEGIN
    PRINT 'RoleTrainingRequirements table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.26' AND scriptName = '26_create_role_training_requirements_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.26',
        'Create RoleTrainingRequirements table for role-to-competency mapping',
        '26_create_role_training_requirements_table.sql',
        'SUCCESS',
        'RoleTrainingRequirements table defines which competencies are required for each role, supporting ISO 9001 competence management per role with priority levels, compliance tracking, and refresh requirements'
    );
END
GO
