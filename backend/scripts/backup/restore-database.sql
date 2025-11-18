-- ================================================
-- E-QMS Database Restore Script (T-SQL)
-- ================================================
-- This script restores the E-QMS database from a backup file.
--
-- USAGE:
--   1. Open this file in SQL Server Management Studio (SSMS)
--      or use sqlcmd command line tool
--   2. Update the variables below with your values
--   3. Execute the script
--
-- SQLCMD USAGE:
--   sqlcmd -S <ServerInstance> -d master -i restore-database.sql
--   -v DatabaseName="eqms" BackupFile="C:\Backups\EQMS\eqms_backup.bak"
--
-- IMPORTANT: Run this script in the master database context
-- ================================================

USE master;
GO

-- Configuration Variables
-- Update these values or pass them as SQLCMD variables
DECLARE @DatabaseName NVARCHAR(128) = N'$(DatabaseName)';      -- Or set manually: N'eqms'
DECLARE @BackupFile NVARCHAR(500) = N'$(BackupFile)';          -- Or set manually: N'C:\Backups\eqms_backup.bak'
DECLARE @ReplaceExisting BIT = 0;                               -- 1 = replace existing database, 0 = fail if exists
DECLARE @VerifyOnly BIT = 0;                                    -- 1 = verify only, 0 = perform restore
DECLARE @DataPath NVARCHAR(500) = NULL;                         -- Leave NULL to use SQL Server default
DECLARE @LogPath NVARCHAR(500) = NULL;                          -- Leave NULL to use SQL Server default

-- Script Variables
DECLARE @ErrorMessage NVARCHAR(4000);
DECLARE @RestoreCommand NVARCHAR(MAX);
DECLARE @DatabaseExists BIT = 0;

-- Validate inputs
IF @DatabaseName IS NULL OR @DatabaseName = N'$(DatabaseName)' OR LEN(@DatabaseName) = 0
BEGIN
    RAISERROR('Error: DatabaseName is not set. Please provide a database name.', 16, 1);
    RETURN;
END

IF @BackupFile IS NULL OR @BackupFile = N'$(BackupFile)' OR LEN(@BackupFile) = 0
BEGIN
    RAISERROR('Error: BackupFile is not set. Please provide a backup file path.', 16, 1);
    RETURN;
END

-- Print restore information
PRINT '';
PRINT '========================================';
PRINT 'E-QMS Database Restore';
PRINT '========================================';
PRINT 'Server: ' + @@SERVERNAME;
PRINT 'Target Database: ' + @DatabaseName;
PRINT 'Backup File: ' + @BackupFile;
PRINT 'Replace Existing: ' + CASE WHEN @ReplaceExisting = 1 THEN 'Yes' ELSE 'No' END;
PRINT 'Verify Only: ' + CASE WHEN @VerifyOnly = 1 THEN 'Yes' ELSE 'No' END;
PRINT '========================================';
PRINT '';

-- Verify backup file exists and is valid
BEGIN TRY
    PRINT 'Verifying backup file...';
    
    RESTORE VERIFYONLY 
    FROM DISK = @BackupFile;
    
    PRINT 'Backup file verification successful!';
    PRINT '';
    
END TRY
BEGIN CATCH
    SET @ErrorMessage = N'Backup file verification failed: ' + ERROR_MESSAGE();
    PRINT @ErrorMessage;
    RAISERROR(@ErrorMessage, 16, 1);
    RETURN;
END CATCH

-- Get backup header information
BEGIN TRY
    PRINT 'Backup Information:';
    
    SELECT 
        DatabaseName AS [Database Name],
        BackupName AS [Backup Name],
        BackupType AS [Type],
        BackupStartDate AS [Start Date],
        BackupFinishDate AS [Finish Date],
        CASE Compressed WHEN 1 THEN 'Yes' ELSE 'No' END AS [Compressed]
    FROM (
        SELECT TOP 1 *
        FROM msdb.dbo.backupset
        WHERE physical_device_name = @BackupFile
        ORDER BY backup_finish_date DESC
    ) bs
    OPTION (MAXDOP 1);
    
    PRINT '';
    
END TRY
BEGIN CATCH
    PRINT 'Warning: Could not retrieve backup header information.';
    PRINT ERROR_MESSAGE();
    PRINT '';
END CATCH

-- If verify only, exit here
IF @VerifyOnly = 1
BEGIN
    PRINT '========================================';
    PRINT 'Verification Complete';
    PRINT '========================================';
    PRINT 'The backup file is valid and can be restored.';
    PRINT '';
    RETURN;
END

-- Get logical file names from backup
DECLARE @FileListTable TABLE (
    LogicalName NVARCHAR(128),
    PhysicalName NVARCHAR(260),
    Type CHAR(1),
    FileGroupName NVARCHAR(128),
    Size NUMERIC(20,0),
    MaxSize NUMERIC(20,0),
    FileID BIGINT,
    CreateLSN NUMERIC(25,0),
    DropLSN NUMERIC(25,0),
    UniqueID UNIQUEIDENTIFIER,
    ReadOnlyLSN NUMERIC(25,0),
    ReadWriteLSN NUMERIC(25,0),
    BackupSizeInBytes BIGINT,
    SourceBlockSize INT,
    FileGroupID INT,
    LogGroupGUID UNIQUEIDENTIFIER,
    DifferentialBaseLSN NUMERIC(25,0),
    DifferentialBaseGUID UNIQUEIDENTIFIER,
    IsReadOnly BIT,
    IsPresent BIT,
    TDEThumbprint VARBINARY(32),
    SnapshotUrl NVARCHAR(360)
);

INSERT INTO @FileListTable
EXEC('RESTORE FILELISTONLY FROM DISK = ''' + @BackupFile + '''');

PRINT 'Logical files in backup:';
SELECT LogicalName, Type, Size / 1024 / 1024 AS [Size (MB)]
FROM @FileListTable;
PRINT '';

-- Check if database exists
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = @DatabaseName)
BEGIN
    SET @DatabaseExists = 1;
    
    IF @ReplaceExisting = 0
    BEGIN
        SET @ErrorMessage = N'Error: Database ''' + @DatabaseName + N''' already exists. Use @ReplaceExisting = 1 to replace it.';
        RAISERROR(@ErrorMessage, 16, 1);
        RETURN;
    END
    
    PRINT 'Warning: Existing database will be replaced!';
    
    -- Set database to single user mode to close connections
    BEGIN TRY
        DECLARE @SetSingleUserCmd NVARCHAR(500);
        SET @SetSingleUserCmd = N'ALTER DATABASE [' + @DatabaseName + N'] SET SINGLE_USER WITH ROLLBACK IMMEDIATE';
        EXEC sp_executesql @SetSingleUserCmd;
        PRINT 'Set database to single user mode.';
    END TRY
    BEGIN CATCH
        PRINT 'Warning: Could not set single user mode: ' + ERROR_MESSAGE();
    END CATCH
END

-- Get default data and log paths if not specified
IF @DataPath IS NULL OR @LogPath IS NULL
BEGIN
    BEGIN TRY
        SELECT 
            @DataPath = COALESCE(@DataPath, CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(500))),
            @LogPath = COALESCE(@LogPath, CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS NVARCHAR(500)));
        
        PRINT 'Restore Paths:';
        PRINT '  Data Path: ' + ISNULL(@DataPath, 'Default');
        PRINT '  Log Path: ' + ISNULL(@LogPath, 'Default');
        PRINT '';
    END TRY
    BEGIN CATCH
        PRINT 'Warning: Could not determine default paths. Using backup file locations.';
    END CATCH
END

-- Build RESTORE DATABASE command
SET @RestoreCommand = N'RESTORE DATABASE [' + @DatabaseName + N'] FROM DISK = N''' + @BackupFile + N''' WITH ';

-- Add file relocations
DECLARE @LogicalName NVARCHAR(128);
DECLARE @FileType CHAR(1);
DECLARE @NewPhysicalName NVARCHAR(500);
DECLARE @MoveStatements NVARCHAR(MAX) = N'';

DECLARE file_cursor CURSOR FOR
SELECT LogicalName, Type FROM @FileListTable;

OPEN file_cursor;
FETCH NEXT FROM file_cursor INTO @LogicalName, @FileType;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF @FileType = 'D'  -- Data file
    BEGIN
        SET @NewPhysicalName = @DataPath + @DatabaseName + N'.mdf';
    END
    ELSE IF @FileType = 'L'  -- Log file
    BEGIN
        SET @NewPhysicalName = @LogPath + @DatabaseName + N'_log.ldf';
    END
    
    SET @MoveStatements = @MoveStatements + N'MOVE N''' + @LogicalName + N''' TO N''' + @NewPhysicalName + N''', ';
    
    FETCH NEXT FROM file_cursor INTO @LogicalName, @FileType;
END

CLOSE file_cursor;
DEALLOCATE file_cursor;

SET @RestoreCommand = @RestoreCommand + @MoveStatements;

IF @ReplaceExisting = 1
BEGIN
    SET @RestoreCommand = @RestoreCommand + N'REPLACE, ';
END

SET @RestoreCommand = @RestoreCommand + N'STATS = 10, RECOVERY';

-- Perform the restore
BEGIN TRY
    PRINT 'Starting restore process...';
    PRINT 'Executing: ' + LEFT(@RestoreCommand, 200) + '...';
    PRINT '';
    
    EXEC sp_executesql @RestoreCommand;
    
    PRINT '';
    PRINT 'Restore completed successfully!';
    
END TRY
BEGIN CATCH
    SET @ErrorMessage = N'Restore failed: ' + ERROR_MESSAGE();
    PRINT '';
    PRINT @ErrorMessage;
    
    -- Attempt to bring database back online if restore failed
    IF @DatabaseExists = 1
    BEGIN
        BEGIN TRY
            DECLARE @SetMultiUserCmd NVARCHAR(500);
            SET @SetMultiUserCmd = N'ALTER DATABASE [' + @DatabaseName + N'] SET MULTI_USER';
            EXEC sp_executesql @SetMultiUserCmd;
        END TRY
        BEGIN CATCH
            -- Ignore errors
        END CATCH
    END
    
    RAISERROR(@ErrorMessage, 16, 1);
    RETURN;
END CATCH

-- Set database to multi-user mode
BEGIN TRY
    DECLARE @SetMultiUserCmd2 NVARCHAR(500);
    SET @SetMultiUserCmd2 = N'ALTER DATABASE [' + @DatabaseName + N'] SET MULTI_USER';
    EXEC sp_executesql @SetMultiUserCmd2;
    PRINT 'Database set to multi-user mode.';
END TRY
BEGIN CATCH
    PRINT 'Warning: Could not set multi-user mode: ' + ERROR_MESSAGE();
END CATCH

-- Verify restore
BEGIN TRY
    PRINT '';
    PRINT 'Database Status:';
    
    SELECT 
        name AS [Name],
        state_desc AS [State],
        recovery_model_desc AS [Recovery Model]
    FROM sys.databases
    WHERE name = @DatabaseName;
    
END TRY
BEGIN CATCH
    PRINT 'Warning: Could not verify database status.';
END CATCH

-- Display summary
PRINT '';
PRINT '========================================';
PRINT 'Restore Summary';
PRINT '========================================';
PRINT 'Status: SUCCESS';
PRINT 'Database: ' + @DatabaseName;
PRINT 'Restored From: ' + @BackupFile;
PRINT '========================================';
PRINT '';

-- Return success code
SELECT 'SUCCESS' AS RestoreStatus,
       @DatabaseName AS DatabaseName,
       @BackupFile AS BackupFile,
       GETDATE() AS RestoreTime;
