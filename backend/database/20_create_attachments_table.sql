-- =============================================
-- Attachments Table
-- =============================================
-- Stores file attachments linked to various records
-- Supports ISO 9001 documentation requirements
-- Provides secure file storage with audit trail
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments')
BEGIN
    CREATE TABLE Attachments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- File Information
        fileName NVARCHAR(255) NOT NULL, -- Original filename
        storedFileName NVARCHAR(255) NOT NULL, -- Unique stored filename
        filePath NVARCHAR(500) NOT NULL, -- Full path to stored file
        fileSize INT NOT NULL, -- File size in bytes
        mimeType NVARCHAR(100) NOT NULL, -- MIME type of the file
        fileExtension NVARCHAR(10) NOT NULL, -- File extension
        
        -- Entity Association (Polymorphic relationship)
        entityType NVARCHAR(50) NOT NULL, -- Type of entity (e.g., 'equipment', 'document', 'calibration', 'inspection', 'training', 'ncr', 'capa', 'audit')
        entityId INT NOT NULL, -- ID of the associated entity
        
        -- Attachment Metadata
        description NVARCHAR(500), -- Description or notes about the file
        category NVARCHAR(100), -- Category (e.g., 'certificate', 'report', 'photo', 'invoice')
        version NVARCHAR(50), -- Version number if applicable
        
        -- Security & Access Control
        uploadedBy INT NOT NULL, -- User who uploaded the file
        isPublic BIT NOT NULL DEFAULT 0, -- Whether file is publicly accessible
        
        -- Status
        active BIT NOT NULL DEFAULT 1, -- Soft delete flag
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        deletedAt DATETIME2, -- Soft delete timestamp
        deletedBy INT, -- User who deleted the file
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Attachments_UploadedBy FOREIGN KEY (uploadedBy) REFERENCES Users(id),
        CONSTRAINT FK_Attachments_DeletedBy FOREIGN KEY (deletedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_Attachments_EntityType CHECK (entityType IN (
            'equipment',
            'document',
            'calibration',
            'inspection',
            'service_maintenance',
            'training',
            'training_certificate',
            'ncr',
            'capa',
            'audit'
        )),
        CONSTRAINT CK_Attachments_FileSize CHECK (fileSize > 0 AND fileSize <= 10485760) -- Max 10MB
    );

    -- Indexes for Performance
    
    -- Entity lookups
    CREATE INDEX IX_Attachments_EntityType ON Attachments(entityType);
    CREATE INDEX IX_Attachments_EntityId ON Attachments(entityId);
    CREATE INDEX IX_Attachments_Entity_Composite ON Attachments(entityType, entityId) WHERE active = 1;
    
    -- User tracking
    CREATE INDEX IX_Attachments_UploadedBy ON Attachments(uploadedBy);
    CREATE INDEX IX_Attachments_DeletedBy ON Attachments(deletedBy);
    
    -- File lookups
    CREATE INDEX IX_Attachments_StoredFileName ON Attachments(storedFileName) WHERE active = 1;
    CREATE INDEX IX_Attachments_Category ON Attachments(category) WHERE active = 1;
    
    -- Status and audit
    CREATE INDEX IX_Attachments_Active ON Attachments(active);
    CREATE INDEX IX_Attachments_CreatedAt ON Attachments(createdAt);
    CREATE INDEX IX_Attachments_DeletedAt ON Attachments(deletedAt);
    
    -- Composite indexes for common queries
    CREATE INDEX IX_Attachments_Entity_Category ON Attachments(entityType, entityId, category) WHERE active = 1;
    CREATE INDEX IX_Attachments_UploadedBy_CreatedAt ON Attachments(uploadedBy, createdAt DESC) WHERE active = 1;

    PRINT 'Attachments table created successfully';
END
ELSE
BEGIN
    PRINT 'Attachments table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.20' AND scriptName = '20_create_attachments_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.20',
        'Create Attachments table for file management',
        '20_create_attachments_table.sql',
        'SUCCESS',
        'Attachments table supports secure file storage with polymorphic relationships to various entities including training certificates'
    );
END
GO
