<#
.SYNOPSIS
    Automated MSSQL Database Backup Script

.DESCRIPTION
    Creates a full backup of the E-QMS database with timestamp and compression.
    Supports optional cleanup of old backups based on retention policy.

.PARAMETER ServerInstance
    SQL Server instance name (e.g., localhost, localhost\SQLEXPRESS, or server\instance)

.PARAMETER Database
    Database name to backup

.PARAMETER BackupPath
    Directory path where backup files will be stored

.PARAMETER RetentionDays
    Number of days to retain backup files (optional, default: 30)

.PARAMETER Compress
    Enable backup compression (optional, default: true)

.EXAMPLE
    .\backup-database.ps1 -ServerInstance "localhost" -Database "eqms" -BackupPath "C:\Backups\EQMS"

.EXAMPLE
    .\backup-database.ps1 -ServerInstance "localhost\SQLEXPRESS" -Database "eqms" -BackupPath "C:\Backups\EQMS" -RetentionDays 60
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerInstance,
    
    [Parameter(Mandatory=$true)]
    [string]$Database,
    
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30,
    
    [Parameter(Mandatory=$false)]
    [bool]$Compress = $true,

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

# Validate and create backup directory if it doesn't exist
if (!(Test-Path -Path $BackupPath)) {
    try {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        Write-Host "Created backup directory: $BackupPath" -ForegroundColor Green
    } catch {
        Write-Host "Error: Unable to create backup directory: $BackupPath" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Generate backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "${Database}_backup_${timestamp}.bak"
$backupFullPath = Join-Path -Path $BackupPath -ChildPath $backupFileName

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "E-QMS Database Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server Instance: $ServerInstance"
Write-Host "Database: $Database"
Write-Host "Backup File: $backupFullPath"
Write-Host "Compression: $Compress"
Write-Host "Retention Days: $RetentionDays"
Write-Host "========================================`n" -ForegroundColor Cyan

# Perform the backup
try {
    Write-Host "Starting backup process..." -ForegroundColor Yellow
    
    # Build connection parameters
    $connectionParams = @{
        ServerInstance = $ServerInstance
    }

    if ($Username -and $Password) {
        $connectionParams.Add("Username", $Username)
        $connectionParams.Add("Password", $Password)
    }

    # Build backup query
    $backupQuery = "BACKUP DATABASE [$Database] TO DISK = N'$backupFullPath'"
    
    if ($Compress) {
        $backupQuery += " WITH COMPRESSION, INIT, FORMAT, STATS = 10"
    } else {
        $backupQuery += " WITH INIT, FORMAT, STATS = 10"
    }

    # Execute backup
    Invoke-Sqlcmd @connectionParams -Query $backupQuery -QueryTimeout 0
    
    Write-Host "`nBackup completed successfully!" -ForegroundColor Green
    
    # Get backup file size
    $backupFile = Get-Item $backupFullPath
    $fileSizeMB = [math]::Round($backupFile.Length / 1MB, 2)
    Write-Host "Backup file size: $fileSizeMB MB" -ForegroundColor Green
    Write-Host "Backup location: $backupFullPath" -ForegroundColor Green
    
} catch {
    Write-Host "`nError during backup:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Cleanup old backups based on retention policy
if ($RetentionDays -gt 0) {
    Write-Host "`nCleaning up old backups (retention: $RetentionDays days)..." -ForegroundColor Yellow
    
    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        $oldBackups = Get-ChildItem -Path $BackupPath -Filter "${Database}_backup_*.bak" | 
                      Where-Object { $_.LastWriteTime -lt $cutoffDate }
        
        if ($oldBackups) {
            $oldBackups | ForEach-Object {
                Write-Host "Removing old backup: $($_.Name)" -ForegroundColor Gray
                Remove-Item $_.FullName -Force
            }
            Write-Host "Removed $($oldBackups.Count) old backup(s)" -ForegroundColor Green
        } else {
            Write-Host "No old backups to remove" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Warning: Error during cleanup of old backups" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}

# Display summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Backup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Status: SUCCESS" -ForegroundColor Green
Write-Host "Database: $Database"
Write-Host "Backup File: $backupFileName"
Write-Host "File Size: $fileSizeMB MB"
Write-Host "Location: $backupFullPath"
Write-Host "========================================`n" -ForegroundColor Cyan

# Return backup information as JSON for programmatic use
$backupInfo = @{
    success = $true
    database = $Database
    fileName = $backupFileName
    filePath = $backupFullPath
    fileSizeMB = $fileSizeMB
    timestamp = $timestamp
}

# Output JSON if called from application
if ($env:OUTPUT_JSON -eq "true") {
    $backupInfo | ConvertTo-Json
}

exit 0
