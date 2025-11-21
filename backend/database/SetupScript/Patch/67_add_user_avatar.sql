-- =============================================
-- Add User Avatar Support to Users Table
-- =============================================
-- Adds avatarUrl field to store user avatar image path for profile pictures.
-- Avatars can be uploaded via API and will display as circular images in the UI,
-- with fallback to colored initials if no avatar is uploaded.

-- Check if avatarUrl column already exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') 
    AND name = 'avatarUrl'
)
BEGIN
    -- Add avatarUrl field (optional, stores path to avatar image)
    ALTER TABLE Users
    ADD avatarUrl NVARCHAR(500) NULL;
    
    PRINT 'avatarUrl column added to Users table';
END
GO

-- Record schema version
IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.67' AND scriptName = '67_add_user_avatar.sql')
BEGIN
    INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
    VALUES (
        '1.0.67',
        'Add user avatar support to Users table',
        '67_add_user_avatar.sql',
        'SUCCESS',
        'Adds avatarUrl field to store user profile picture image path. Supports image upload with circular cropping and fallback to initials display.'
    );
END
GO
