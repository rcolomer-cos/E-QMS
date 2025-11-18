-- =============================================
-- Sync Logs Table
-- =============================================
-- Stores execution history and results of sync operations
-- Provides audit trail for all sync runs

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncLogs')
BEGIN
    CREATE TABLE SyncLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference to Configuration
        configurationId INT NOT NULL,
        
        -- Run Information
        runId NVARCHAR(100) NOT NULL, -- Unique identifier for this sync run
        status NVARCHAR(50) NOT NULL, -- Current status of this run
        
        -- Timing Information
        startedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        completedAt DATETIME2, -- Time when sync completed
        durationSeconds INT, -- Duration in seconds
        
        -- Processing Statistics
        recordsProcessed INT DEFAULT 0, -- Total records processed
        recordsCreated INT DEFAULT 0, -- Records created in target system
        recordsUpdated INT DEFAULT 0, -- Records updated in target system
        recordsSkipped INT DEFAULT 0, -- Records skipped (no changes)
        recordsFailed INT DEFAULT 0, -- Records that failed to process
        recordsConflicted INT DEFAULT 0, -- Records with conflicts
        
        -- Data Range
        fromTimestamp DATETIME2, -- Start of data range synced
        toTimestamp DATETIME2, -- End of data range synced
        fromRecordId INT, -- Starting record ID (for ID-based sync)
        toRecordId INT, -- Ending record ID (for ID-based sync)
        
        -- Result Information
        resultMessage NVARCHAR(MAX), -- Detailed result message
        errorMessage NVARCHAR(MAX), -- Error message if failed
        errorStack NVARCHAR(MAX), -- Error stack trace
        
        -- Performance Metrics
        apiCallsCount INT DEFAULT 0, -- Number of API calls made
        avgResponseTimeMs INT, -- Average API response time in milliseconds
        totalDataSizeBytes BIGINT, -- Total size of data transferred
        
        -- Retry Information
        retryCount INT DEFAULT 0, -- Number of retries attempted
        previousLogId INT NULL, -- Reference to previous log if this is a retry
        
        -- Metadata
        triggeredBy NVARCHAR(50), -- How sync was triggered (scheduled, manual, api)
        triggeredByUserId INT NULL, -- User who triggered manual sync
        serverHostname NVARCHAR(200), -- Server hostname that executed the sync
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncLogs_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncLogs_TriggeredByUser FOREIGN KEY (triggeredByUserId) REFERENCES Users(id),
        CONSTRAINT FK_SyncLogs_PreviousLog FOREIGN KEY (previousLogId) REFERENCES SyncLogs(id),
        
        -- Constraints
        CONSTRAINT CK_SyncLogs_Status CHECK (status IN (
            'queued',
            'in_progress',
            'success',
            'partial',
            'failed',
            'cancelled',
            'timeout'
        )),
        CONSTRAINT CK_SyncLogs_TriggeredBy CHECK (triggeredBy IN (
            'scheduled',
            'manual',
            'api',
            'webhook',
            'retry'
        )),
        CONSTRAINT CK_SyncLogs_DurationSeconds CHECK (durationSeconds IS NULL OR durationSeconds >= 0),
        CONSTRAINT CK_SyncLogs_RecordCounts CHECK (
            recordsProcessed >= 0 AND
            recordsCreated >= 0 AND
            recordsUpdated >= 0 AND
            recordsSkipped >= 0 AND
            recordsFailed >= 0 AND
            recordsConflicted >= 0
        )
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE UNIQUE INDEX IX_SyncLogs_RunId ON SyncLogs(runId);
    CREATE INDEX IX_SyncLogs_ConfigurationId ON SyncLogs(configurationId);
    
    -- Status tracking
    CREATE INDEX IX_SyncLogs_Status ON SyncLogs(status);
    CREATE INDEX IX_SyncLogs_StartedAt ON SyncLogs(startedAt DESC);
    CREATE INDEX IX_SyncLogs_CompletedAt ON SyncLogs(completedAt DESC);
    
    -- Trigger information
    CREATE INDEX IX_SyncLogs_TriggeredBy ON SyncLogs(triggeredBy);
    CREATE INDEX IX_SyncLogs_TriggeredByUserId ON SyncLogs(triggeredByUserId);
    
    -- Retry tracking
    CREATE INDEX IX_SyncLogs_PreviousLogId ON SyncLogs(previousLogId);
    CREATE INDEX IX_SyncLogs_RetryCount ON SyncLogs(retryCount);
    
    -- Audit trail
    CREATE INDEX IX_SyncLogs_CreatedAt ON SyncLogs(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncLogs_ConfigurationId_Status ON SyncLogs(configurationId, status);
    CREATE INDEX IX_SyncLogs_ConfigurationId_StartedAt ON SyncLogs(configurationId, startedAt DESC);
    CREATE INDEX IX_SyncLogs_Status_StartedAt ON SyncLogs(status, startedAt DESC);
    CREATE INDEX IX_SyncLogs_ConfigurationId_Status_StartedAt ON SyncLogs(configurationId, status, startedAt DESC);

    PRINT 'SyncLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncLogs table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.47' AND scriptName = '47_create_sync_logs_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.47',
        'Create SyncLogs table for sync execution tracking',
        '47_create_sync_logs_table.sql',
        'SUCCESS',
        'SyncLogs table provides audit trail and execution history for all sync operations with performance metrics'
    );
END
GO
