-- =============================================
-- Calibration Records Table
-- =============================================
-- Stores calibration records for equipment
-- Tracks calibration history, results, and compliance
-- Supports ISO 9001 calibration management requirements

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CalibrationRecords')
BEGIN
    CREATE TABLE CalibrationRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Equipment Reference
        equipmentId INT NOT NULL, -- Reference to Equipment table
        
        -- Calibration Scheduling
        calibrationDate DATETIME2 NOT NULL, -- Date calibration was performed
        dueDate DATETIME2, -- Date calibration was originally due
        nextDueDate DATETIME2, -- Date of next calibration due
        
        -- Personnel
        performedBy INT NOT NULL, -- User who performed the calibration
        approvedBy INT, -- User who approved/verified the calibration
        
        -- Calibration Details
        calibrationType NVARCHAR(100), -- Type of calibration (internal, external, etc.)
        calibrationStandard NVARCHAR(200), -- Standard or method used
        certificateNumber NVARCHAR(100), -- Certificate or reference number
        
        -- Results
        result NVARCHAR(50) NOT NULL DEFAULT 'pending', -- Result status
        resultValue NVARCHAR(500), -- Measured values or readings
        toleranceMin NVARCHAR(100), -- Minimum tolerance value
        toleranceMax NVARCHAR(100), -- Maximum tolerance value
        passed BIT NOT NULL DEFAULT 1, -- Pass/fail flag
        
        -- Additional Information
        findings NVARCHAR(2000), -- Observations or findings
        correctiveAction NVARCHAR(2000), -- Actions taken if failed
        attachments NVARCHAR(1000), -- File paths to calibration certificates/reports
        
        -- Status and Tracking
        status NVARCHAR(50) NOT NULL DEFAULT 'completed', -- Record status
        
        -- External Service Provider (if applicable)
        externalProvider NVARCHAR(200), -- External calibration service provider
        providerCertification NVARCHAR(200), -- Provider's certification/accreditation
        cost DECIMAL(10,2), -- Calibration cost
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT, -- User who created the record
        
        -- Foreign Key Constraints
        CONSTRAINT FK_CalibrationRecords_Equipment FOREIGN KEY (equipmentId) REFERENCES Equipment(id),
        CONSTRAINT FK_CalibrationRecords_PerformedBy FOREIGN KEY (performedBy) REFERENCES Users(id),
        CONSTRAINT FK_CalibrationRecords_ApprovedBy FOREIGN KEY (approvedBy) REFERENCES Users(id),
        CONSTRAINT FK_CalibrationRecords_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_CalibrationRecords_Result CHECK (result IN (
            'pending',
            'passed',
            'failed',
            'conditional'
        )),
        CONSTRAINT CK_CalibrationRecords_Status CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'overdue',
            'cancelled'
        )),
        CONSTRAINT CK_CalibrationRecords_Cost CHECK (cost IS NULL OR cost >= 0)
    );

    -- Indexes for Performance
    
    -- Equipment lookups
    CREATE INDEX IX_CalibrationRecords_EquipmentId ON CalibrationRecords(equipmentId);
    CREATE INDEX IX_CalibrationRecords_Equipment_Date ON CalibrationRecords(equipmentId, calibrationDate DESC);
    
    -- Date-based queries
    CREATE INDEX IX_CalibrationRecords_CalibrationDate ON CalibrationRecords(calibrationDate);
    CREATE INDEX IX_CalibrationRecords_DueDate ON CalibrationRecords(dueDate);
    CREATE INDEX IX_CalibrationRecords_NextDueDate ON CalibrationRecords(nextDueDate);
    
    -- Status and result tracking
    CREATE INDEX IX_CalibrationRecords_Status ON CalibrationRecords(status);
    CREATE INDEX IX_CalibrationRecords_Result ON CalibrationRecords(result);
    CREATE INDEX IX_CalibrationRecords_Passed ON CalibrationRecords(passed);
    
    -- Personnel tracking
    CREATE INDEX IX_CalibrationRecords_PerformedBy ON CalibrationRecords(performedBy);
    CREATE INDEX IX_CalibrationRecords_ApprovedBy ON CalibrationRecords(approvedBy);
    CREATE INDEX IX_CalibrationRecords_CreatedBy ON CalibrationRecords(createdBy);
    
    -- Certificate lookups
    CREATE INDEX IX_CalibrationRecords_CertificateNumber ON CalibrationRecords(certificateNumber);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_CalibrationRecords_Status_DueDate ON CalibrationRecords(status, dueDate);
    CREATE INDEX IX_CalibrationRecords_Equipment_Status ON CalibrationRecords(equipmentId, status);
    CREATE INDEX IX_CalibrationRecords_Equipment_Result ON CalibrationRecords(equipmentId, result);
    
    -- Audit trail
    CREATE INDEX IX_CalibrationRecords_CreatedAt ON CalibrationRecords(createdAt);

    PRINT 'CalibrationRecords table created successfully';
END
ELSE
BEGIN
    PRINT 'CalibrationRecords table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.14' AND scriptName = '14_create_calibration_records_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.14',
        'Create CalibrationRecords table for equipment calibration tracking',
        '14_create_calibration_records_table.sql',
        'SUCCESS',
        'CalibrationRecords table supports ISO 9001 calibration management with full audit trail and compliance tracking'
    );
END
GO
