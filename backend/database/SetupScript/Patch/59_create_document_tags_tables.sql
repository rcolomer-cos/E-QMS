-- =============================================
-- Script: 59_create_document_tags_tables.sql
-- Description: Create tables for document tag management
-- Author: GitHub Copilot
-- Date: 2025-11-19
-- =============================================

-- Create Tags table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tags' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE Tags (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Tag Information
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        
        -- Color Configuration
        backgroundColor NVARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color for background (default blue)
        fontColor NVARCHAR(7) NOT NULL DEFAULT '#FFFFFF', -- Hex color for font (default white)
        
        -- Audit Trail
        createdBy INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedBy INT NULL,
        updatedAt DATETIME2 NULL,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Tags_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_Tags_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Unique Constraint - prevent duplicate tag names (case-insensitive)
        CONSTRAINT UQ_Tags_Name UNIQUE (name)
    );
    
    -- Index for searching tags by name
    CREATE INDEX IX_Tags_Name ON Tags(name);
    
    PRINT 'Tags table created successfully';
END
ELSE
BEGIN
    PRINT 'Tags table already exists';
END
GO

-- Create DocumentTags junction table for many-to-many relationship
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentTags' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE DocumentTags (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Relationship
        documentId INT NOT NULL,
        tagId INT NOT NULL,
        
        -- Audit Trail
        assignedBy INT NOT NULL,
        assignedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_DocumentTags_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentTags_Tag FOREIGN KEY (tagId) REFERENCES Tags(id) ON DELETE CASCADE,
        CONSTRAINT FK_DocumentTags_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        
        -- Unique Constraint - prevent duplicate tag assignments to the same document
        CONSTRAINT UQ_DocumentTags_DocumentId_TagId UNIQUE (documentId, tagId)
    );
    
    -- Indexes for performance
    CREATE INDEX IX_DocumentTags_DocumentId ON DocumentTags(documentId);
    CREATE INDEX IX_DocumentTags_TagId ON DocumentTags(tagId);
    
    PRINT 'DocumentTags table created successfully';
END
ELSE
BEGIN
    PRINT 'DocumentTags table already exists';
END
GO

PRINT 'Document tags tables setup completed';
GO
