<#
.SYNOPSIS
    Automated MSSQL Database Restore Script

.DESCRIPTION
    Restores the E-QMS database from a backup file.
    Supports restoring to a different database name and verification.

.PARAMETER ServerInstance
    SQL Server instance name (e.g., localhost, localhost\SQLEXPRESS, or server\instance)

.PARAMETER Database
    Target database name to restore to

.PARAMETER BackupFile
    Full path to the backup file (.bak)

.PARAMETER DataPath
    Path where data files will be restored (optional, uses SQL Server default if not specified)

.PARAMETER LogPath
    Path where log files will be restored (optional, uses SQL Server default if not specified)

.PARAMETER ReplaceExisting
    Replace existing database if it exists (optional, default: false)

.PARAMETER VerifyOnly
    Only verify the backup file without restoring (optional, default: false)

.EXAMPLE
    .\restore-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupFile "C:\Backups\EQMS\eqms_backup_20250118_120000.bak"

.EXAMPLE
    .\restore-database.ps1 -ServerInstance "localhost\SQLEXPRESS" -Database "eqms_restored" -BackupFile "C:\Backups\eqms_backup.bak" -ReplaceExisting $true
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerInstance,
    
    [Parameter(Mandatory=$true)]
    [string]$Database,
    
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [string]$DataPath,
    
    [Parameter(Mandatory=$false)]
    [string]$LogPath,
    
    [Parameter(Mandatory=$false)]
    [bool]$ReplaceExisting = $false,
    
    [Parameter(Mandatory=$false)]
    [bool]$VerifyOnly = $false,

    [Parameter(Mandatory=$false)]
    [string]$Username,

    [Parameter(Mandatory=$false)]
    [string]$Password
)

# Import SQL Server module
try {
    Import-Module SqlServer -ErrorAction Stop
    Write-Host "SQL Server PowerShell module loaded successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to load SQL Server module. Attempting to install..." -ForegroundColor Yellow
    try {
        Install-Module -Name SqlServer -Force -AllowClobber -Scope CurrentUser
        Import-Module SqlServer
        Write-Host "SQL Server PowerShell module installed and loaded." -ForegroundColor Green
    } catch {
        Write-Host "Error: Unable to load or install SQL Server PowerShell module." -ForegroundColor Red
        Write-Host "Please install it manually: Install-Module -Name SqlServer" -ForegroundColor Red
        exit 1
    }
}

# Validate backup file exists
if (!(Test-Path -Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "E-QMS Database Restore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server Instance: $ServerInstance"
Write-Host "Target Database: $Database"
Write-Host "Backup File: $BackupFile"
Write-Host "Replace Existing: $ReplaceExisting"
Write-Host "Verify Only: $VerifyOnly"
Write-Host "========================================`n" -ForegroundColor Cyan

# Build connection parameters
$connectionParams = @{
    ServerInstance = $ServerInstance
}

if ($Username -and $Password) {
    $connectionParams.Add("Username", $Username)
    $connectionParams.Add("Password", $Password)
}

# If verify only, just check the backup file
if ($VerifyOnly) {
    try {
        Write-Host "Verifying backup file..." -ForegroundColor Yellow
        
        $verifyQuery = "RESTORE VERIFYONLY FROM DISK = N'$BackupFile'"
        Invoke-Sqlcmd @connectionParams -Query $verifyQuery -QueryTimeout 0
        
        Write-Host "`nBackup file verification successful!" -ForegroundColor Green
        Write-Host "The backup file is valid and can be restored." -ForegroundColor Green
        
        # Get backup header information
        $headerQuery = "RESTORE HEADERONLY FROM DISK = N'$BackupFile'"
        $headerInfo = Invoke-Sqlcmd @connectionParams -Query $headerQuery
        
        Write-Host "`nBackup Information:" -ForegroundColor Cyan
        Write-Host "Database Name: $($headerInfo.DatabaseName)"
        Write-Host "Backup Type: $($headerInfo.BackupType)"
        Write-Host "Backup Start Date: $($headerInfo.BackupStartDate)"
        Write-Host "Backup Finish Date: $($headerInfo.BackupFinishDate)"
        Write-Host "Compressed Backup: $($headerInfo.Compressed)"
        
        exit 0
        
    } catch {
        Write-Host "`nError during backup verification:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Get logical file names from backup
try {
    Write-Host "Reading backup file information..." -ForegroundColor Yellow
    
    $fileListQuery = "RESTORE FILELISTONLY FROM DISK = N'$BackupFile'"
    $fileList = Invoke-Sqlcmd @connectionParams -Query $fileListQuery
    
    Write-Host "Logical files in backup:" -ForegroundColor Green
    $fileList | ForEach-Object {
        Write-Host "  - $($_.LogicalName) ($($_.Type))" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Error reading backup file:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Get default data and log paths if not specified
if (!$DataPath -or !$LogPath) {
    try {
        $defaultPathsQuery = @"
SELECT 
    SERVERPROPERTY('InstanceDefaultDataPath') AS DefaultDataPath,
    SERVERPROPERTY('InstanceDefaultLogPath') AS DefaultLogPath
"@
        $defaultPaths = Invoke-Sqlcmd @connectionParams -Query $defaultPathsQuery
        
        if (!$DataPath) {
            $DataPath = $defaultPaths.DefaultDataPath
        }
        if (!$LogPath) {
            $LogPath = $defaultPaths.DefaultLogPath
        }
        
        Write-Host "`nRestore Paths:" -ForegroundColor Cyan
        Write-Host "Data Path: $DataPath"
        Write-Host "Log Path: $LogPath"
        
    } catch {
        Write-Host "Warning: Could not determine default paths. Using backup file locations." -ForegroundColor Yellow
    }
}

# Check if database exists
try {
    $checkDbQuery = "SELECT database_id FROM sys.databases WHERE name = '$Database'"
    $dbExists = Invoke-Sqlcmd @connectionParams -Query $checkDbQuery
    
    if ($dbExists -and !$ReplaceExisting) {
        Write-Host "`nError: Database '$Database' already exists." -ForegroundColor Red
        Write-Host "Use -ReplaceExisting `$true to replace the existing database." -ForegroundColor Yellow
        exit 1
    }
    
    if ($dbExists -and $ReplaceExisting) {
        Write-Host "`nWarning: Existing database '$Database' will be replaced!" -ForegroundColor Yellow
        
        # Set database to single user mode to close connections
        try {
            $singleUserQuery = "ALTER DATABASE [$Database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE"
            Invoke-Sqlcmd @connectionParams -Query $singleUserQuery
            Write-Host "Set database to single user mode" -ForegroundColor Gray
        } catch {
            Write-Host "Warning: Could not set single user mode: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Error checking database existence:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Build RESTORE DATABASE command
try {
    Write-Host "`nStarting restore process..." -ForegroundColor Yellow
    
    $restoreQuery = "RESTORE DATABASE [$Database] FROM DISK = N'$BackupFile' WITH "
    
    # Add file relocations
    $moveStatements = @()
    foreach ($file in $fileList) {
        if ($file.Type -eq 'D') {
            # Data file
            $newFileName = "${Database}.mdf"
            $newFilePath = Join-Path -Path $DataPath -ChildPath $newFileName
            $moveStatements += "MOVE N'$($file.LogicalName)' TO N'$newFilePath'"
        } elseif ($file.Type -eq 'L') {
            # Log file
            $newFileName = "${Database}_log.ldf"
            $newFilePath = Join-Path -Path $LogPath -ChildPath $newFileName
            $moveStatements += "MOVE N'$($file.LogicalName)' TO N'$newFilePath'"
        }
    }
    
    $restoreQuery += $moveStatements -join ', '
    
    if ($ReplaceExisting) {
        $restoreQuery += ", REPLACE"
    }
    
    $restoreQuery += ", STATS = 10, RECOVERY"
    
    # Execute restore
    Invoke-Sqlcmd @connectionParams -Query $restoreQuery -QueryTimeout 0
    
    Write-Host "`nRestore completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`nError during restore:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Attempt to bring database back online if restore failed
    try {
        $onlineQuery = "ALTER DATABASE [$Database] SET MULTI_USER"
        Invoke-Sqlcmd @connectionParams -Query $onlineQuery -ErrorAction SilentlyContinue
    } catch {
        # Ignore errors
    }
    
    exit 1
}

# Set database to multi-user mode
try {
    $multiUserQuery = "ALTER DATABASE [$Database] SET MULTI_USER"
    Invoke-Sqlcmd @connectionParams -Query $multiUserQuery
    Write-Host "Database set to multi-user mode" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not set multi-user mode: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Verify restore
try {
    $verifyQuery = "SELECT name, state_desc, recovery_model_desc FROM sys.databases WHERE name = '$Database'"
    $dbInfo = Invoke-Sqlcmd @connectionParams -Query $verifyQuery
    
    Write-Host "`nDatabase Status:" -ForegroundColor Cyan
    Write-Host "Name: $($dbInfo.name)"
    Write-Host "State: $($dbInfo.state_desc)"
    Write-Host "Recovery Model: $($dbInfo.recovery_model_desc)"
    
} catch {
    Write-Host "Warning: Could not verify database status" -ForegroundColor Yellow
}

# Display summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Restore Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Status: SUCCESS" -ForegroundColor Green
Write-Host "Database: $Database"
Write-Host "Restored From: $BackupFile"
Write-Host "========================================`n" -ForegroundColor Cyan

# Return restore information as JSON for programmatic use
$restoreInfo = @{
    success = $true
    database = $Database
    backupFile = $BackupFile
}

# Output JSON if called from application
if ($env:OUTPUT_JSON -eq "true") {
    $restoreInfo | ConvertTo-Json
}

exit 0
