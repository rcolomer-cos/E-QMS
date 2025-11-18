-- Migration: Create ReminderLogs table
-- Description: Table to store execution logs for automated reminder tasks
-- Version: 44
-- Date: 2025-01-18

USE eqms;
GO

-- Create ReminderLogs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReminderLogs' AND type = 'U')
BEGIN
    CREATE TABLE ReminderLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        reminderType NVARCHAR(50) NOT NULL, -- 'training_expiry', 'equipment_calibration', 'equipment_maintenance', 'capa_deadline'
        executionTime DATETIME NOT NULL DEFAULT GETDATE(),
        status NVARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
        itemsProcessed INT DEFAULT 0,
        itemsNotified INT DEFAULT 0,
        errorMessage NVARCHAR(MAX),
        executionDurationMs INT, -- Duration in milliseconds
        configuration NVARCHAR(MAX), -- JSON with execution parameters
        details NVARCHAR(MAX), -- JSON with detailed results
        createdAt DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT CK_ReminderLogs_Status CHECK (status IN ('success', 'failed', 'partial')),
        CONSTRAINT CK_ReminderLogs_Type CHECK (reminderType IN (
            'training_expiry', 
            'equipment_calibration', 
            'equipment_maintenance', 
            'capa_deadline',
            'all_reminders'
        ))
    );
    
    -- Create indexes for performance
    CREATE INDEX IX_ReminderLogs_Type ON ReminderLogs(reminderType);
    CREATE INDEX IX_ReminderLogs_ExecutionTime ON ReminderLogs(executionTime DESC);
    CREATE INDEX IX_ReminderLogs_Status ON ReminderLogs(status);
    
    PRINT 'ReminderLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'ReminderLogs table already exists';
END
GO

-- Record migration in DatabaseVersion table
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion' AND type = 'U')
BEGIN
    IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = 44)
    BEGIN
        INSERT INTO DatabaseVersion (version, description, appliedAt)
        VALUES (44, 'Create ReminderLogs table for automated reminder task logging', GETDATE());
        PRINT 'Migration version 44 recorded in DatabaseVersion';
    END
END
GO

PRINT 'Migration 44 completed successfully';
GO
