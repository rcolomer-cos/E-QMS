-- Create system_settings table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[system_settings]') AND type in (N'U'))
BEGIN
    CREATE TABLE system_settings (
        id INT PRIMARY KEY IDENTITY(1,1),
        setting_key NVARCHAR(100) NOT NULL UNIQUE,
        setting_value NVARCHAR(MAX),
        setting_type NVARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
        category NVARCHAR(50) NOT NULL, -- 'general', 'notifications', 'audit', 'backup', 'permissions'
        display_name NVARCHAR(200) NOT NULL,
        description NVARCHAR(500),
        is_editable BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Create index on setting_key
    CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
    
    -- Create index on category
    CREATE INDEX idx_system_settings_category ON system_settings(category);

    PRINT 'Table system_settings created successfully';
END
ELSE
BEGIN
    PRINT 'Table system_settings already exists';
END
GO

-- Insert default system settings
IF NOT EXISTS (SELECT * FROM system_settings WHERE setting_key = 'system_name')
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, setting_type, category, display_name, description, is_editable)
    VALUES 
    -- General Settings
    ('system_name', 'E-QMS', 'string', 'general', 'System Name', 'The name of the quality management system displayed to users', 1),
    ('system_version', '1.0.0', 'string', 'general', 'System Version', 'Current version of the system', 0),
    ('organization_name', '', 'string', 'general', 'Organization Name', 'Name of the organization using this system', 1),
    
    -- Notification Settings
    ('reminder_training_days', '30', 'number', 'notifications', 'Training Reminder Days', 'Days before training expiry to send reminders', 1),
    ('reminder_calibration_days', '30', 'number', 'notifications', 'Calibration Reminder Days', 'Days before calibration due to send reminders', 1),
    ('reminder_maintenance_days', '30', 'number', 'notifications', 'Maintenance Reminder Days', 'Days before maintenance due to send reminders', 1),
    ('reminder_capa_days', '7', 'number', 'notifications', 'CAPA Reminder Days', 'Days before CAPA deadline to send reminders', 1),
    ('notification_batch_size', '50', 'number', 'notifications', 'Notification Batch Size', 'Number of notifications to process in each batch', 1),
    
    -- Audit Configuration
    ('audit_log_retention_days', '365', 'number', 'audit', 'Audit Log Retention', 'Number of days to retain audit logs before archiving', 1),
    ('audit_log_level', 'info', 'string', 'audit', 'Audit Log Level', 'Logging level for audit events (debug, info, warning, error)', 1),
    ('audit_sensitive_data', 'false', 'boolean', 'audit', 'Log Sensitive Data', 'Whether to log sensitive data in audit trails', 1),
    
    -- Backup Configuration
    ('backup_retention_days', '30', 'number', 'backup', 'Backup Retention Days', 'Number of days to retain backup files', 1),
    ('backup_auto_enabled', 'true', 'boolean', 'backup', 'Auto Backup Enabled', 'Enable automatic scheduled backups', 1),
    ('backup_compression', 'true', 'boolean', 'backup', 'Backup Compression', 'Enable compression for backup files', 1),
    
    -- Default Permissions
    ('default_user_role', 'user', 'string', 'permissions', 'Default User Role', 'Default role assigned to new users', 1),
    ('allow_self_registration', 'false', 'boolean', 'permissions', 'Allow Self Registration', 'Allow users to self-register accounts', 1),
    ('require_approval_for_new_users', 'true', 'boolean', 'permissions', 'Require Approval for New Users', 'New users require admin approval before access', 1),
    ('session_timeout_minutes', '480', 'number', 'permissions', 'Session Timeout (Minutes)', 'User session timeout in minutes', 1);

    PRINT 'Default system settings inserted successfully';
END
ELSE
BEGIN
    PRINT 'Default system settings already exist';
END
GO
