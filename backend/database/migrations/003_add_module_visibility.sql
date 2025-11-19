-- Create module_visibility table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[module_visibility]') AND type in (N'U'))
BEGIN
    CREATE TABLE module_visibility (
        id INT PRIMARY KEY IDENTITY(1,1),
        module_key NVARCHAR(50) NOT NULL UNIQUE,
        module_name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        is_enabled BIT DEFAULT 1,
        icon NVARCHAR(50),
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Create index on module_key
    CREATE INDEX idx_module_visibility_key ON module_visibility(module_key);
    
    -- Create index on is_enabled for quick filtering
    CREATE INDEX idx_module_visibility_enabled ON module_visibility(is_enabled);

    PRINT 'Table module_visibility created successfully';
END
ELSE
BEGIN
    PRINT 'Table module_visibility already exists';
END
GO

-- Insert default module visibility settings
IF NOT EXISTS (SELECT * FROM module_visibility WHERE module_key = 'documents')
BEGIN
    INSERT INTO module_visibility (module_key, module_name, description, is_enabled, icon, display_order)
    VALUES 
    ('documents', 'Documents', 'Document management and control', 1, 'file-text', 1),
    ('processes', 'Processes', 'Business process management', 1, 'workflow', 2),
    ('audits', 'Audits', 'Internal and external audit management', 1, 'clipboard-check', 3),
    ('ncr', 'NCR', 'Non-Conformance Reports', 1, 'alert-circle', 4),
    ('capa', 'CAPA', 'Corrective and Preventive Actions', 1, 'target', 5),
    ('training', 'Training', 'Training management and competency tracking', 1, 'book-open', 6),
    ('risks', 'Risks', 'Risk assessment and management', 1, 'alert-triangle', 7),
    ('equipment', 'Equipment', 'Equipment and asset management', 1, 'tool', 8),
    ('inspection', 'Inspection', 'Mobile inspections and quality checks', 1, 'check-square', 9),
    ('improvements', 'Improvement Ideas', 'Continuous improvement tracking', 1, 'lightbulb', 10);

    PRINT 'Default module visibility settings inserted successfully';
END
ELSE
BEGIN
    PRINT 'Default module visibility settings already exist';
END
GO
