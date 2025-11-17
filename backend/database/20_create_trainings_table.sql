-- =============================================
-- Trainings Table
-- =============================================
-- Stores training events/sessions metadata
-- Supports ISO 9001 competence and training management requirements
-- Training records track who attended and certificates issued

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Trainings')
BEGIN
    CREATE TABLE Trainings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Training Identification
        trainingNumber NVARCHAR(100) UNIQUE NOT NULL, -- Unique training identifier
        title NVARCHAR(500) NOT NULL, -- Training title/name
        description NVARCHAR(2000), -- Detailed description of training content
        
        -- Training Classification
        category NVARCHAR(100) NOT NULL, -- Category (e.g., 'Safety', 'Quality', 'Technical', 'Compliance')
        trainingType NVARCHAR(100), -- Type (e.g., 'Internal', 'External', 'Online', 'On-the-job')
        
        -- Training Details
        duration INT, -- Duration in minutes
        instructor NVARCHAR(200), -- Instructor name
        instructorOrganization NVARCHAR(200), -- Organization providing training (if external)
        location NVARCHAR(200), -- Training location
        
        -- Scheduling
        scheduledDate DATETIME2 NOT NULL, -- Scheduled date and time
        completedDate DATETIME2, -- Actual completion date
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'expired'
        
        -- Certification and Validity
        requiresCertification BIT DEFAULT 0, -- Whether certification is required
        expiryMonths INT, -- Certificate validity period in months (NULL = no expiry)
        
        -- Capacity and Requirements
        maxAttendees INT, -- Maximum number of attendees (NULL = unlimited)
        prerequisiteTraining INT NULL, -- Reference to prerequisite training (self-referential)
        
        -- Content and Materials
        learningObjectives NVARCHAR(2000), -- Learning objectives
        materials NVARCHAR(1000), -- Training materials reference or path
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this training
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Trainings_PrerequisiteTraining FOREIGN KEY (prerequisiteTraining) REFERENCES Trainings(id),
        CONSTRAINT FK_Trainings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Trainings_Status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'expired')),
        CONSTRAINT CK_Trainings_Duration CHECK (duration IS NULL OR duration > 0),
        CONSTRAINT CK_Trainings_MaxAttendees CHECK (maxAttendees IS NULL OR maxAttendees > 0),
        CONSTRAINT CK_Trainings_ExpiryMonths CHECK (expiryMonths IS NULL OR expiryMonths > 0)
    );

    -- Indexes for Performance
    
    -- Primary identifier lookups
    CREATE UNIQUE INDEX IX_Trainings_TrainingNumber ON Trainings(trainingNumber);
    
    -- Classification and filtering
    CREATE INDEX IX_Trainings_Category ON Trainings(category);
    CREATE INDEX IX_Trainings_TrainingType ON Trainings(trainingType);
    CREATE INDEX IX_Trainings_Status ON Trainings(status);
    
    -- Date-based queries
    CREATE INDEX IX_Trainings_ScheduledDate ON Trainings(scheduledDate);
    CREATE INDEX IX_Trainings_CompletedDate ON Trainings(completedDate);
    CREATE INDEX IX_Trainings_CreatedAt ON Trainings(createdAt);
    
    -- Relationships
    CREATE INDEX IX_Trainings_CreatedBy ON Trainings(createdBy);
    CREATE INDEX IX_Trainings_PrerequisiteTraining ON Trainings(prerequisiteTraining);
    CREATE INDEX IX_Trainings_Instructor ON Trainings(instructor);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Trainings_Status_ScheduledDate ON Trainings(status, scheduledDate);
    CREATE INDEX IX_Trainings_Category_Status ON Trainings(category, status);
    CREATE INDEX IX_Trainings_Status_Category_ScheduledDate ON Trainings(status, category, scheduledDate);
    
    -- Title search
    CREATE INDEX IX_Trainings_Title ON Trainings(title);

    PRINT 'Trainings table created successfully';
END
ELSE
BEGIN
    PRINT 'Trainings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.20' AND scriptName = '20_create_trainings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.20',
        'Create Trainings table for training events and sessions',
        '20_create_trainings_table.sql',
        'SUCCESS',
        'Trainings table supports ISO 9001 competence management with training event tracking and certification requirements'
    );
END
GO
