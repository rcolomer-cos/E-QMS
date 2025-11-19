-- =============================================
-- SWOT Analysis Table
-- =============================================
-- Stores SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis entries
-- Supports strategic planning and management reviews within ISO 9001 framework

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SwotEntries')
BEGIN
    CREATE TABLE SwotEntries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- SWOT Entry Details
        title NVARCHAR(500) NOT NULL, -- Entry title/summary
        description NVARCHAR(2000), -- Detailed description
        category NVARCHAR(50) NOT NULL, -- Category: Strength, Weakness, Opportunity, or Threat
        
        -- Metadata
        owner INT, -- User responsible for this entry
        priority NVARCHAR(50), -- Priority level (low, medium, high, critical)
        reviewDate DATETIME2, -- Last review date
        nextReviewDate DATETIME2, -- Next scheduled review date
        
        -- Status
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- Status: active, archived, addressed
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the entry
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SwotEntries_Owner FOREIGN KEY (owner) REFERENCES Users(id),
        CONSTRAINT FK_SwotEntries_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SwotEntries_Category CHECK (category IN (
            'Strength',
            'Weakness',
            'Opportunity',
            'Threat'
        )),
        CONSTRAINT CK_SwotEntries_Priority CHECK (priority IN (
            'low',
            'medium',
            'high',
            'critical'
        ) OR priority IS NULL),
        CONSTRAINT CK_SwotEntries_Status CHECK (status IN (
            'active',
            'archived',
            'addressed'
        ))
    );

    -- Indexes for Performance
    
    -- Category lookups (most common query pattern)
    CREATE INDEX IX_SwotEntries_Category ON SwotEntries(category);
    CREATE INDEX IX_SwotEntries_Status ON SwotEntries(status);
    CREATE INDEX IX_SwotEntries_Category_Status ON SwotEntries(category, status);
    
    -- Priority tracking
    CREATE INDEX IX_SwotEntries_Priority ON SwotEntries(priority);
    
    -- Date-based queries
    CREATE INDEX IX_SwotEntries_ReviewDate ON SwotEntries(reviewDate);
    CREATE INDEX IX_SwotEntries_NextReviewDate ON SwotEntries(nextReviewDate);
    CREATE INDEX IX_SwotEntries_CreatedAt ON SwotEntries(createdAt DESC);
    
    -- Personnel tracking
    CREATE INDEX IX_SwotEntries_Owner ON SwotEntries(owner);
    CREATE INDEX IX_SwotEntries_CreatedBy ON SwotEntries(createdBy);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SwotEntries_Status_Priority ON SwotEntries(status, priority);
    CREATE INDEX IX_SwotEntries_Owner_Status ON SwotEntries(owner, status);
    
    -- Search optimization
    CREATE INDEX IX_SwotEntries_Title ON SwotEntries(title);

    PRINT 'SwotEntries table created successfully';
END
ELSE
BEGIN
    PRINT 'SwotEntries table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.64' AND scriptName = '64_swot.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.64',
        'Create SwotEntries table for SWOT analysis',
        '64_swot.sql',
        'SUCCESS',
        'SwotEntries table supports strategic planning and management reviews with categorization by Strengths, Weaknesses, Opportunities, and Threats'
    );
END
GO
