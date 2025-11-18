-- =============================================
-- Email Templates Table
-- =============================================
-- Stores customizable email templates for automated notifications
-- Supports NCR notifications, training reminders, and audit assignments
-- Includes placeholder variables for dynamic content

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailTemplates')
BEGIN
    CREATE TABLE EmailTemplates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Template Identification
        name NVARCHAR(200) NOT NULL, -- Internal template name/identifier
        displayName NVARCHAR(200) NOT NULL, -- User-friendly display name
        
        -- Template Classification
        type NVARCHAR(100) NOT NULL, -- 'ncr_notification', 'training_reminder', 'audit_assignment', etc.
        category NVARCHAR(100) NOT NULL, -- 'ncr', 'training', 'audit', 'general'
        
        -- Template Content
        subject NVARCHAR(500) NOT NULL, -- Email subject line (supports placeholders)
        body NVARCHAR(MAX) NOT NULL, -- Email body content (supports placeholders)
        
        -- Template Metadata
        description NVARCHAR(1000), -- Description of when/how to use this template
        placeholders NVARCHAR(2000), -- JSON array of available placeholder variables
        
        -- Template Status
        isActive BIT NOT NULL DEFAULT 1, -- Whether template is active and can be used
        isDefault BIT NOT NULL DEFAULT 0, -- Whether this is the default template for its type
        
        -- Audit Trail
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        createdBy INT NULL, -- User who created this template
        updatedBy INT NULL, -- User who last updated this template
        
        -- Foreign Key Constraints
        CONSTRAINT FK_EmailTemplates_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
        CONSTRAINT FK_EmailTemplates_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id),
        
        -- Constraints
        CONSTRAINT CK_EmailTemplates_Type CHECK (type IN (
            'ncr_notification',
            'ncr_assignment',
            'ncr_status_update',
            'training_reminder',
            'training_assignment',
            'training_expiry_warning',
            'audit_assignment',
            'audit_notification',
            'audit_finding',
            'capa_assignment',
            'capa_deadline_reminder'
        )),
        CONSTRAINT CK_EmailTemplates_Category CHECK (category IN (
            'ncr',
            'training',
            'audit',
            'capa',
            'general'
        )),
        -- Ensure only one default template per type
        CONSTRAINT UQ_EmailTemplates_DefaultPerType UNIQUE (type, isDefault) 
            WHERE isDefault = 1
    );

    -- Indexes for Performance
    
    -- Primary lookup by type
    CREATE INDEX IX_EmailTemplates_Type ON EmailTemplates(type);
    
    -- Filter by category and active status
    CREATE INDEX IX_EmailTemplates_Category ON EmailTemplates(category);
    CREATE INDEX IX_EmailTemplates_IsActive ON EmailTemplates(isActive);
    
    -- Find default templates
    CREATE INDEX IX_EmailTemplates_IsDefault ON EmailTemplates(isDefault) WHERE isDefault = 1;
    
    -- Composite indexes for common queries
    CREATE INDEX IX_EmailTemplates_Type_Active ON EmailTemplates(type, isActive);
    CREATE INDEX IX_EmailTemplates_Category_Active ON EmailTemplates(category, isActive);
    
    -- Audit trail lookups
    CREATE INDEX IX_EmailTemplates_CreatedAt ON EmailTemplates(createdAt DESC);
    CREATE INDEX IX_EmailTemplates_UpdatedAt ON EmailTemplates(updatedAt DESC);

    PRINT 'EmailTemplates table created successfully';
END
ELSE
BEGIN
    PRINT 'EmailTemplates table already exists';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.43' AND scriptName = '43_create_email_templates_table.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.43',
        'Create EmailTemplates table for customizable email notifications',
        '43_create_email_templates_table.sql',
        'SUCCESS',
        'EmailTemplates table supports NCR notifications, training reminders, and audit assignments with placeholder variables'
    );
END
GO

-- Insert default email templates
IF NOT EXISTS (SELECT * FROM EmailTemplates WHERE type = 'ncr_notification')
BEGIN
    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_ncr_notification',
        'NCR Created Notification',
        'ncr_notification',
        'ncr',
        'New NCR Created: {{ncrNumber}} - {{title}}',
        'Hello {{recipientName}},

A new Non-Conformity Report (NCR) has been created:

NCR Number: {{ncrNumber}}
Title: {{title}}
Description: {{description}}
Severity: {{severity}}
Category: {{category}}
Detected Date: {{detectedDate}}
Reported By: {{reportedByName}}

Please review this NCR and take appropriate action.

View NCR: {{ncrUrl}}

Best regards,
E-QMS System',
        'Default template for NCR creation notifications',
        '["recipientName", "ncrNumber", "title", "description", "severity", "category", "detectedDate", "reportedByName", "ncrUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_ncr_assignment',
        'NCR Assignment Notification',
        'ncr_assignment',
        'ncr',
        'NCR Assigned to You: {{ncrNumber}} - {{title}}',
        'Hello {{assigneeName}},

You have been assigned to the following NCR:

NCR Number: {{ncrNumber}}
Title: {{title}}
Description: {{description}}
Severity: {{severity}}
Priority: {{priority}}
Assigned By: {{assignedByName}}
Assigned Date: {{assignedDate}}

Please investigate and take appropriate corrective actions.

View NCR: {{ncrUrl}}

Best regards,
E-QMS System',
        'Default template for NCR assignment notifications',
        '["assigneeName", "ncrNumber", "title", "description", "severity", "priority", "assignedByName", "assignedDate", "ncrUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_training_reminder',
        'Training Session Reminder',
        'training_reminder',
        'training',
        'Reminder: Training Session "{{trainingTitle}}" - {{scheduledDate}}',
        'Hello {{recipientName}},

This is a reminder about your upcoming training session:

Training: {{trainingTitle}}
Date: {{scheduledDate}}
Duration: {{duration}} minutes
Instructor: {{instructor}}
Location: {{location}}

Description: {{description}}

Please ensure you attend this training session.

View Training Details: {{trainingUrl}}

Best regards,
E-QMS System',
        'Default template for training session reminders',
        '["recipientName", "trainingTitle", "scheduledDate", "duration", "instructor", "location", "description", "trainingUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_training_expiry_warning',
        'Training Certificate Expiry Warning',
        'training_expiry_warning',
        'training',
        'Training Certificate Expiring Soon: {{trainingTitle}}',
        'Hello {{recipientName}},

Your training certificate is expiring soon:

Training: {{trainingTitle}}
Certificate Issued: {{completedDate}}
Expiry Date: {{expiryDate}}
Days Until Expiry: {{daysUntilExpiry}}

Please schedule a refresher training session to maintain your certification.

View Training History: {{trainingUrl}}

Best regards,
E-QMS System',
        'Default template for training certificate expiry warnings',
        '["recipientName", "trainingTitle", "completedDate", "expiryDate", "daysUntilExpiry", "trainingUrl"]',
        1,
        1
    );

    INSERT INTO EmailTemplates (name, displayName, type, category, subject, body, description, placeholders, isActive, isDefault)
    VALUES (
        'default_audit_assignment',
        'Audit Assignment Notification',
        'audit_assignment',
        'audit',
        'Audit Assignment: {{auditTitle}} - {{auditDate}}',
        'Hello {{auditorName}},

You have been assigned as {{auditorRole}} for the following audit:

Audit: {{auditTitle}}
Type: {{auditType}}
Date: {{auditDate}}
Scope: {{scope}}
Assigned By: {{assignedByName}}

Auditee(s): {{auditees}}

Please review the audit plan and prepare accordingly.

View Audit Details: {{auditUrl}}

Best regards,
E-QMS System',
        'Default template for audit assignment notifications',
        '["auditorName", "auditorRole", "auditTitle", "auditType", "auditDate", "scope", "assignedByName", "auditees", "auditUrl"]',
        1,
        1
    );

    PRINT 'Default email templates inserted successfully';
END
GO
