-- =============================================
-- Improvement Ideas Table
-- =============================================
-- Stores improvement ideas submitted by users for continuous improvement initiatives
-- Supports ISO 9001 continuous improvement requirements and innovation tracking

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImprovementIdeas')
BEGIN
    CREATE TABLE ImprovementIdeas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Idea Identification
        ideaNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique idea identifier
        title NVARCHAR(500) NOT NULL, -- Idea title/summary
        description NVARCHAR(2000) NOT NULL, -- Detailed idea description
        
        -- Classification
        category NVARCHAR(200) NOT NULL, -- Idea category (process improvement, cost reduction, quality enhancement, safety, etc.)
        
        -- Impact Assessment
        expectedImpact NVARCHAR(2000), -- Expected impact of implementing the idea
        impactArea NVARCHAR(200), -- Area of impact (productivity, quality, cost, safety, customer satisfaction, etc.)
        
        -- Ownership and Accountability
        submittedBy INT NOT NULL, -- User who submitted the idea
        responsibleUser INT, -- User assigned to evaluate/implement the idea
        department NVARCHAR(100), -- Department or area associated with the idea
        
        -- Status and Timeline
        status NVARCHAR(50) NOT NULL DEFAULT 'submitted', -- Current status of the idea
        submittedDate DATETIME2 NOT NULL DEFAULT GETDATE(), -- Date idea was submitted
        reviewedDate DATETIME2, -- Date idea was reviewed
        implementedDate DATETIME2, -- Date idea was implemented (if approved and completed)
        
        -- Review and Evaluation
        reviewComments NVARCHAR(2000), -- Comments from reviewer
        reviewedBy INT, -- User who reviewed the idea
        
        -- Implementation Details
        implementationNotes NVARCHAR(2000), -- Notes on implementation
        estimatedCost DECIMAL(18,2), -- Estimated cost to implement
        estimatedBenefit NVARCHAR(1000), -- Estimated benefit from implementation
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ImprovementIdeas_SubmittedBy FOREIGN KEY (submittedBy) REFERENCES Users(id),
        CONSTRAINT FK_ImprovementIdeas_ResponsibleUser FOREIGN KEY (responsibleUser) REFERENCES Users(id),
        CONSTRAINT FK_ImprovementIdeas_ReviewedBy FOREIGN KEY (reviewedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ImprovementIdeas_Status CHECK (status IN (
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'in_progress',
            'implemented',
            'closed'
        )),
        CONSTRAINT CK_ImprovementIdeas_EstimatedCost CHECK (estimatedCost IS NULL OR estimatedCost >= 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_ImprovementIdeas_IdeaNumber ON ImprovementIdeas(ideaNumber);
    
    -- Status tracking
    CREATE INDEX IX_ImprovementIdeas_Status ON ImprovementIdeas(status);
    
    -- Date-based queries
    CREATE INDEX IX_ImprovementIdeas_SubmittedDate ON ImprovementIdeas(submittedDate DESC);
    CREATE INDEX IX_ImprovementIdeas_ReviewedDate ON ImprovementIdeas(reviewedDate);
    CREATE INDEX IX_ImprovementIdeas_ImplementedDate ON ImprovementIdeas(implementedDate);
    CREATE INDEX IX_ImprovementIdeas_CreatedAt ON ImprovementIdeas(createdAt DESC);
    
    -- Personnel tracking
    CREATE INDEX IX_ImprovementIdeas_SubmittedBy ON ImprovementIdeas(submittedBy);
    CREATE INDEX IX_ImprovementIdeas_ResponsibleUser ON ImprovementIdeas(responsibleUser);
    CREATE INDEX IX_ImprovementIdeas_ReviewedBy ON ImprovementIdeas(reviewedBy);
    
    -- Classification tracking
    CREATE INDEX IX_ImprovementIdeas_Category ON ImprovementIdeas(category);
    CREATE INDEX IX_ImprovementIdeas_Department ON ImprovementIdeas(department);
    CREATE INDEX IX_ImprovementIdeas_ImpactArea ON ImprovementIdeas(impactArea);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ImprovementIdeas_Status_SubmittedDate ON ImprovementIdeas(status, submittedDate DESC);
    CREATE INDEX IX_ImprovementIdeas_SubmittedBy_Status ON ImprovementIdeas(submittedBy, status);
    CREATE INDEX IX_ImprovementIdeas_ResponsibleUser_Status ON ImprovementIdeas(responsibleUser, status);
    CREATE INDEX IX_ImprovementIdeas_Category_Status ON ImprovementIdeas(category, status);
    
    -- Search optimization
    CREATE INDEX IX_ImprovementIdeas_Title ON ImprovementIdeas(title);

    PRINT 'ImprovementIdeas table created successfully';
END
ELSE
BEGIN
    PRINT 'ImprovementIdeas table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.41' AND scriptName = '41_create_improvement_ideas_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.41',
        'Create ImprovementIdeas table for continuous improvement tracking',
        '41_create_improvement_ideas_table.sql',
        'SUCCESS',
        'ImprovementIdeas table supports ISO 9001 continuous improvement with submission, review, and implementation tracking.'
    );
END
GO
