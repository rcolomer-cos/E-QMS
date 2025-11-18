-- =============================================
-- Sync Configurations Table
-- =============================================
-- Stores configuration for ERP/MES integration sync adapters
-- Supports scheduled sync runs with external systems

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncConfigurations')
BEGIN
    CREATE TABLE SyncConfigurations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Configuration Identity
        name NVARCHAR(200) NOT NULL, -- Human-readable name for this sync configuration
        description NVARCHAR(2000), -- Description of what this sync does
        
        -- System Information
        systemType NVARCHAR(50) NOT NULL, -- Type of external system (ERP, MES, etc.)
        systemName NVARCHAR(200) NOT NULL, -- Name of the external system
        
        -- Connection Configuration
        connectionString NVARCHAR(MAX), -- Encrypted connection string
        apiEndpoint NVARCHAR(500), -- API endpoint URL if REST-based
        authType NVARCHAR(50), -- Authentication type (basic, oauth, apikey, windows)
        authCredentials NVARCHAR(MAX), -- Encrypted authentication credentials
        
        -- Sync Configuration
        syncDirection NVARCHAR(50) NOT NULL, -- Direction of sync (inbound, outbound, bidirectional)
        syncType NVARCHAR(50) NOT NULL, -- Type of sync (full, delta, incremental)
        entityType NVARCHAR(100) NOT NULL, -- Entity being synced (equipment, orders, suppliers, etc.)
        
        -- Scheduling
        enabled BIT DEFAULT 1, -- Whether this sync is active
        scheduleType NVARCHAR(50) NOT NULL DEFAULT 'manual', -- Scheduling type (manual, cron, interval)
        cronExpression NVARCHAR(100), -- Cron expression for scheduled runs
        intervalMinutes INT, -- Interval in minutes for interval-based scheduling
        
        -- Delta Detection
        deltaEnabled BIT DEFAULT 1, -- Enable delta/change detection
        deltaField NVARCHAR(100), -- Field used for delta detection (lastModified, version, etc.)
        lastSyncTimestamp DATETIME2, -- Timestamp of last successful sync
        lastSyncRecordId INT, -- Last record ID synced (for ID-based delta)
        
        -- Conflict Handling
        conflictStrategy NVARCHAR(50) NOT NULL DEFAULT 'log', -- Strategy for conflicts (log, source_wins, target_wins, manual)
        
        -- Mapping Configuration
        mappingConfigJson NVARCHAR(MAX), -- JSON configuration for field mappings
        
        -- Performance Settings
        batchSize INT DEFAULT 100, -- Number of records to process in each batch
        timeoutSeconds INT DEFAULT 300, -- Timeout for sync operations
        maxRetries INT DEFAULT 3, -- Maximum retry attempts on failure
        
        -- Status Tracking
        lastRunAt DATETIME2, -- Last time this sync ran
        lastRunStatus NVARCHAR(50), -- Status of last run (success, failed, partial)
        lastRunDuration INT, -- Duration of last run in seconds
        lastRunRecordsProcessed INT, -- Number of records processed in last run
        lastRunRecordsFailed INT, -- Number of records that failed in last run
        lastRunErrorMessage NVARCHAR(MAX), -- Error message from last run if failed
        nextRunAt DATETIME2, -- Scheduled next run time
        
        -- Statistics
        totalRunsCount INT DEFAULT 0, -- Total number of runs
        successfulRunsCount INT DEFAULT 0, -- Number of successful runs
        failedRunsCount INT DEFAULT 0, -- Number of failed runs
        totalRecordsProcessed INT DEFAULT 0, -- Total records processed across all runs
        totalRecordsFailed INT DEFAULT 0, -- Total records failed across all runs
        
        -- Audit Trail
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deactivatedAt DATETIME2,
        deactivatedBy INT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncConfigurations_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_SyncConfigurations_DeactivatedBy FOREIGN KEY (deactivatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SyncConfigurations_SystemType CHECK (systemType IN (
            'ERP',
            'MES',
            'WMS',
            'CRM',
            'PLM',
            'Other'
        )),
        CONSTRAINT CK_SyncConfigurations_SyncDirection CHECK (syncDirection IN (
            'inbound',
            'outbound',
            'bidirectional'
        )),
        CONSTRAINT CK_SyncConfigurations_SyncType CHECK (syncType IN (
            'full',
            'delta',
            'incremental'
        )),
        CONSTRAINT CK_SyncConfigurations_EntityType CHECK (entityType IN (
            'equipment',
            'suppliers',
            'orders',
            'inventory',
            'employees',
            'customers',
            'products',
            'processes',
            'quality_records',
            'inspections',
            'ncr',
            'capa'
        )),
        CONSTRAINT CK_SyncConfigurations_ScheduleType CHECK (scheduleType IN (
            'manual',
            'cron',
            'interval'
        )),
        CONSTRAINT CK_SyncConfigurations_AuthType CHECK (authType IN (
            'basic',
            'oauth',
            'apikey',
            'windows',
            'certificate',
            'none'
        )),
        CONSTRAINT CK_SyncConfigurations_ConflictStrategy CHECK (conflictStrategy IN (
            'log',
            'source_wins',
            'target_wins',
            'manual',
            'newest_wins',
            'skip'
        )),
        CONSTRAINT CK_SyncConfigurations_LastRunStatus CHECK (lastRunStatus IS NULL OR lastRunStatus IN (
            'success',
            'failed',
            'partial',
            'cancelled',
            'in_progress'
        )),
        CONSTRAINT CK_SyncConfigurations_IntervalMinutes CHECK (intervalMinutes IS NULL OR intervalMinutes > 0),
        CONSTRAINT CK_SyncConfigurations_BatchSize CHECK (batchSize > 0),
        CONSTRAINT CK_SyncConfigurations_TimeoutSeconds CHECK (timeoutSeconds > 0),
        CONSTRAINT CK_SyncConfigurations_MaxRetries CHECK (maxRetries >= 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncConfigurations_Name ON SyncConfigurations(name);
    CREATE INDEX IX_SyncConfigurations_SystemType ON SyncConfigurations(systemType);
    CREATE INDEX IX_SyncConfigurations_EntityType ON SyncConfigurations(entityType);
    
    -- Status and scheduling
    CREATE INDEX IX_SyncConfigurations_Enabled ON SyncConfigurations(enabled);
    CREATE INDEX IX_SyncConfigurations_ScheduleType ON SyncConfigurations(scheduleType);
    CREATE INDEX IX_SyncConfigurations_NextRunAt ON SyncConfigurations(nextRunAt ASC);
    CREATE INDEX IX_SyncConfigurations_LastRunAt ON SyncConfigurations(lastRunAt DESC);
    CREATE INDEX IX_SyncConfigurations_LastRunStatus ON SyncConfigurations(lastRunStatus);
    
    -- Audit trail
    CREATE INDEX IX_SyncConfigurations_CreatedBy ON SyncConfigurations(createdBy);
    CREATE INDEX IX_SyncConfigurations_CreatedAt ON SyncConfigurations(createdAt DESC);
    CREATE INDEX IX_SyncConfigurations_DeactivatedAt ON SyncConfigurations(deactivatedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncConfigurations_Enabled_ScheduleType ON SyncConfigurations(enabled, scheduleType);
    CREATE INDEX IX_SyncConfigurations_Enabled_NextRunAt ON SyncConfigurations(enabled, nextRunAt ASC);
    CREATE INDEX IX_SyncConfigurations_SystemType_EntityType ON SyncConfigurations(systemType, entityType);
    CREATE INDEX IX_SyncConfigurations_Enabled_LastRunStatus ON SyncConfigurations(enabled, lastRunStatus);

    PRINT 'SyncConfigurations table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncConfigurations table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.46' AND scriptName = '46_create_sync_configurations_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.46',
        'Create SyncConfigurations table for ERP/MES integration',
        '46_create_sync_configurations_table.sql',
        'SUCCESS',
        'SyncConfigurations table supports configuration for external system sync adapters with scheduling, delta detection, and conflict handling'
    );
END
GO
