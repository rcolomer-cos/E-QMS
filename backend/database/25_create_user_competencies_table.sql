-- =============================================
-- UserCompetencies Table
-- =============================================
-- Maps users to their achieved competencies
-- Tracks competency acquisition, validity, expiration, and renewal
-- Supports ISO 9001 competence tracking and management

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserCompetencies')
BEGIN
    CREATE TABLE UserCompetencies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        userId INT NOT NULL, -- User who holds the competency
        competencyId INT NOT NULL, -- Reference to competency definition
        
        -- Acquisition Details
        acquiredDate DATETIME2 NOT NULL, -- Date competency was acquired
        acquisitionMethod NVARCHAR(200), -- How competency was acquired (e.g., 'Training', 'Assessment', 'Experience', 'Transfer')
        
        -- Training and Certificate References
        trainingId INT, -- Optional reference to training that provided this competency
        trainingAttendeeId INT, -- Optional reference to training attendance record
        certificateId INT, -- Optional reference to certificate
        
        -- Proficiency and Assessment
        proficiencyLevel NVARCHAR(100), -- Current proficiency level (e.g., 'Basic', 'Intermediate', 'Advanced', 'Expert')
        assessmentScore DECIMAL(5,2), -- Assessment score (0-100 scale)
        assessedBy INT, -- User who assessed the competency
        assessedAt DATETIME2, -- Date of assessment
        assessmentNotes NVARCHAR(1000), -- Notes from assessment
        
        -- Validity and Expiration
        effectiveDate DATETIME2 NOT NULL, -- Date competency becomes effective
        expiryDate DATETIME2, -- Date competency expires (NULL = no expiry)
        isExpired BIT GENERATED ALWAYS AS (
            CASE 
                WHEN expiryDate IS NOT NULL AND expiryDate < GETDATE() THEN 1
                ELSE 0
            END
        ) PERSISTED, -- Computed column for expiry status
        
        -- Renewal Tracking
        lastRenewalDate DATETIME2, -- Date of last renewal
        nextRenewalDate DATETIME2, -- Date of next required renewal
        renewalCount INT DEFAULT 0, -- Number of times renewed
        
        -- Status and Lifecycle
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'suspended', 'revoked', 'pending'
        statusReason NVARCHAR(500), -- Reason for current status (especially for suspended/revoked)
        statusChangedAt DATETIME2, -- When status last changed
        statusChangedBy INT, -- User who changed the status
        
        -- Verification and Approval
        verified BIT DEFAULT 0, -- Whether competency has been verified
        verifiedBy INT, -- User who verified the competency
        verifiedAt DATETIME2, -- Date of verification
        verificationMethod NVARCHAR(200), -- Method of verification
        verificationNotes NVARCHAR(1000), -- Notes on verification
        
        -- Evidence and Documentation
        evidenceDescription NVARCHAR(2000), -- Description of evidence supporting competency
        evidenceFileIds NVARCHAR(500), -- Comma-separated attachment IDs for evidence files
        
        -- Additional Information
        notes NVARCHAR(2000), -- Additional notes or comments
        externalReference NVARCHAR(500), -- External reference (e.g., license number)
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NOT NULL, -- User who created this competency record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_UserCompetencies_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_Competency FOREIGN KEY (competencyId) REFERENCES Competencies(id),
        CONSTRAINT FK_UserCompetencies_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_UserCompetencies_TrainingAttendee FOREIGN KEY (trainingAttendeeId) REFERENCES TrainingAttendees(id),
        CONSTRAINT FK_UserCompetencies_Certificate FOREIGN KEY (certificateId) REFERENCES TrainingCertificates(id),
        CONSTRAINT FK_UserCompetencies_AssessedBy FOREIGN KEY (assessedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_StatusChangedBy FOREIGN KEY (statusChangedBy) REFERENCES Users(id),
        CONSTRAINT FK_UserCompetencies_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_UserCompetencies_Status CHECK (status IN (
            'active',
            'expired',
            'suspended',
            'revoked',
            'pending'
        )),
        CONSTRAINT CK_UserCompetencies_AssessmentScore CHECK (assessmentScore IS NULL OR (assessmentScore >= 0 AND assessmentScore <= 100)),
        CONSTRAINT CK_UserCompetencies_RenewalCount CHECK (renewalCount >= 0),
        
        -- Unique constraint: A user can have only one active record per competency
        -- This allows historical records but prevents duplicates
        CONSTRAINT UQ_UserCompetencies_User_Competency_Status UNIQUE (userId, competencyId, status)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_UserCompetencies_UserId ON UserCompetencies(userId);
    CREATE INDEX IX_UserCompetencies_CompetencyId ON UserCompetencies(competencyId);
    
    -- Status and lifecycle
    CREATE INDEX IX_UserCompetencies_Status ON UserCompetencies(status);
    CREATE INDEX IX_UserCompetencies_IsExpired ON UserCompetencies(isExpired);
    CREATE INDEX IX_UserCompetencies_Verified ON UserCompetencies(verified);
    
    -- Date-based queries
    CREATE INDEX IX_UserCompetencies_AcquiredDate ON UserCompetencies(acquiredDate);
    CREATE INDEX IX_UserCompetencies_EffectiveDate ON UserCompetencies(effectiveDate);
    CREATE INDEX IX_UserCompetencies_ExpiryDate ON UserCompetencies(expiryDate);
    CREATE INDEX IX_UserCompetencies_NextRenewalDate ON UserCompetencies(nextRenewalDate);
    CREATE INDEX IX_UserCompetencies_LastRenewalDate ON UserCompetencies(lastRenewalDate);
    CREATE INDEX IX_UserCompetencies_AssessedAt ON UserCompetencies(assessedAt);
    CREATE INDEX IX_UserCompetencies_VerifiedAt ON UserCompetencies(verifiedAt);
    CREATE INDEX IX_UserCompetencies_StatusChangedAt ON UserCompetencies(statusChangedAt);
    
    -- Relationship tracking
    CREATE INDEX IX_UserCompetencies_TrainingId ON UserCompetencies(trainingId);
    CREATE INDEX IX_UserCompetencies_TrainingAttendeeId ON UserCompetencies(trainingAttendeeId);
    CREATE INDEX IX_UserCompetencies_CertificateId ON UserCompetencies(certificateId);
    CREATE INDEX IX_UserCompetencies_AssessedBy ON UserCompetencies(assessedBy);
    CREATE INDEX IX_UserCompetencies_VerifiedBy ON UserCompetencies(verifiedBy);
    CREATE INDEX IX_UserCompetencies_StatusChangedBy ON UserCompetencies(statusChangedBy);
    CREATE INDEX IX_UserCompetencies_CreatedBy ON UserCompetencies(createdBy);
    
    -- Proficiency and assessment
    CREATE INDEX IX_UserCompetencies_ProficiencyLevel ON UserCompetencies(proficiencyLevel);
    CREATE INDEX IX_UserCompetencies_AcquisitionMethod ON UserCompetencies(acquisitionMethod);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_UserCompetencies_User_Status ON UserCompetencies(userId, status);
    CREATE INDEX IX_UserCompetencies_User_Competency ON UserCompetencies(userId, competencyId);
    CREATE INDEX IX_UserCompetencies_Competency_Status ON UserCompetencies(competencyId, status);
    CREATE INDEX IX_UserCompetencies_Status_ExpiryDate ON UserCompetencies(status, expiryDate);
    CREATE INDEX IX_UserCompetencies_User_EffectiveDate ON UserCompetencies(userId, effectiveDate);
    CREATE INDEX IX_UserCompetencies_User_ExpiryDate ON UserCompetencies(userId, expiryDate) WHERE expiryDate IS NOT NULL;
    CREATE INDEX IX_UserCompetencies_Status_NextRenewal ON UserCompetencies(status, nextRenewalDate) WHERE nextRenewalDate IS NOT NULL;
    CREATE INDEX IX_UserCompetencies_User_Status_Expiry ON UserCompetencies(userId, status, isExpired);
    CREATE INDEX IX_UserCompetencies_Expired_Users ON UserCompetencies(isExpired, userId) WHERE isExpired = 1;
    CREATE INDEX IX_UserCompetencies_Training_User ON UserCompetencies(trainingId, userId) WHERE trainingId IS NOT NULL;
    
    -- Audit trail
    CREATE INDEX IX_UserCompetencies_CreatedAt ON UserCompetencies(createdAt);
    CREATE INDEX IX_UserCompetencies_UpdatedAt ON UserCompetencies(updatedAt);

    PRINT 'UserCompetencies table created successfully';
END
ELSE
BEGIN
    PRINT 'UserCompetencies table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.25' AND scriptName = '25_create_user_competencies_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.25',
        'Create UserCompetencies table for user-to-competency mapping',
        '25_create_user_competencies_table.sql',
        'SUCCESS',
        'UserCompetencies table supports ISO 9001 competence tracking with acquisition tracking, validity periods, expiration rules, renewal management, and verification workflows'
    );
END
GO
