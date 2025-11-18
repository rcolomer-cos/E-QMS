-- =============================================
-- API Keys Table
-- =============================================
-- Stores API keys for integration endpoints
-- Keys are hashed using bcrypt for security

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApiKeys')
BEGIN
    CREATE TABLE ApiKeys (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Key Information
        keyHash NVARCHAR(255) UNIQUE NOT NULL, -- Hashed API key (bcrypt)
        keyPreview NVARCHAR(50) NOT NULL, -- First/last characters for display
        name NVARCHAR(255) NOT NULL, -- Descriptive name for the key
        
        -- Key Configuration
        expiresAt DATETIME2, -- Optional expiration timestamp (NULL = never expires)
        
        -- Access Control
        scopes NVARCHAR(MAX), -- JSON array of allowed scopes/permissions
        allowedIPs NVARCHAR(MAX), -- JSON array of allowed IP addresses (NULL = any IP)
        
        -- Status
        active BIT DEFAULT 1 NOT NULL, -- Whether key is active
        revokedAt DATETIME2, -- When key was revoked (if applicable)
        revokedBy INT, -- User who revoked the key
        revocationReason NVARCHAR(500), -- Reason for revocation
        
        -- Usage Tracking
        lastUsedAt DATETIME2, -- Last time key was used
        lastUsedIp NVARCHAR(45), -- Last IP address that used the key
        usageCount INT DEFAULT 0 NOT NULL, -- Total number of times key was used
        
        -- Metadata
        description NVARCHAR(1000), -- Detailed description/purpose
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        createdBy INT NOT NULL, -- User who created the key
        updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ApiKeys_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_ApiKeys_RevokedBy FOREIGN KEY (revokedBy) REFERENCES Users(id) ON DELETE NO ACTION
    );

    -- =============================================
    -- Indexes for Performance
    -- =============================================
    
    -- Key lookup (most common operation)
    CREATE UNIQUE INDEX IX_ApiKeys_KeyHash ON ApiKeys(keyHash);
    
    -- Active keys lookup
    CREATE INDEX IX_ApiKeys_Active ON ApiKeys(active) WHERE active = 1;
    
    -- Expiration tracking
    CREATE INDEX IX_ApiKeys_ExpiresAt ON ApiKeys(expiresAt) WHERE expiresAt IS NOT NULL;
    
    -- Creator tracking
    CREATE INDEX IX_ApiKeys_CreatedBy ON ApiKeys(createdBy);
    CREATE INDEX IX_ApiKeys_CreatedAt ON ApiKeys(createdAt DESC);
    
    -- Name search
    CREATE INDEX IX_ApiKeys_Name ON ApiKeys(name);

    PRINT 'ApiKeys table created successfully with comprehensive indexing';
END
ELSE
BEGIN
    PRINT 'ApiKeys table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.45' AND scriptName = '45_create_api_keys_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.45',
        'Create ApiKeys table for integration authentication',
        '45_create_api_keys_table.sql',
        'SUCCESS',
        'Supports secure API key management with bcrypt hashing, scope control, and usage tracking'
    );
END
GO
