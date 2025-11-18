-- ================================================
-- E-QMS Database Backup Script (T-SQL)
-- ================================================
-- This script creates a full backup of the E-QMS database
-- with compression enabled.
--
-- USAGE:
--   1. Open this file in SQL Server Management Studio (SSMS)
--      or use sqlcmd command line tool
--   2. Update the variables below with your values
--   3. Execute the script
--
-- SQLCMD USAGE:
--   sqlcmd -S <ServerInstance> -d <Database> -i backup-database.sql
--   -v BackupPath="C:\Backups\EQMS" DatabaseName="eqms"
--
-- ================================================

-- Configuration Variables
-- Update these values or pass them as SQLCMD variables
DECLARE @DatabaseName NVARCHAR(128) = N'$(DatabaseName)';  -- Or set manually: N'eqms'
DECLARE @BackupPath NVARCHAR(500) = N'$(BackupPath)';      -- Or set manually: N'C:\Backups\EQMS\'
DECLARE @EnableCompression BIT = 1;                         -- 1 = enabled, 0 = disabled
DECLARE @RetentionDays INT = 30;                            -- Number of days to keep old backups

-- Script Variables (auto-generated)
DECLARE @Timestamp NVARCHAR(20);
DECLARE @BackupFileName NVARCHAR(500);
DECLARE @BackupFullPath NVARCHAR(500);
DECLARE @BackupCommand NVARCHAR(1000);
DECLARE @CleanupCommand NVARCHAR(1000);
DECLARE @ErrorMessage NVARCHAR(4000);

-- Validate inputs
IF @DatabaseName IS NULL OR @DatabaseName = N'$(DatabaseName)' OR LEN(@DatabaseName) = 0
BEGIN
    RAISERROR('Error: DatabaseName is not set. Please provide a database name.', 16, 1);
    RETURN;
END

IF @BackupPath IS NULL OR @BackupPath = N'$(BackupPath)' OR LEN(@BackupPath) = 0
BEGIN
    RAISERROR('Error: BackupPath is not set. Please provide a backup path.', 16, 1);
    RETURN;
END

-- Ensure backup path ends with backslash
IF RIGHT(@BackupPath, 1) <> N'\'
    SET @BackupPath = @BackupPath + N'\';

-- Generate timestamp for backup filename
SET @Timestamp = CONVERT(NVARCHAR(20), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(20), GETDATE(), 108), ':', '');

-- Build backup filename and full path
SET @BackupFileName = @DatabaseName + N'_backup_' + @Timestamp + N'.bak';
SET @BackupFullPath = @BackupPath + @BackupFileName;

-- Print backup information
PRINT '';
PRINT '========================================';
PRINT 'E-QMS Database Backup';
PRINT '========================================';
PRINT 'Server: ' + @@SERVERNAME;
PRINT 'Database: ' + @DatabaseName;
PRINT 'Backup File: ' + @BackupFullPath;
PRINT 'Compression: ' + CASE WHEN @EnableCompression = 1 THEN 'Enabled' ELSE 'Disabled' END;
PRINT 'Retention Days: ' + CAST(@RetentionDays AS NVARCHAR(10));
PRINT '========================================';
PRINT '';

-- Verify database exists
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @DatabaseName)
BEGIN
    SET @ErrorMessage = N'Error: Database ''' + @DatabaseName + N''' does not exist.';
    RAISERROR(@ErrorMessage, 16, 1);
    RETURN;
END

-- Perform the backup
BEGIN TRY
    PRINT 'Starting backup process...';
    
    IF @EnableCompression = 1
    BEGIN
        BACKUP DATABASE @DatabaseName
        TO DISK = @BackupFullPath
        WITH COMPRESSION, 
             INIT, 
             FORMAT,
             NAME = @DatabaseName + N' Full Backup',
             DESCRIPTION = N'Full backup of ' + @DatabaseName + N' database',
             STATS = 10;
    END
    ELSE
    BEGIN
        BACKUP DATABASE @DatabaseName
        TO DISK = @BackupFullPath
        WITH INIT, 
             FORMAT,
             NAME = @DatabaseName + N' Full Backup',
             DESCRIPTION = N'Full backup of ' + @DatabaseName + N' database',
             STATS = 10;
    END
    
    PRINT '';
    PRINT 'Backup completed successfully!';
    PRINT 'Backup location: ' + @BackupFullPath;
    
    -- Get backup file size (if xp_fileexist is available)
    DECLARE @BackupSizeKB BIGINT;
    
    SELECT @BackupSizeKB = CAST(backup_size / 1024 AS BIGINT)
    FROM msdb.dbo.backupset
    WHERE database_name = @DatabaseName
    AND backup_finish_date = (
        SELECT MAX(backup_finish_date)
        FROM msdb.dbo.backupset
        WHERE database_name = @DatabaseName
    );
    
    IF @BackupSizeKB IS NOT NULL
    BEGIN
        PRINT 'Backup size: ' + CAST(@BackupSizeKB / 1024 AS NVARCHAR(20)) + ' MB';
    END
    
END TRY
BEGIN CATCH
    SET @ErrorMessage = N'Backup failed: ' + ERROR_MESSAGE();
    PRINT '';
    PRINT @ErrorMessage;
    RAISERROR(@ErrorMessage, 16, 1);
    RETURN;
END CATCH

-- Cleanup old backups (if retention is set)
IF @RetentionDays > 0
BEGIN
    PRINT '';
    PRINT 'Cleaning up old backups (retention: ' + CAST(@RetentionDays AS NVARCHAR(10)) + ' days)...';
    
    BEGIN TRY
        -- Use xp_delete_file to remove old backup files
        -- Note: This requires sysadmin privileges
        EXEC master.dbo.xp_delete_file 
            0,                          -- File type (0 = backup files)
            @BackupPath,                -- Folder path
            N'bak',                     -- File extension
            @Timestamp,                 -- Date (files older than this will be deleted)
            1;                          -- Delete subdirectories
        
        PRINT 'Old backups cleaned up successfully.';
    END TRY
    BEGIN CATCH
        PRINT 'Warning: Could not automatically clean up old backups.';
        PRINT 'You may need to manually delete files older than ' + CAST(@RetentionDays AS NVARCHAR(10)) + ' days.';
        PRINT 'Error: ' + ERROR_MESSAGE();
    END CATCH
END

-- Display summary
PRINT '';
PRINT '========================================';
PRINT 'Backup Summary';
PRINT '========================================';
PRINT 'Status: SUCCESS';
PRINT 'Database: ' + @DatabaseName;
PRINT 'Backup File: ' + @BackupFileName;
PRINT 'Location: ' + @BackupFullPath;
PRINT '========================================';
PRINT '';

-- Return success code
SELECT 'SUCCESS' AS BackupStatus, 
       @BackupFileName AS FileName, 
       @BackupFullPath AS FilePath,
       GETDATE() AS BackupTime;
