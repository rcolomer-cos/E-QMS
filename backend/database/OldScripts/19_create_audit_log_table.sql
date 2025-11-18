-- =============================================
-- Audit Log Table
-- =============================================
-- Captures all user actions, timestamps, affected entities, and old/new values
-- Provides comprehensive audit trail for ISO 9001 compliance and security monitoring
-- Optimized for high read volume with strategic indexing

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- User Information
        userId INT, -- User who performed the action (NULL for system actions)
        userName NVARCHAR(255), -- Cached username for audit trail (in case user is deleted)
        userEmail NVARCHAR(255), -- Cached user email for audit trail
        
        -- Action Details
        action NVARCHAR(100) NOT NULL, -- Action performed (create, update, delete, login, logout, approve, reject, etc.)
        actionCategory NVARCHAR(100) NOT NULL, -- Category of action (authentication, document, user, equipment, ncr, capa, etc.)
        actionDescription NVARCHAR(2000), -- Human-readable description of the action
        
        -- Affected Entity
        entityType NVARCHAR(100) NOT NULL, -- Type of entity affected (User, Document, Equipment, NCR, CAPA, etc.)
        entityId INT, -- ID of the affected entity (NULL for actions without specific entity)
        entityIdentifier NVARCHAR(255), -- Human-readable identifier (email, document number, equipment number, etc.)
        
        -- Change Tracking
        oldValues NVARCHAR(MAX), -- JSON representation of old values before change
        newValues NVARCHAR(MAX), -- JSON representation of new values after change
        changedFields NVARCHAR(1000), -- Comma-separated list of fields that changed
        
        -- Request Metadata
        ipAddress NVARCHAR(45), -- IP address of the request (supports IPv4 and IPv6)
        userAgent NVARCHAR(500), -- Browser/client user agent string
        requestMethod NVARCHAR(10), -- HTTP method (GET, POST, PUT, DELETE, etc.)
        requestUrl NVARCHAR(2000), -- API endpoint or URL accessed
        
        -- Result and Status
        success BIT NOT NULL DEFAULT 1, -- Whether the action was successful
        errorMessage NVARCHAR(2000), -- Error message if action failed
        statusCode INT, -- HTTP status code or application status code
        
        -- Timestamp
        timestamp DATETIME2 DEFAULT GETDATE() NOT NULL, -- When the action occurred
        
        -- Additional Context
        sessionId NVARCHAR(255), -- Session identifier for grouping related actions
        additionalData NVARCHAR(MAX), -- Additional contextual data in JSON format
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditLog_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
    );

    -- =============================================
    -- Indexes for High Read Volume Performance
    -- =============================================
    
    -- Timestamp-based queries (most common for audit trail reviews)
    CREATE INDEX IX_AuditLog_Timestamp ON AuditLog(timestamp DESC);
    CREATE INDEX IX_AuditLog_Timestamp_Action ON AuditLog(timestamp DESC, action);
    
    -- User activity tracking
    CREATE INDEX IX_AuditLog_UserId ON AuditLog(userId);
    CREATE INDEX IX_AuditLog_UserId_Timestamp ON AuditLog(userId, timestamp DESC);
    CREATE INDEX IX_AuditLog_UserEmail ON AuditLog(userEmail);
    
    -- Action-based queries
    CREATE INDEX IX_AuditLog_Action ON AuditLog(action);
    CREATE INDEX IX_AuditLog_ActionCategory ON AuditLog(actionCategory);
    CREATE INDEX IX_AuditLog_Action_Timestamp ON AuditLog(action, timestamp DESC);
    CREATE INDEX IX_AuditLog_ActionCategory_Timestamp ON AuditLog(actionCategory, timestamp DESC);
    
    -- Entity tracking (critical for entity audit trails)
    CREATE INDEX IX_AuditLog_EntityType ON AuditLog(entityType);
    CREATE INDEX IX_AuditLog_EntityId ON AuditLog(entityId);
    CREATE INDEX IX_AuditLog_EntityType_EntityId ON AuditLog(entityType, entityId);
    CREATE INDEX IX_AuditLog_EntityType_Timestamp ON AuditLog(entityType, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityId_Timestamp ON AuditLog(entityId, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityIdentifier ON AuditLog(entityIdentifier);
    
    -- Success/failure tracking for security monitoring
    CREATE INDEX IX_AuditLog_Success ON AuditLog(success);
    CREATE INDEX IX_AuditLog_Success_Timestamp ON AuditLog(success, timestamp DESC);
    
    -- Session-based queries for user activity analysis
    CREATE INDEX IX_AuditLog_SessionId ON AuditLog(sessionId);
    CREATE INDEX IX_AuditLog_SessionId_Timestamp ON AuditLog(sessionId, timestamp DESC);
    
    -- Security monitoring indexes
    CREATE INDEX IX_AuditLog_IpAddress ON AuditLog(ipAddress);
    CREATE INDEX IX_AuditLog_IpAddress_Timestamp ON AuditLog(ipAddress, timestamp DESC);
    
    -- Composite indexes for common complex queries
    CREATE INDEX IX_AuditLog_UserId_Action_Timestamp ON AuditLog(userId, action, timestamp DESC);
    CREATE INDEX IX_AuditLog_EntityType_EntityId_Timestamp ON AuditLog(entityType, entityId, timestamp DESC);
    CREATE INDEX IX_AuditLog_ActionCategory_Success ON AuditLog(actionCategory, success);

    PRINT 'AuditLog table created successfully with comprehensive indexing for high read volume';
END
ELSE
BEGIN
    PRINT 'AuditLog table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.19' AND scriptName = '19_create_audit_log_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.19',
        'Create AuditLog table for comprehensive audit trail tracking',
        '19_create_audit_log_table.sql',
        'SUCCESS',
        'AuditLog table captures user actions, timestamps, affected entities, old/new values with extensive indexing for high read volume queries. Supports ISO 9001 audit trail requirements.'
    );
END
GO
