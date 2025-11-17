-- =============================================
-- Checklist Templates Table
-- =============================================
-- Stores reusable checklist templates for audits
-- Templates can be assigned to different audit types and reused across multiple audits
-- Supports ISO 9001 audit checklist management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistTemplates')
BEGIN
    CREATE TABLE ChecklistTemplates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Template Identification
        templateCode NVARCHAR(50) UNIQUE NOT NULL, -- Unique template identifier (e.g., 'CHKT-ISO9001-001')
        templateName NVARCHAR(200) NOT NULL, -- Template name or title
        description NVARCHAR(2000), -- Detailed description of the template
        
        -- Template Classification
        category NVARCHAR(100) NOT NULL, -- Category (e.g., 'ISO 9001', 'Process Audit', 'Product Audit', 'System Audit')
        auditType NVARCHAR(100), -- Associated audit type (Internal, External, Process, Compliance, etc.)
        
        -- Template Status
        status NVARCHAR(50) NOT NULL DEFAULT 'draft', -- Status: draft, active, archived, obsolete
        version NVARCHAR(20) NOT NULL DEFAULT '1.0', -- Template version
        
        -- Template Configuration
        isStandard BIT DEFAULT 0, -- Whether this is a standard/mandatory template
        requiresCompletion BIT DEFAULT 1, -- Whether all questions must be answered
        allowCustomQuestions BIT DEFAULT 0, -- Whether auditors can add custom questions
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the template
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistTemplates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistTemplates_Status CHECK (status IN ('draft', 'active', 'archived', 'obsolete'))
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Unique template code for quick lookups
    CREATE UNIQUE INDEX IX_ChecklistTemplates_TemplateCode ON ChecklistTemplates(templateCode);
    
    -- Status filtering (most common query pattern)
    CREATE INDEX IX_ChecklistTemplates_Status ON ChecklistTemplates(status);
    
    -- Category and audit type filtering
    CREATE INDEX IX_ChecklistTemplates_Category ON ChecklistTemplates(category);
    CREATE INDEX IX_ChecklistTemplates_Category_Status ON ChecklistTemplates(category, status);
    CREATE INDEX IX_ChecklistTemplates_AuditType ON ChecklistTemplates(auditType) WHERE auditType IS NOT NULL;
    
    -- Creator tracking
    CREATE INDEX IX_ChecklistTemplates_CreatedBy ON ChecklistTemplates(createdBy);
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistTemplates_CreatedAt ON ChecklistTemplates(createdAt DESC);
    CREATE INDEX IX_ChecklistTemplates_UpdatedAt ON ChecklistTemplates(updatedAt DESC);

    PRINT 'ChecklistTemplates table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistTemplates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.28' AND scriptName = '28_create_checklist_templates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.28',
        'Create ChecklistTemplates table for reusable audit checklist templates',
        '28_create_checklist_templates_table.sql',
        'SUCCESS',
        'ChecklistTemplates table stores reusable checklist templates that can be assigned to different audit types and reused across multiple audits. Supports template versioning and categorization.'
    );
END
GO
