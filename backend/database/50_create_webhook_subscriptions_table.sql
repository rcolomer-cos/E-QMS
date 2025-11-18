-- =============================================
-- Webhook Subscriptions Table
-- =============================================
-- Stores webhook subscription configurations for external systems
-- Supports event-driven notifications for NCR and CAPA events

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WebhookSubscriptions')
BEGIN
    CREATE TABLE WebhookSubscriptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Subscription Identity
        name NVARCHAR(200) NOT NULL, -- Friendly name for the subscription
        url NVARCHAR(2000) NOT NULL, -- Target webhook URL
        secret NVARCHAR(500) NOT NULL, -- Secret for HMAC signature verification
        
        -- Event Configuration
        events NVARCHAR(MAX) NOT NULL, -- JSON array of subscribed events (e.g., ["ncr.created", "ncr.updated", "capa.closed"])
        
        -- Status and Settings
        active BIT NOT NULL DEFAULT 1, -- Whether the subscription is active
        retryEnabled BIT NOT NULL DEFAULT 1, -- Whether to retry failed deliveries
        maxRetries INT NOT NULL DEFAULT 3, -- Maximum number of retry attempts
        retryDelaySeconds INT NOT NULL DEFAULT 60, -- Delay between retries in seconds
        
        -- Headers (optional custom headers)
        customHeaders NVARCHAR(MAX), -- JSON object of custom HTTP headers
        
        -- Audit Trail
        createdBy INT NOT NULL, -- User who created the subscription
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        lastTriggeredAt DATETIME2, -- Last time a webhook was triggered
        
        -- Foreign Key Constraints
        CONSTRAINT FK_WebhookSubscriptions_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
    );

    -- Indexes for Performance
    CREATE INDEX IX_WebhookSubscriptions_Active ON WebhookSubscriptions(active);
    CREATE INDEX IX_WebhookSubscriptions_CreatedBy ON WebhookSubscriptions(createdBy);
    CREATE INDEX IX_WebhookSubscriptions_LastTriggeredAt ON WebhookSubscriptions(lastTriggeredAt);

    PRINT 'WebhookSubscriptions table created successfully';
END
ELSE
BEGIN
    PRINT 'WebhookSubscriptions table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.50' AND scriptName = '50_create_webhook_subscriptions_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.50',
        'Create WebhookSubscriptions table for webhook event subscriptions',
        '50_create_webhook_subscriptions_table.sql',
        'SUCCESS',
        'Supports event-driven notifications for NCR and CAPA lifecycle events'
    );
END
GO
