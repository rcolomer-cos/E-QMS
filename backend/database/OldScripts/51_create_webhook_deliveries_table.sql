-- =============================================
-- Webhook Deliveries Table
-- =============================================
-- Stores webhook delivery logs and retry information
-- Supports audit trail and debugging of webhook deliveries

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WebhookDeliveries')
BEGIN
    CREATE TABLE WebhookDeliveries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationship
        subscriptionId INT NOT NULL, -- Reference to webhook subscription
        
        -- Event Information
        eventType NVARCHAR(100) NOT NULL, -- Type of event (e.g., "ncr.created")
        entityType NVARCHAR(50) NOT NULL, -- Entity type (NCR or CAPA)
        entityId INT NOT NULL, -- ID of the entity (NCR/CAPA)
        
        -- Request Details
        requestUrl NVARCHAR(2000) NOT NULL, -- Target URL at time of delivery
        requestPayload NVARCHAR(MAX) NOT NULL, -- JSON payload sent
        requestHeaders NVARCHAR(MAX), -- JSON object of request headers
        
        -- Response Details
        responseStatus INT, -- HTTP response status code
        responseBody NVARCHAR(MAX), -- Response body received
        responseTime INT, -- Response time in milliseconds
        
        -- Retry Information
        attempt INT NOT NULL DEFAULT 1, -- Attempt number (1 = first attempt)
        maxAttempts INT NOT NULL DEFAULT 3, -- Maximum attempts allowed
        nextRetryAt DATETIME2, -- Scheduled time for next retry
        
        -- Status
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying
        errorMessage NVARCHAR(MAX), -- Error message if failed
        
        -- Timestamps
        createdAt DATETIME2 DEFAULT GETDATE(),
        deliveredAt DATETIME2, -- Time of successful delivery
        
        -- Foreign Key Constraints
        CONSTRAINT FK_WebhookDeliveries_Subscription FOREIGN KEY (subscriptionId) REFERENCES WebhookSubscriptions(id) ON DELETE CASCADE,
        
        -- Constraints
        CONSTRAINT CK_WebhookDeliveries_Status CHECK (status IN (
            'pending',
            'success',
            'failed',
            'retrying'
        )),
        CONSTRAINT CK_WebhookDeliveries_EntityType CHECK (entityType IN (
            'NCR',
            'CAPA'
        ))
    );

    -- Indexes for Performance
    CREATE INDEX IX_WebhookDeliveries_SubscriptionId ON WebhookDeliveries(subscriptionId);
    CREATE INDEX IX_WebhookDeliveries_Status ON WebhookDeliveries(status);
    CREATE INDEX IX_WebhookDeliveries_EventType ON WebhookDeliveries(eventType);
    CREATE INDEX IX_WebhookDeliveries_EntityType_EntityId ON WebhookDeliveries(entityType, entityId);
    CREATE INDEX IX_WebhookDeliveries_NextRetryAt ON WebhookDeliveries(nextRetryAt) WHERE status = 'retrying';
    CREATE INDEX IX_WebhookDeliveries_CreatedAt ON WebhookDeliveries(createdAt);
    CREATE INDEX IX_WebhookDeliveries_Status_NextRetryAt ON WebhookDeliveries(status, nextRetryAt);

    PRINT 'WebhookDeliveries table created successfully';
END
ELSE
BEGIN
    PRINT 'WebhookDeliveries table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.51' AND scriptName = '51_create_webhook_deliveries_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.51',
        'Create WebhookDeliveries table for webhook delivery logs',
        '51_create_webhook_deliveries_table.sql',
        'SUCCESS',
        'Tracks all webhook delivery attempts with retry information and response details'
    );
END
GO
