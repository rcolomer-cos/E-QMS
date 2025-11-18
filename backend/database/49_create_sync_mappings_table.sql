-- =============================================
-- Sync Mappings Table
-- =============================================
-- Stores field-level mapping configurations between E-QMS and external systems
-- Supports complex transformation rules and data type conversions

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncMappings')
BEGIN
    CREATE TABLE SyncMappings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Reference to Configuration
        configurationId INT NOT NULL,
        
        -- Mapping Identity
        mappingName NVARCHAR(200) NOT NULL, -- Name of this mapping
        description NVARCHAR(2000), -- Description of what this mapping does
        
        -- Source Configuration
        sourceField NVARCHAR(200) NOT NULL, -- Source field name/path
        sourceType NVARCHAR(50) NOT NULL, -- Source data type
        sourceFormat NVARCHAR(100), -- Source format (for dates, numbers, etc.)
        
        -- Target Configuration
        targetField NVARCHAR(200) NOT NULL, -- Target field name/path
        targetType NVARCHAR(50) NOT NULL, -- Target data type
        targetFormat NVARCHAR(100), -- Target format (for dates, numbers, etc.)
        
        -- Transformation Rules
        transformationType NVARCHAR(50) NOT NULL DEFAULT 'direct', -- Type of transformation
        transformationRule NVARCHAR(MAX), -- Transformation logic (JS expression, SQL, etc.)
        
        -- Validation Rules
        required BIT DEFAULT 0, -- Whether this field is required
        validationRule NVARCHAR(MAX), -- Validation expression
        validationErrorMessage NVARCHAR(500), -- Error message for validation failures
        
        -- Default Values
        defaultValue NVARCHAR(MAX), -- Default value if source is null/empty
        nullHandling NVARCHAR(50) NOT NULL DEFAULT 'skip', -- How to handle null values
        
        -- Conditional Mapping
        conditionalMapping BIT DEFAULT 0, -- Whether mapping is conditional
        conditionExpression NVARCHAR(MAX), -- Condition for applying this mapping
        alternativeMappingId INT NULL, -- Alternative mapping if condition fails
        
        -- Lookup/Reference Handling
        isLookup BIT DEFAULT 0, -- Whether this is a lookup/reference field
        lookupSourceField NVARCHAR(200), -- Field to use for lookup
        lookupTargetField NVARCHAR(200), -- Field to match in target
        lookupDefaultValue NVARCHAR(MAX), -- Default if lookup fails
        
        -- Multi-Value Handling
        isMultiValue BIT DEFAULT 0, -- Whether field contains multiple values
        multiValueDelimiter NVARCHAR(10), -- Delimiter for multi-value fields
        multiValueHandling NVARCHAR(50), -- How to handle multi-value (split, join, first, last)
        
        -- Status and Configuration
        enabled BIT DEFAULT 1, -- Whether this mapping is active
        priority INT DEFAULT 100, -- Execution priority (lower executes first)
        
        -- Statistics
        successCount INT DEFAULT 0, -- Number of successful transformations
        failureCount INT DEFAULT 0, -- Number of failed transformations
        lastUsedAt DATETIME2, -- Last time this mapping was used
        
        -- Audit Trail
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_SyncMappings_Configuration FOREIGN KEY (configurationId) REFERENCES SyncConfigurations(id) ON DELETE CASCADE,
        CONSTRAINT FK_SyncMappings_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_SyncMappings_AlternativeMapping FOREIGN KEY (alternativeMappingId) REFERENCES SyncMappings(id),
        
        -- Constraints
        CONSTRAINT CK_SyncMappings_SourceType CHECK (sourceType IN (
            'string',
            'number',
            'integer',
            'decimal',
            'boolean',
            'date',
            'datetime',
            'time',
            'json',
            'xml',
            'binary',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_TargetType CHECK (targetType IN (
            'string',
            'number',
            'integer',
            'decimal',
            'boolean',
            'date',
            'datetime',
            'time',
            'json',
            'xml',
            'binary',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_TransformationType CHECK (transformationType IN (
            'direct',
            'expression',
            'lookup',
            'concat',
            'split',
            'format',
            'calculate',
            'custom'
        )),
        CONSTRAINT CK_SyncMappings_NullHandling CHECK (nullHandling IN (
            'skip',
            'default',
            'error',
            'empty_string',
            'null'
        )),
        CONSTRAINT CK_SyncMappings_MultiValueHandling CHECK (multiValueHandling IS NULL OR multiValueHandling IN (
            'split',
            'join',
            'first',
            'last',
            'array'
        )),
        CONSTRAINT CK_SyncMappings_Priority CHECK (priority >= 0)
    );

    -- Indexes for Performance
    
    -- Primary lookups
    CREATE INDEX IX_SyncMappings_ConfigurationId ON SyncMappings(configurationId);
    CREATE INDEX IX_SyncMappings_MappingName ON SyncMappings(mappingName);
    
    -- Field lookups
    CREATE INDEX IX_SyncMappings_SourceField ON SyncMappings(sourceField);
    CREATE INDEX IX_SyncMappings_TargetField ON SyncMappings(targetField);
    
    -- Status and configuration
    CREATE INDEX IX_SyncMappings_Enabled ON SyncMappings(enabled);
    CREATE INDEX IX_SyncMappings_Priority ON SyncMappings(priority ASC);
    CREATE INDEX IX_SyncMappings_TransformationType ON SyncMappings(transformationType);
    
    -- Lookup tracking
    CREATE INDEX IX_SyncMappings_IsLookup ON SyncMappings(isLookup);
    CREATE INDEX IX_SyncMappings_ConditionalMapping ON SyncMappings(conditionalMapping);
    CREATE INDEX IX_SyncMappings_AlternativeMappingId ON SyncMappings(alternativeMappingId);
    
    -- Audit trail
    CREATE INDEX IX_SyncMappings_CreatedBy ON SyncMappings(createdBy);
    CREATE INDEX IX_SyncMappings_CreatedAt ON SyncMappings(createdAt DESC);
    CREATE INDEX IX_SyncMappings_LastUsedAt ON SyncMappings(lastUsedAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_SyncMappings_ConfigurationId_Enabled ON SyncMappings(configurationId, enabled);
    CREATE INDEX IX_SyncMappings_ConfigurationId_Priority ON SyncMappings(configurationId, priority ASC);
    CREATE INDEX IX_SyncMappings_Enabled_Priority ON SyncMappings(enabled, priority ASC);

    PRINT 'SyncMappings table created successfully';
END
ELSE
BEGIN
    PRINT 'SyncMappings table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.49' AND scriptName = '49_create_sync_mappings_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.49',
        'Create SyncMappings table for field-level mapping configurations',
        '49_create_sync_mappings_table.sql',
        'SUCCESS',
        'SyncMappings table supports complex field transformations, lookups, and validation rules for data synchronization'
    );
END
GO
