-- =============================================
-- Sync Conflicts Table
-- =============================================
-- Stores conflicts detected during sync operations
-- Supports manual conflict resolution and audit trail

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncConflicts')
BEGIN
    CREATE TABLE SyncConflicts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference Information
        configurationId INT NOT NULL,
        logId INT NOT NULL, -- The sync run that detected this conflict
        
        -- Conflict Identity
        conflictType NVARCHAR(50) NOT NULL, -- Type of conflict
        entityType NVARCHAR(100) NOT NULL, -- Entity type involved
        entityId NVARCHAR(200) NOT NULL, -- ID of the entity in E-QMS
        externalEntityId NVARCHAR(200), -- ID of the entity in external system
        
        -- Conflict Details
        fieldName NVARCHAR(100), -- Specific field with conflict (if field-level)
        sourceValue NVARCHAR(MAX), -- Value from source system
        targetValue NVARCHAR(MAX), -- Value in target system
        sourceTimestamp DATETIME2, -- Last modified timestamp in source
        targetTimestamp DATETIME2, -- Last modified timestamp in target
        
        -- Resolution Information
        status NVARCHAR(50) NOT NULL DEFAULT 'unresolved', -- Resolution status
        resolution NVARCHAR(50), -- How conflict was resolved
        resolvedValue NVARCHAR(MAX), -- The value after resolution
        resolvedAt DATETIME2, -- When conflict was resolved
        resolvedBy INT NULL, -- User who resolved the conflict
        resolutionNotes NVARCHAR(2000), -- Notes about resolution
        
        -- Automatic Resolution Attempt
        autoResolveAttempted BIT DEFAULT 0, -- Whether auto-resolve was attempted
        autoResolveStrategy NVARCHAR(50), -- Strategy used for auto-resolve
        autoResolveSuccess BIT, -- Whether auto-resolve succeeded
        autoResolveReason NVARCHAR(1000), -- Reason for auto-resolve result
        
        -- Priority and Impact
        severity NVARCHAR(50) NOT NULL DEFAULT 'medium', -- Severity level
        impactAssessment NVARCHAR(2000), -- Assessment of business impact
        requiresManualReview BIT DEFAULT 1, -- Whether manual review is needed
        
        -- Additional Context
        contextData NVARCHAR(MAX), -- JSON with additional context
        errorMessage NVARCHAR(MAX), -- Error message if conflict caused failure
        
        -- Audit Trail
        detectedAt DATETIME2 DEFAULT GETDATE(),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncConflicts_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncConflicts_Log FOREIGN KEY (logId) REFERENCES SyncLogs(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncConflicts_ResolvedBy FOREIGN KEY (resolvedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_SyncConflicts_ConflictType CHECK (conflictType IN (
            'data_mismatch',
            'duplicate_record',
            'missing_reference',
            'validation_error',
            'concurrent_modification',
            'version_conflict',
            'constraint_violation',
            'mapping_error',
            'business_rule_violation',
            'data_integrity'
        )),
        CONSTRAINT CK_SyncConflicts_Status CHECK (status IN (
            'unresolved',
            'resolved',
            'ignored',
            'escalated',
            'auto_resolved'
        )),
        CONSTRAINT CK_SyncConflicts_Resolution CHECK (resolution IS NULL OR resolution IN (
            'source_wins',
            'target_wins',
            'manual_merge',
            'custom_value',
            'ignored',
            'newest_wins',
            'oldest_wins'
        )),
        CONSTRAINT CK_SyncConflicts_Severity CHECK (severity IN (
            'low',
            'medium',
            'high',
            'critical'
        )),
        CONSTRAINT CK_SyncConflicts_AutoResolveStrategy CHECK (autoResolveStrategy IS NULL OR autoResolveStrategy IN (
            'source_wins',
            'target_wins',
            'newest_wins',
            'oldest_wins',
            'none'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncConflicts_ConfigurationId ON SyncConflicts(configurationId);
    CREATE INDEX IX_SyncConflicts_LogId ON SyncConflicts(logId);
    
    -- Entity tracking
    CREATE INDEX IX_SyncConflicts_EntityType ON SyncConflicts(entityType);
    CREATE INDEX IX_SyncConflicts_EntityId ON SyncConflicts(entityId);
    CREATE INDEX IX_SyncConflicts_ExternalEntityId ON SyncConflicts(externalEntityId);
    
    -- Status and resolution tracking
    CREATE INDEX IX_SyncConflicts_Status ON SyncConflicts(status);
    CREATE INDEX IX_SyncConflicts_ConflictType ON SyncConflicts(conflictType);
    CREATE INDEX IX_SyncConflicts_Severity ON SyncConflicts(severity);
    CREATE INDEX IX_SyncConflicts_RequiresManualReview ON SyncConflicts(requiresManualReview);
    CREATE INDEX IX_SyncConflicts_ResolvedBy ON SyncConflicts(resolvedBy);
    CREATE INDEX IX_SyncConflicts_ResolvedAt ON SyncConflicts(resolvedAt DESC);
    
    -- Audit trail
    CREATE INDEX IX_SyncConflicts_DetectedAt ON SyncConflicts(detectedAt DESC);
    CREATE INDEX IX_SyncConflicts_CreatedAt ON SyncConflicts(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncConflicts_ConfigurationId_Status ON SyncConflicts(configurationId, status);
    CREATE INDEX IX_SyncConflicts_Status_Severity ON SyncConflicts(status, severity);
    CREATE INDEX IX_SyncConflicts_EntityType_EntityId ON SyncConflicts(entityType, entityId);
    CREATE INDEX IX_SyncConflicts_Status_RequiresManualReview ON SyncConflicts(status, requiresManualReview);
    CREATE INDEX IX_SyncConflicts_ConfigurationId_DetectedAt ON SyncConflicts(configurationId, detectedAt DESC);

    PRINT 'SyncConflicts table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncConflicts table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.48' AND scriptName = '48_create_sync_conflicts_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.48',
        'Create SyncConflicts table for conflict tracking and resolution',
        '48_create_sync_conflicts_table.sql',
        'SUCCESS',
        'SyncConflicts table tracks conflicts detected during sync operations with support for manual and automatic resolution'
    );
END
GO
