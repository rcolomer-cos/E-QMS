-- =============================================
-- Checklist Responses Table
-- =============================================
-- Stores actual responses/answers to checklist questions during audits
-- Links audit execution to checklist templates and tracks compliance
-- Supports audit evidence collection and findings documentation

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistResponses')
BEGIN
    CREATE TABLE ChecklistResponses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Response Association
        auditId INT NOT NULL, -- Reference to the audit being conducted
        templateId INT NOT NULL, -- Reference to the checklist template being used
        questionId INT NOT NULL, -- Reference to the specific question being answered
        
        -- Response Data
        responseType NVARCHAR(50) NOT NULL, -- Type: yesno, text, rating, na
        yesNoResponse BIT, -- For yes/no questions (1=Yes, 0=No, NULL=Not Answered)
        textResponse NVARCHAR(MAX), -- For text-based responses or additional comments
        ratingResponse INT, -- For rating-based responses
        notApplicable BIT DEFAULT 0, -- Whether the question was marked as Not Applicable
        
        -- Compliance Assessment
        isCompliant BIT, -- Whether the response indicates compliance
        requiresAction BIT DEFAULT 0, -- Whether corrective action is required
        
        -- Supporting Information
        findings NVARCHAR(MAX), -- Detailed findings or observations related to this question
        evidence NVARCHAR(MAX), -- Evidence or documentation references (file paths, document IDs, etc.)
        recommendations NVARCHAR(2000), -- Auditor recommendations based on this response
        
        -- Response Metadata
        respondedBy INT NOT NULL, -- Auditor who recorded the response
        respondedAt DATETIME2 DEFAULT GETDATE() NOT NULL, -- When the response was recorded
        
        -- Review and Verification
        reviewedBy INT, -- Reviewer who verified the response
        reviewedAt DATETIME2, -- When the response was reviewed
        reviewNotes NVARCHAR(2000), -- Review notes or comments
        
        -- Metadata
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistResponses_Audit FOREIGN KEY (auditId) REFERENCES Audits(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChecklistResponses_Template FOREIGN KEY (templateId) REFERENCES ChecklistTemplates(id),
        CONSTRAINT FK_ChecklistResponses_Question FOREIGN KEY (questionId) REFERENCES ChecklistQuestions(id),
        CONSTRAINT FK_ChecklistResponses_RespondedBy FOREIGN KEY (respondedBy) REFERENCES Users(id),
        CONSTRAINT FK_ChecklistResponses_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistResponses_ResponseType CHECK (responseType IN ('yesno', 'text', 'rating', 'na')),
        CONSTRAINT CK_ChecklistResponses_Response CHECK (
            (responseType = 'yesno' AND yesNoResponse IS NOT NULL)
            OR (responseType = 'text' AND textResponse IS NOT NULL)
            OR (responseType = 'rating' AND ratingResponse IS NOT NULL)
            OR (responseType = 'na' AND notApplicable = 1)
            OR (responseType = 'yesno' AND notApplicable = 1)
        ),
        
        -- Unique constraint to prevent duplicate responses for the same question in an audit
        CONSTRAINT UQ_ChecklistResponses_AuditQuestion UNIQUE (auditId, questionId)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Audit association (most common query pattern)
    CREATE INDEX IX_ChecklistResponses_AuditId ON ChecklistResponses(auditId);
    CREATE INDEX IX_ChecklistResponses_Audit_Template ON ChecklistResponses(auditId, templateId);
    
    -- Template and question lookups
    CREATE INDEX IX_ChecklistResponses_TemplateId ON ChecklistResponses(templateId);
    CREATE INDEX IX_ChecklistResponses_QuestionId ON ChecklistResponses(questionId);
    
    -- Compliance filtering
    CREATE INDEX IX_ChecklistResponses_IsCompliant ON ChecklistResponses(isCompliant) WHERE isCompliant IS NOT NULL;
    CREATE INDEX IX_ChecklistResponses_RequiresAction ON ChecklistResponses(requiresAction) WHERE requiresAction = 1;
    CREATE INDEX IX_ChecklistResponses_Audit_Compliance ON ChecklistResponses(auditId, isCompliant) WHERE isCompliant IS NOT NULL;
    
    -- Response type filtering
    CREATE INDEX IX_ChecklistResponses_ResponseType ON ChecklistResponses(responseType);
    CREATE INDEX IX_ChecklistResponses_NotApplicable ON ChecklistResponses(auditId, notApplicable) WHERE notApplicable = 1;
    
    -- Personnel tracking
    CREATE INDEX IX_ChecklistResponses_RespondedBy ON ChecklistResponses(respondedBy);
    CREATE INDEX IX_ChecklistResponses_ReviewedBy ON ChecklistResponses(reviewedBy) WHERE reviewedBy IS NOT NULL;
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistResponses_RespondedAt ON ChecklistResponses(respondedAt DESC);
    CREATE INDEX IX_ChecklistResponses_ReviewedAt ON ChecklistResponses(reviewedAt DESC) WHERE reviewedAt IS NOT NULL;
    CREATE INDEX IX_ChecklistResponses_CreatedAt ON ChecklistResponses(createdAt DESC);

    PRINT 'ChecklistResponses table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistResponses table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.30' AND scriptName = '30_create_checklist_responses_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.30',
        'Create ChecklistResponses table for audit checklist responses',
        '30_create_checklist_responses_table.sql',
        'SUCCESS',
        'ChecklistResponses table stores actual responses to checklist questions during audits. Supports multiple response types, compliance tracking, findings documentation, and evidence collection. Links audit execution to checklist templates.'
    );
END
GO
