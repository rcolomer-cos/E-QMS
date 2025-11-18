import api from './api';

export interface InitStatus {
  needsSetup: boolean;
  hasDatabase: boolean;
  hasSuperUser: boolean;
  databaseReady?: boolean;
  missingTables?: string[];
}

export interface CreateSuperUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  fileSizeMB: number;
  createdAt: string;
  age: string;
}

export interface RestoreBackupPayload {
  backupFile: string;
  replaceExisting?: boolean;
}

export interface VerifyBackupPayload {
  backupFile: string;
}

export interface DeleteBackupPayload {
  fileName: string;
}

export const getInitStatus = async (): Promise<InitStatus> => {
  const { data } = await api.get<InitStatus>('/system/init-status');
  return data;
};

export const createFirstSuperuser = async (
  payload: CreateSuperUserPayload
): Promise<{ message: string; userId: number }> => {
  const { data } = await api.post<{ message: string; userId: number }>(
    '/system/init',
    payload
  );
  return data;
};

// Backup/Restore APIs
export const createBackup = async (): Promise<{ message: string; backup: BackupInfo }> => {
  const { data } = await api.post<{ message: string; backup: BackupInfo }>('/system/backup');
  return data;
};

export const listBackups = async (): Promise<{ backups: BackupFileInfo[]; backupPath: string }> => {
  const { data } = await api.get<{ backups: BackupFileInfo[]; backupPath: string }>('/system/backups');
  return data;
};

export const restoreBackup = async (
  payload: RestoreBackupPayload
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/system/backup/restore', payload);
  return data;
};

export const verifyBackup = async (
  payload: VerifyBackupPayload
): Promise<{ message: string; verified: boolean }> => {
  const { data } = await api.post<{ message: string; verified: boolean }>(
    '/system/backup/verify',
    payload
  );
  return data;
};

export const deleteBackup = async (payload: DeleteBackupPayload): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>('/system/backup', { data: payload });
  return data;
};
