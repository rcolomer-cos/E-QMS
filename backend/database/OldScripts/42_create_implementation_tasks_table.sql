-- =============================================
-- Implementation Tasks Table
-- =============================================
-- Tracks individual tasks for implementing approved improvement ideas
-- Supports ISO 9001 continuous improvement with progress tracking and accountability

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImplementationTasks')
BEGIN
    CREATE TABLE ImplementationTasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Link to Improvement Idea
        improvementIdeaId INT NOT NULL,
        
        -- Task Details
        taskName NVARCHAR(500) NOT NULL, -- Name/title of the task
        taskDescription NVARCHAR(2000), -- Detailed description of what needs to be done
        
        -- Assignment and Accountability
        assignedTo INT, -- User assigned to complete this task
        
        -- Timeline
        deadline DATETIME2, -- Expected completion date
        startedDate DATETIME2, -- Date task work began
        completedDate DATETIME2, -- Date task was actually completed
        
        -- Progress Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Current status
        progressPercentage INT DEFAULT 0, -- Progress percentage (0-100)
        
        -- Completion Evidence
        completionEvidence NVARCHAR(2000), -- Evidence or notes about task completion
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL,
        updatedAt DATETIME2 DEFAULT GETDATE(),
        updatedBy INT,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ImplementationTasks_ImprovementIdea FOREIGN KEY (improvementIdeaId) 
            REFERENCES ImprovementIdeas(id) ON DELETE CASCADE,
        CONSTRAINT FK_ImplementationTasks_AssignedTo FOREIGN KEY (assignedTo) 
            REFERENCES Users(id),
        CONSTRAINT FK_ImplementationTasks_CreatedBy FOREIGN KEY (createdBy) 
            REFERENCES Users(id),
        CONSTRAINT FK_ImplementationTasks_UpdatedBy FOREIGN KEY (updatedBy) 
            REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_ImplementationTasks_Status CHECK (status IN (
            'pending',      -- Not started yet
            'in_progress',  -- Currently being worked on
            'completed',    -- Task finished
            'blocked',      -- Blocked by dependencies or issues
            'cancelled'     -- Task cancelled
        )),
        CONSTRAINT CK_ImplementationTasks_ProgressPercentage 
            CHECK (progressPercentage >= 0 AND progressPercentage <= 100),
        CONSTRAINT CK_ImplementationTasks_CompletedDateLogic 
            CHECK (
                (status = 'completed' AND completedDate IS NOT NULL) OR 
                (status != 'completed' AND completedDate IS NULL)
            )
    );

    -- Indexes for Performance
    
    -- Link to improvement idea (most common query)
    CREATE INDEX IX_ImplementationTasks_ImprovementIdeaId 
        ON ImplementationTasks(improvementIdeaId);
    
    -- Status tracking
    CREATE INDEX IX_ImplementationTasks_Status 
        ON ImplementationTasks(status);
    
    -- Assignment tracking
    CREATE INDEX IX_ImplementationTasks_AssignedTo 
        ON ImplementationTasks(assignedTo);
    
    -- Deadline tracking
    CREATE INDEX IX_ImplementationTasks_Deadline 
        ON ImplementationTasks(deadline);
    
    -- Completion tracking
    CREATE INDEX IX_ImplementationTasks_CompletedDate 
        ON ImplementationTasks(completedDate);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_ImplementationTasks_IdeaId_Status 
        ON ImplementationTasks(improvementIdeaId, status);
    CREATE INDEX IX_ImplementationTasks_AssignedTo_Status 
        ON ImplementationTasks(assignedTo, status);
    CREATE INDEX IX_ImplementationTasks_Status_Deadline 
        ON ImplementationTasks(status, deadline);
    
    -- Audit trail
    CREATE INDEX IX_ImplementationTasks_CreatedAt 
        ON ImplementationTasks(createdAt DESC);

    PRINT 'ImplementationTasks table created successfully';
END
ELSE
BEGIN
    PRINT 'ImplementationTasks table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.42' AND scriptName = '42_create_implementation_tasks_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.42',
        'Create ImplementationTasks table for tracking improvement idea implementation',
        '42_create_implementation_tasks_table.sql',
        'SUCCESS',
        'ImplementationTasks table tracks individual tasks for implementing approved improvements with deadlines, assignments, and completion evidence.'
    );
END
GO
