-- =============================================
-- Notifications Table
-- =============================================
-- Stores in-app notifications for users
-- Supports notification of document revision events (approve, reject, changes requested)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Recipient
        userId INT NOT NULL, -- User who receives this notification
        
        -- Notification Content
        type NVARCHAR(50) NOT NULL, -- 'document_approved', 'document_rejected', 'document_changes_requested'
        title NVARCHAR(500) NOT NULL, -- Short title/subject
        message NVARCHAR(2000) NOT NULL, -- Full notification message
        
        -- Related Entity References
        documentId INT NULL, -- Reference to related document
        revisionId INT NULL, -- Reference to related revision
        
        -- Notification State
        isRead BIT NOT NULL DEFAULT 0, -- Whether user has read the notification
        readAt DATETIME2 NULL, -- When notification was read
        
        -- Timestamps
        createdAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Notifications_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Notifications_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_Notifications_Revision FOREIGN KEY (revisionId) REFERENCES DocumentRevisions(id),
        
        -- Constraints
        CONSTRAINT CK_Notifications_Type CHECK (type IN (
            'document_approved', 
            'document_rejected', 
            'document_changes_requested'
        ))
    );

    -- Indexes for Performance
    
    -- Primary lookup by user
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    
    -- Filter by read status
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    
    -- Date-based queries
    CREATE INDEX IX_Notifications_CreatedAt ON Notifications(createdAt DESC);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Notifications_User_Read ON Notifications(userId, isRead);
    CREATE INDEX IX_Notifications_User_CreatedAt ON Notifications(userId, createdAt DESC);
    
    -- Related entity lookups
    CREATE INDEX IX_Notifications_DocumentId ON Notifications(documentId);
    CREATE INDEX IX_Notifications_Type ON Notifications(type);

    PRINT 'Notifications table created successfully';
END
ELSE
BEGIN
    PRINT 'Notifications table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.10' AND scriptName = '10_create_notifications_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.10',
        'Create Notifications table for in-app notifications',
        '10_create_notifications_table.sql',
        'SUCCESS',
        'Notifications table supports in-app notifications for document revision events'
    );
END
GO
