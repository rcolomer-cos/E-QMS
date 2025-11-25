-- =============================================
-- Patch 74: Create UserWorkRoles Table
-- Description: Table for assigning work roles to users with skill level tracking
-- Author: System
-- Date: 2025-11-25
-- =============================================

USE [eqms];
GO

-- Create UserWorkRoles table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserWorkRoles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[UserWorkRoles] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [userId] INT NOT NULL,
        [workRoleId] INT NOT NULL,
        [skillLevelId] INT NULL,
        
        -- Assignment Details
        [assignedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [effectiveDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [expiryDate] DATETIME2 NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, expired, pending, suspended
        
        -- Verification
        [verified] BIT NOT NULL DEFAULT 0,
        [verifiedBy] INT NULL,
        [verifiedAt] DATETIME2 NULL,
        [verificationNotes] NVARCHAR(MAX) NULL,
        
        -- Additional Information
        [notes] NVARCHAR(MAX) NULL,
        [trainingRequired] BIT NOT NULL DEFAULT 0,
        [trainingCompleted] BIT NOT NULL DEFAULT 0,
        [trainingCompletedDate] DATETIME2 NULL,
        [certificationRequired] BIT NOT NULL DEFAULT 0,
        [certificationId] INT NULL,
        
        -- Assessment
        [lastAssessmentDate] DATETIME2 NULL,
        [lastAssessmentScore] DECIMAL(5,2) NULL,
        [lastAssessedBy] INT NULL,
        [nextAssessmentDate] DATETIME2 NULL,
        
        -- Audit Fields
        [assignedBy] INT NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updatedBy] INT NULL,
        [active] BIT NOT NULL DEFAULT 1,
        
        -- Foreign Keys
        CONSTRAINT [FK_UserWorkRoles_Users] FOREIGN KEY ([userId]) 
            REFERENCES [dbo].[Users]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserWorkRoles_WorkRoles] FOREIGN KEY ([workRoleId]) 
            REFERENCES [dbo].[WorkRoles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserWorkRoles_SkillLevels] FOREIGN KEY ([skillLevelId]) 
            REFERENCES [dbo].[SkillLevels]([id]) ON DELETE SET NULL,
        CONSTRAINT [FK_UserWorkRoles_AssignedBy] FOREIGN KEY ([assignedBy]) 
            REFERENCES [dbo].[Users]([id]),
        CONSTRAINT [FK_UserWorkRoles_VerifiedBy] FOREIGN KEY ([verifiedBy]) 
            REFERENCES [dbo].[Users]([id]),
        CONSTRAINT [FK_UserWorkRoles_UpdatedBy] FOREIGN KEY ([updatedBy]) 
            REFERENCES [dbo].[Users]([id]),
        CONSTRAINT [FK_UserWorkRoles_LastAssessedBy] FOREIGN KEY ([lastAssessedBy]) 
            REFERENCES [dbo].[Users]([id]),
        
        -- Unique constraint: One user can only have one active assignment per work role
        CONSTRAINT [UQ_UserWorkRoles_User_WorkRole] UNIQUE ([userId], [workRoleId])
    );

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_UserId] ON [dbo].[UserWorkRoles]([userId]) INCLUDE ([workRoleId], [skillLevelId], [status]);
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_WorkRoleId] ON [dbo].[UserWorkRoles]([workRoleId]) INCLUDE ([userId], [skillLevelId], [status]);
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_SkillLevelId] ON [dbo].[UserWorkRoles]([skillLevelId]) INCLUDE ([userId], [workRoleId]);
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_Status] ON [dbo].[UserWorkRoles]([status]) INCLUDE ([userId], [workRoleId]);
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_ExpiryDate] ON [dbo].[UserWorkRoles]([expiryDate]) WHERE [expiryDate] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_UserWorkRoles_AssessmentDate] ON [dbo].[UserWorkRoles]([nextAssessmentDate]) WHERE [nextAssessmentDate] IS NOT NULL;

    PRINT 'Table UserWorkRoles created successfully.';
END
ELSE
BEGIN
    PRINT 'Table UserWorkRoles already exists.';
END
GO

-- Create trigger to update updatedAt timestamp
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_UserWorkRoles_UpdateTimestamp')
BEGIN
    EXEC('
    CREATE TRIGGER TR_UserWorkRoles_UpdateTimestamp
    ON [dbo].[UserWorkRoles]
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE [dbo].[UserWorkRoles]
        SET [updatedAt] = GETDATE()
        WHERE [id] IN (SELECT DISTINCT [id] FROM INSERTED);
    END
    ');
    
    PRINT 'Trigger TR_UserWorkRoles_UpdateTimestamp created successfully.';
END
GO

-- Insert sample data for demonstration (Optional - remove if not needed)
IF NOT EXISTS (SELECT 1 FROM [dbo].[UserWorkRoles] WHERE [id] = 1)
BEGIN
    -- Sample: Assign Quality Manager role to user 1 with Expert skill level (5)
    DECLARE @SampleUserId INT = 1;
    DECLARE @QualityManagerRoleId INT;
    DECLARE @ExpertSkillLevelId INT;
    
    SELECT @QualityManagerRoleId = id FROM [dbo].[WorkRoles] WHERE [code] = 'QM-001';
    SELECT @ExpertSkillLevelId = id FROM [dbo].[SkillLevels] WHERE [level] = 5;
    
    IF @QualityManagerRoleId IS NOT NULL AND @ExpertSkillLevelId IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[UserWorkRoles] 
        (
            [userId], 
            [workRoleId], 
            [skillLevelId], 
            [assignedDate], 
            [effectiveDate], 
            [status], 
            [verified], 
            [notes], 
            [assignedBy]
        )
        VALUES 
        (
            @SampleUserId, 
            @QualityManagerRoleId, 
            @ExpertSkillLevelId, 
            GETDATE(), 
            GETDATE(), 
            'active', 
            1, 
            'Initial assignment - Demonstrated extensive experience in quality management', 
            @SampleUserId
        );
        
        PRINT 'Sample user work role assignment created.';
    END
    ELSE
    BEGIN
        PRINT 'Sample data not inserted - Required WorkRole or SkillLevel not found.';
    END
END
GO

PRINT 'Patch 74 completed successfully.';
GO
