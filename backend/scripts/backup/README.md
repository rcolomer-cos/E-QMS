# E-QMS Database Backup and Restore Scripts

This directory contains scripts for automated backup and restore of the E-QMS MSSQL database.

## Available Scripts

### PowerShell Scripts (Windows)

#### 1. `backup-database.ps1`
Creates a full backup of the database with compression and automatic cleanup of old backups.

**Features:**
- Full database backup with compression
- Automatic timestamp in filename
- Configurable retention policy (default: 30 days)
- Automatic cleanup of old backups
- JSON output option for programmatic use

**Usage:**
```powershell
.\backup-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupPath "C:\Backups\EQMS"
```

**With retention and SQL authentication:**
```powershell
.\backup-database.ps1 -ServerInstance "localhost\SQLEXPRESS" -Database "eqms" -BackupPath "C:\Backups\EQMS" -RetentionDays 60 -Username "sa" -Password "YourPassword"
```

**Parameters:**
- `-ServerInstance` (required): SQL Server instance name
- `-Database` (required): Database name to backup
- `-BackupPath` (required): Directory for backup files
- `-RetentionDays` (optional): Days to retain backups (default: 30)
- `-Compress` (optional): Enable compression (default: true)
- `-Username` (optional): SQL authentication username
- `-Password` (optional): SQL authentication password

#### 2. `restore-database.ps1`
Restores the database from a backup file.

**Features:**
- Full database restore
- Automatic file relocation
- Verify-only mode to check backup validity
- Replace existing database option
- Connection termination handling

**Usage:**
```powershell
.\restore-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupFile "C:\Backups\EQMS\eqms_backup_20250118_120000.bak"
```

**Verify backup without restoring:**
```powershell
.\restore-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupFile "C:\Backups\EQMS\eqms_backup.bak" -VerifyOnly $true
```

**Replace existing database:**
```powershell
.\restore-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupFile "C:\Backups\EQMS\eqms_backup.bak" -ReplaceExisting $true
```

**Parameters:**
- `-ServerInstance` (required): SQL Server instance name
- `-Database` (required): Target database name
- `-BackupFile` (required): Full path to backup file
- `-DataPath` (optional): Custom data file location
- `-LogPath` (optional): Custom log file location
- `-ReplaceExisting` (optional): Replace existing database (default: false)
- `-VerifyOnly` (optional): Only verify backup (default: false)
- `-Username` (optional): SQL authentication username
- `-Password` (optional): SQL authentication password

### SQL Scripts (Cross-platform)

#### 3. `backup-database.sql`
T-SQL script for creating database backups.

**Usage with SQLCMD:**
```bash
sqlcmd -S localhost -d eqms -i backup-database.sql -v DatabaseName="eqms" BackupPath="C:\Backups\EQMS"
```

**Usage in SSMS:**
1. Open the script in SQL Server Management Studio
2. Modify the variables at the top of the script:
   ```sql
   DECLARE @DatabaseName NVARCHAR(128) = N'eqms';
   DECLARE @BackupPath NVARCHAR(500) = N'C:\Backups\EQMS\';
   ```
3. Execute the script

#### 4. `restore-database.sql`
T-SQL script for restoring database from backup.

**Usage with SQLCMD:**
```bash
sqlcmd -S localhost -d master -i restore-database.sql -v DatabaseName="eqms" BackupFile="C:\Backups\EQMS\eqms_backup.bak"
```

**Usage in SSMS:**
1. Open the script in SQL Server Management Studio
2. Connect to the master database
3. Modify the variables at the top of the script:
   ```sql
   DECLARE @DatabaseName NVARCHAR(128) = N'eqms';
   DECLARE @BackupFile NVARCHAR(500) = N'C:\Backups\eqms_backup.bak';
   DECLARE @ReplaceExisting BIT = 0;  -- Set to 1 to replace existing database
   ```
4. Execute the script

## Best Practices

### Backup Strategy
1. **Schedule Regular Backups**: Set up automated backups using Windows Task Scheduler or SQL Server Agent
2. **Test Restores**: Regularly verify that backups can be restored successfully
3. **Off-site Storage**: Copy backup files to off-site or cloud storage
4. **Multiple Retention Periods**: Keep daily backups for 7 days, weekly for 4 weeks, monthly for 1 year
5. **Monitor Backup Size**: Track backup file sizes to ensure they complete successfully

### Security Considerations
1. **Secure Backup Location**: Ensure backup directory has restricted access
2. **Encrypt Backups**: Consider using SQL Server backup encryption for sensitive data
3. **Secure Scripts**: Don't hardcode passwords in scripts; use environment variables or secure credential storage
4. **Audit Access**: Log who runs backups and restores

### Automated Scheduling

#### Using Windows Task Scheduler (PowerShell)
Create a scheduled task to run daily backups:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\Path\To\backup-database.ps1 -ServerInstance localhost -Database eqms -BackupPath C:\Backups\EQMS"

$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

Register-ScheduledTask -Action $action -Trigger $trigger `
  -TaskName "E-QMS Daily Backup" -Description "Daily backup of E-QMS database"
```

#### Using SQL Server Agent (T-SQL)
Create a SQL Server Agent job for daily backups:

```sql
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'E-QMS Daily Backup',
    @enabled = 1;

EXEC sp_add_jobstep
    @job_name = N'E-QMS Daily Backup',
    @step_name = N'Run Backup',
    @subsystem = N'TSQL',
    @command = N'EXEC sp_executesql N''..backup script..''',
    @database_name = N'eqms';

EXEC sp_add_schedule
    @schedule_name = N'Daily at 2 AM',
    @freq_type = 4,  -- Daily
    @freq_interval = 1,
    @active_start_time = 020000;  -- 2:00 AM

EXEC sp_attach_schedule
   @job_name = N'E-QMS Daily Backup',
   @schedule_name = N'Daily at 2 AM';

EXEC sp_add_jobserver
    @job_name = N'E-QMS Daily Backup';
GO
```

## Troubleshooting

### Common Issues

#### PowerShell Module Not Found
If you see an error about the SqlServer module not being found:
```powershell
Install-Module -Name SqlServer -Force -AllowClobber -Scope CurrentUser
```

#### Permission Denied
Ensure the SQL Server service account has:
- Read/write access to the backup directory
- Necessary database permissions (BACKUP DATABASE permission)

#### Database in Use (Restore)
If restore fails because database is in use:
1. Close all connections to the database
2. Use the `-ReplaceExisting $true` parameter
3. Or manually set the database to single user mode first

#### Insufficient Disk Space
Monitor available disk space:
- Compressed backups typically use 20-40% of database size
- Ensure at least 2x database size is available

## API Integration

These scripts can be called from the E-QMS backend API. The PowerShell scripts support JSON output when the environment variable `OUTPUT_JSON` is set to `true`:

```powershell
$env:OUTPUT_JSON = "true"
.\backup-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupPath "C:\Backups\EQMS"
```

This returns a JSON object with backup details that can be parsed by the application.

## Support

For issues or questions about backup and restore procedures, please contact your database administrator or refer to the main E-QMS documentation.
