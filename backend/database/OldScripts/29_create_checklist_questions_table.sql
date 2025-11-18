-- =============================================
-- Checklist Questions Table
-- =============================================
-- Stores questions that belong to checklist templates
-- Each question includes expected outcomes and criteria for evaluation
-- Supports structured audit checklist management

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistQuestions')
BEGIN
    CREATE TABLE ChecklistQuestions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Question Association
        templateId INT NOT NULL, -- Reference to the checklist template
        
        -- Question Identification
        questionNumber NVARCHAR(20) NOT NULL, -- Question number within the template (e.g., '1.1', '2.3')
        questionText NVARCHAR(2000) NOT NULL, -- The actual question text
        
        -- Question Details
        category NVARCHAR(100), -- Question category or clause reference (e.g., 'ISO 9001:2015 - Clause 4.1')
        section NVARCHAR(100), -- Section or area being evaluated
        
        -- Expected Outcomes and Criteria
        expectedOutcome NVARCHAR(2000), -- Expected outcome or criteria for compliance
        guidance NVARCHAR(2000), -- Guidance notes for auditors on how to evaluate
        
        -- Question Configuration
        questionType NVARCHAR(50) NOT NULL DEFAULT 'yesno', -- Type: yesno, text, rating, checklist, na
        isMandatory BIT DEFAULT 1, -- Whether this question must be answered
        allowNA BIT DEFAULT 1, -- Whether "Not Applicable" is allowed as a response
        requiresEvidence BIT DEFAULT 0, -- Whether evidence/documentation is required
        
        -- Rating Configuration (for rating type questions)
        minRating INT, -- Minimum rating value
        maxRating INT, -- Maximum rating value
        passingScore INT, -- Minimum passing score for compliance
        
        -- Question Order
        displayOrder INT NOT NULL, -- Order in which question should appear
        
        -- Metadata
        createdBy INT NOT NULL, -- User who created the question
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ChecklistQuestions_Template FOREIGN KEY (templateId) REFERENCES ChecklistTemplates(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChecklistQuestions_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Check Constraints
        CONSTRAINT CK_ChecklistQuestions_QuestionType CHECK (questionType IN ('yesno', 'text', 'rating', 'checklist', 'na')),
        CONSTRAINT CK_ChecklistQuestions_Rating CHECK (
            (questionType = 'rating' AND minRating IS NOT NULL AND maxRating IS NOT NULL AND minRating < maxRating)
            OR (questionType != 'rating')
        )
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Template association (most common query pattern)
    CREATE INDEX IX_ChecklistQuestions_TemplateId ON ChecklistQuestions(templateId);
    CREATE INDEX IX_ChecklistQuestions_Template_DisplayOrder ON ChecklistQuestions(templateId, displayOrder);
    
    -- Question number lookups
    CREATE INDEX IX_ChecklistQuestions_QuestionNumber ON ChecklistQuestions(templateId, questionNumber);
    
    -- Category and section filtering
    CREATE INDEX IX_ChecklistQuestions_Category ON ChecklistQuestions(category) WHERE category IS NOT NULL;
    CREATE INDEX IX_ChecklistQuestions_Section ON ChecklistQuestions(section) WHERE section IS NOT NULL;
    
    -- Question type filtering
    CREATE INDEX IX_ChecklistQuestions_QuestionType ON ChecklistQuestions(questionType);
    
    -- Mandatory questions filtering
    CREATE INDEX IX_ChecklistQuestions_IsMandatory ON ChecklistQuestions(templateId, isMandatory);
    
    -- Creator tracking
    CREATE INDEX IX_ChecklistQuestions_CreatedBy ON ChecklistQuestions(createdBy);
    
    -- Timestamp tracking
    CREATE INDEX IX_ChecklistQuestions_CreatedAt ON ChecklistQuestions(createdAt DESC);

    PRINT 'ChecklistQuestions table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ChecklistQuestions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.29' AND scriptName = '29_create_checklist_questions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.29',
        'Create ChecklistQuestions table for checklist template questions',
        '29_create_checklist_questions_table.sql',
        'SUCCESS',
        'ChecklistQuestions table stores questions that belong to checklist templates with expected outcomes, evaluation criteria, and flexible question types. Supports structured audit checklist management with various question formats.'
    );
END
GO
