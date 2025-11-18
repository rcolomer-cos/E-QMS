/**
 * Backup Service
 * Handles database backup and restore operations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

export interface BackupConfig {
  serverInstance: string;
  database: string;
  backupPath: string;
  retentionDays?: number;
  compress?: boolean;
  username?: string;
  password?: string;
}

export interface RestoreConfig {
  serverInstance: string;
  database: string;
  backupFile: string;
  dataPath?: string;
  logPath?: string;
  replaceExisting?: boolean;
  verifyOnly?: boolean;
  username?: string;
  password?: string;
}

export interface BackupInfo {
  success: boolean;
  database: string;
  fileName: string;
  filePath: string;
  fileSizeMB: number;
  timestamp: string;
  error?: string;
}

export interface RestoreInfo {
  success: boolean;
  database: string;
  backupFile: string;
  error?: string;
}

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  fileSizeMB: number;
  createdAt: Date;
  age: string;
}

export class BackupService {
  /**
   * Execute database backup using PowerShell script
   */
  static async executeBackup(backupConfig: BackupConfig): Promise<BackupInfo> {
    try {
      // Validate backup path
      if (!fs.existsSync(backupConfig.backupPath)) {
        fs.mkdirSync(backupConfig.backupPath, { recursive: true });
      }

      // Build PowerShell command
      const scriptPath = path.join(__dirname, '../../scripts/backup/backup-database.ps1');
      
      // Check if PowerShell script exists
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Backup script not found. Please ensure backup-database.ps1 exists in scripts/backup/');
      }

      const psCommand = this.buildPowerShellBackupCommand(scriptPath, backupConfig);

      // Execute backup
      const { stdout, stderr } = await execPromise(psCommand, {
        env: { ...process.env, OUTPUT_JSON: 'true' },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.warn('Backup stderr output:', stderr);
      }

      // Try to parse JSON output
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as BackupInfo;
        return { ...result, success: true };
      }

      // Fallback: parse output manually
      return this.parseBackupOutput(stdout, backupConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during backup';
      console.error('Backup error:', error);
      return {
        success: false,
        database: backupConfig.database,
        fileName: '',
        filePath: '',
        fileSizeMB: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  /**
   * Execute database restore using PowerShell script
   */
  static async executeRestore(restoreConfig: RestoreConfig): Promise<RestoreInfo> {
    try {
      // Validate backup file exists
      if (!fs.existsSync(restoreConfig.backupFile)) {
        throw new Error(`Backup file not found: ${restoreConfig.backupFile}`);
      }

      // Build PowerShell command
      const scriptPath = path.join(__dirname, '../../scripts/backup/restore-database.ps1');
      
      // Check if PowerShell script exists
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Restore script not found. Please ensure restore-database.ps1 exists in scripts/backup/');
      }

      const psCommand = this.buildPowerShellRestoreCommand(scriptPath, restoreConfig);

      // Execute restore
      const { stdout, stderr } = await execPromise(psCommand, {
        env: { ...process.env, OUTPUT_JSON: 'true' },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.warn('Restore stderr output:', stderr);
      }

      // Try to parse JSON output
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as RestoreInfo;
        return { ...result, success: true };
      }

      // Fallback: check for success in output
      if (stdout.includes('SUCCESS') || stdout.includes('Restore completed successfully')) {
        return {
          success: true,
          database: restoreConfig.database,
          backupFile: restoreConfig.backupFile,
        };
      }

      throw new Error('Restore did not complete successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during restore';
      console.error('Restore error:', error);
      return {
        success: false,
        database: restoreConfig.database,
        backupFile: restoreConfig.backupFile,
        error: errorMessage,
      };
    }
  }

  /**
   * List available backup files
   */
  static async listBackups(backupPath: string, database: string): Promise<BackupFileInfo[]> {
    try {
      if (!fs.existsSync(backupPath)) {
        return [];
      }

      const files = fs.readdirSync(backupPath);
      const backupFiles = files.filter(
        (file) => file.startsWith(`${database}_backup_`) && file.endsWith('.bak')
      );

      const backupInfos: BackupFileInfo[] = backupFiles.map((fileName) => {
        const filePath = path.join(backupPath, fileName);
        const stats = fs.statSync(filePath);
        const fileSizeMB = Math.round((stats.size / (1024 * 1024)) * 100) / 100;
        const createdAt = stats.birthtime;
        
        // Calculate age
        const ageMs = Date.now() - createdAt.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        let age: string;
        if (ageDays > 0) {
          age = `${ageDays} day${ageDays !== 1 ? 's' : ''} ago`;
        } else if (ageHours > 0) {
          age = `${ageHours} hour${ageHours !== 1 ? 's' : ''} ago`;
        } else {
          age = 'Less than 1 hour ago';
        }

        return {
          fileName,
          filePath,
          fileSizeMB,
          createdAt,
          age,
        };
      });

      // Sort by creation date, newest first
      backupInfos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backupInfos;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  static async deleteBackup(backupPath: string, fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(backupPath, fileName);
      
      // Validate file exists and is a .bak file
      if (!fs.existsSync(filePath) || !fileName.endsWith('.bak')) {
        return false;
      }

      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  /**
   * Get backup configuration from environment
   */
  static getBackupConfig(): BackupConfig {
    return {
      serverInstance: process.env.DB_INSTANCE 
        ? `${process.env.DB_SERVER}\\${process.env.DB_INSTANCE}`
        : process.env.DB_SERVER || 'localhost',
      database: process.env.DB_NAME || 'eqms',
      backupPath: process.env.BACKUP_PATH || path.join(__dirname, '../../backups'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      compress: process.env.BACKUP_COMPRESSION !== 'false',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
  }

  /**
   * Build PowerShell backup command
   */
  private static buildPowerShellBackupCommand(scriptPath: string, config: BackupConfig): string {
    const params = [
      `-ServerInstance "${config.serverInstance}"`,
      `-Database "${config.database}"`,
      `-BackupPath "${config.backupPath}"`,
    ];

    if (config.retentionDays !== undefined) {
      params.push(`-RetentionDays ${config.retentionDays}`);
    }

    if (config.compress !== undefined) {
      params.push(`-Compress $${config.compress}`);
    }

    if (config.username) {
      params.push(`-Username "${config.username}"`);
    }

    if (config.password) {
      params.push(`-Password "${config.password}"`);
    }

    return `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" ${params.join(' ')}`;
  }

  /**
   * Build PowerShell restore command
   */
  private static buildPowerShellRestoreCommand(scriptPath: string, config: RestoreConfig): string {
    const params = [
      `-ServerInstance "${config.serverInstance}"`,
      `-Database "${config.database}"`,
      `-BackupFile "${config.backupFile}"`,
    ];

    if (config.dataPath) {
      params.push(`-DataPath "${config.dataPath}"`);
    }

    if (config.logPath) {
      params.push(`-LogPath "${config.logPath}"`);
    }

    if (config.replaceExisting !== undefined) {
      params.push(`-ReplaceExisting $${config.replaceExisting}`);
    }

    if (config.verifyOnly !== undefined) {
      params.push(`-VerifyOnly $${config.verifyOnly}`);
    }

    if (config.username) {
      params.push(`-Username "${config.username}"`);
    }

    if (config.password) {
      params.push(`-Password "${config.password}"`);
    }

    return `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" ${params.join(' ')}`;
  }

  /**
   * Parse backup output to extract information
   */
  private static parseBackupOutput(output: string, config: BackupConfig): BackupInfo {
    const timestampMatch = output.match(/(\d{8}_\d{6})/);
    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
    
    const sizeMatch = output.match(/(\d+(?:\.\d+)?)\s*MB/i);
    const fileSizeMB = sizeMatch ? parseFloat(sizeMatch[1]) : 0;

    const fileName = `${config.database}_backup_${timestamp}.bak`;
    const filePath = path.join(config.backupPath, fileName);

    return {
      success: output.includes('SUCCESS') || output.includes('Backup completed successfully'),
      database: config.database,
      fileName,
      filePath,
      fileSizeMB,
      timestamp,
    };
  }
}
