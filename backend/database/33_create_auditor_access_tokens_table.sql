-- =============================================
-- Auditor Access Tokens Table
-- =============================================
-- Stores time-limited, read-only access tokens for external auditors
-- Provides secure temporary access with comprehensive audit logging

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditorAccessTokens')
BEGIN
    CREATE TABLE AuditorAccessTokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Token Information
        token NVARCHAR(255) UNIQUE NOT NULL, -- Unique access token (hashed)
        tokenPreview NVARCHAR(50) NOT NULL, -- First/last characters for display
        
        -- Auditor Information
        auditorName NVARCHAR(255) NOT NULL, -- External auditor's name
        auditorEmail NVARCHAR(255) NOT NULL, -- External auditor's email
        auditorOrganization NVARCHAR(255), -- Auditing organization
        
        -- Token Configuration
        expiresAt DATETIME2 NOT NULL, -- Token expiration timestamp
        maxUses INT, -- Optional maximum number of uses (NULL = unlimited)
        currentUses INT DEFAULT 0, -- Current usage count
        
        -- Access Scope
        scopeType NVARCHAR(50) NOT NULL, -- Type of access (full_read_only, specific_audit, specific_document)
        scopeEntityId INT, -- Entity ID if scoped to specific audit/document
        allowedResources NVARCHAR(MAX), -- JSON array of allowed resource types
        
        -- Status
        active BIT DEFAULT 1, -- Whether token is active
        revokedAt DATETIME2, -- When token was revoked (if applicable)
        revokedBy INT, -- User who revoked the token
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Metadata
        purpose NVARCHAR(500), -- Purpose/reason for generating token
        notes NVARCHAR(MAX), -- Additional notes
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        createdBy INT NOT NULL, -- User who generated the token
        lastUsedAt DATETIME2, -- Last time token was used
        lastUsedIp NVARCHAR(45), -- Last IP address that used the token
        
        -- Foreign Key Constraints
        CONSTRAINT FK_AuditorAccessTokens_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_AuditorAccessTokens_RevokedBy FOREIGN KEY (revokedBy) REFERENCES Users(id) ON DELETE NO ACTION,
        
        -- Check Constraints
        CONSTRAINT CK_AuditorAccessTokens_Email CHECK (auditorEmail LIKE '%_@_%._%'),
        CONSTRAINT CK_AuditorAccessTokens_ScopeType CHECK (scopeType IN ('full_read_only', 'specific_audit', 'specific_document', 'specific_ncr', 'specific_capa')),
        CONSTRAINT CK_AuditorAccessTokens_MaxUses CHECK (maxUses IS NULL OR maxUses > 0)
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Token lookup (most common operation)
    CREATE UNIQUE INDEX IX_AuditorAccessTokens_Token ON AuditorAccessTokens(token);
    
    -- Active tokens lookup
    CREATE INDEX IX_AuditorAccessTokens_Active_Expires ON AuditorAccessTokens(active, expiresAt) WHERE active = 1;
    
    -- Creator tracking
    CREATE INDEX IX_AuditorAccessTokens_CreatedBy ON AuditorAccessTokens(createdBy);
    CREATE INDEX IX_AuditorAccessTokens_CreatedAt ON AuditorAccessTokens(createdAt DESC);
    
    -- Auditor tracking
    CREATE INDEX IX_AuditorAccessTokens_AuditorEmail ON AuditorAccessTokens(auditorEmail);
    
    -- Expiration tracking (for cleanup)
    CREATE INDEX IX_AuditorAccessTokens_ExpiresAt ON AuditorAccessTokens(expiresAt);
    
    -- Scope tracking
    CREATE INDEX IX_AuditorAccessTokens_ScopeType ON AuditorAccessTokens(scopeType);
    CREATE INDEX IX_AuditorAccessTokens_ScopeEntityId ON AuditorAccessTokens(scopeEntityId) WHERE scopeEntityId IS NOT NULL;

    PRINT 'AuditorAccessTokens table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'AuditorAccessTokens table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.33' AND scriptName = '33_create_auditor_access_tokens_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.33',
        'Create AuditorAccessTokens table for temporary read-only access',
        '33_create_auditor_access_tokens_table.sql',
        'SUCCESS',
        'Supports time-limited, read-only access links for external auditors with comprehensive audit logging and scope control'
    );
END
GO
