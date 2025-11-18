-- =============================================
-- TrainingAttendees Table
-- =============================================
-- Junction table linking users to training sessions
-- Tracks attendance, performance, and completion status
-- Supports ISO 9001 training records and competence tracking

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingAttendees')
BEGIN
    CREATE TABLE TrainingAttendees (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationships
        trainingId INT NOT NULL, -- Reference to training event
        userId INT NOT NULL, -- Reference to user/employee
        
        -- Attendance Tracking
        attended BIT DEFAULT 0, -- Whether the user attended the training
        attendanceDate DATETIME2, -- Date of attendance (may differ from scheduled date)
        
        -- Performance and Assessment
        score DECIMAL(5,2), -- Score/grade (0-100 scale)
        passed BIT, -- Whether the user passed (if applicable)
        assessmentNotes NVARCHAR(1000), -- Notes on performance or assessment
        
        -- Certificate Information
        certificateIssued BIT DEFAULT 0, -- Whether certificate was issued
        certificateNumber NVARCHAR(100), -- Certificate number/identifier
        certificateDate DATETIME2, -- Date certificate was issued
        expiryDate DATETIME2, -- Certificate expiry date (calculated from training.expiryMonths)
        
        -- Certificate File Reference
        -- Note: Actual certificate files are stored in Attachments table with entityType='training' and entityId=this.id
        certificateFileId INT, -- Optional direct reference to certificate attachment
        
        -- Training Status
        status NVARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'completed', 'failed', 'expired', 'cancelled'
        
        -- Additional Information
        registrationDate DATETIME2 DEFAULT GETDATE(), -- When user was registered for training
        completionDate DATETIME2, -- Date training was completed
        notes NVARCHAR(1000), -- Additional notes or comments
        
        -- Verification and Approval
        verifiedBy INT, -- User who verified attendance/completion
        verifiedAt DATETIME2, -- When verification was done
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who registered this attendee
        
        -- Foreign Key Constraints
        CONSTRAINT FK_TrainingAttendees_Training FOREIGN KEY (trainingId) REFERENCES Trainings(id),
        CONSTRAINT FK_TrainingAttendees_User FOREIGN KEY (userId) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_VerifiedBy FOREIGN KEY (verifiedBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_TrainingAttendees_CertificateFile FOREIGN KEY (certificateFileId) REFERENCES Attachments(id),
        
        -- Constraints
        CONSTRAINT CK_TrainingAttendees_Status CHECK (status IN (
            'registered',
            'attended',
            'completed',
            'failed',
            'expired',
            'cancelled'
        )),
        CONSTRAINT CK_TrainingAttendees_Score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
        
        -- Unique constraint: A user can only be registered once per training
        CONSTRAINT UQ_TrainingAttendees_Training_User UNIQUE (trainingId, userId)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_TrainingAttendees_TrainingId ON TrainingAttendees(trainingId);
    CREATE INDEX IX_TrainingAttendees_UserId ON TrainingAttendees(userId);
    
    -- Status and attendance tracking
    CREATE INDEX IX_TrainingAttendees_Status ON TrainingAttendees(status);
    CREATE INDEX IX_TrainingAttendees_Attended ON TrainingAttendees(attended);
    CREATE INDEX IX_TrainingAttendees_Passed ON TrainingAttendees(passed);
    CREATE INDEX IX_TrainingAttendees_CertificateIssued ON TrainingAttendees(certificateIssued);
    
    -- Date-based queries
    CREATE INDEX IX_TrainingAttendees_AttendanceDate ON TrainingAttendees(attendanceDate);
    CREATE INDEX IX_TrainingAttendees_CertificateDate ON TrainingAttendees(certificateDate);
    CREATE INDEX IX_TrainingAttendees_ExpiryDate ON TrainingAttendees(expiryDate);
    CREATE INDEX IX_TrainingAttendees_CompletionDate ON TrainingAttendees(completionDate);
    CREATE INDEX IX_TrainingAttendees_RegistrationDate ON TrainingAttendees(registrationDate);
    
    -- Certificate tracking
    CREATE INDEX IX_TrainingAttendees_CertificateNumber ON TrainingAttendees(certificateNumber);
    CREATE INDEX IX_TrainingAttendees_CertificateFileId ON TrainingAttendees(certificateFileId);
    
    -- Verification tracking
    CREATE INDEX IX_TrainingAttendees_VerifiedBy ON TrainingAttendees(verifiedBy);
    CREATE INDEX IX_TrainingAttendees_VerifiedAt ON TrainingAttendees(verifiedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_TrainingAttendees_User_Status ON TrainingAttendees(userId, status);
    CREATE INDEX IX_TrainingAttendees_Training_Status ON TrainingAttendees(trainingId, status);
    CREATE INDEX IX_TrainingAttendees_User_Expiry ON TrainingAttendees(userId, expiryDate) WHERE certificateIssued = 1;
    CREATE INDEX IX_TrainingAttendees_Training_Attended ON TrainingAttendees(trainingId, attended);
    CREATE INDEX IX_TrainingAttendees_Status_ExpiryDate ON TrainingAttendees(status, expiryDate) WHERE certificateIssued = 1;

    PRINT 'TrainingAttendees table created successfully';
END
ELSE
BEGIN
    PRINT 'TrainingAttendees table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.22' AND scriptName = '22_create_training_attendees_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.22',
        'Create TrainingAttendees table for training records and certificates',
        '22_create_training_attendees_table.sql',
        'SUCCESS',
        'TrainingAttendees table supports ISO 9001 training records with attendance tracking, assessment, and certificate management'
    );
END
GO
