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

// System Settings APIs
export interface SystemSetting {
  id?: number;
  settingKey: string;
  settingValue: string | null;
  settingType: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'notifications' | 'audit' | 'backup' | 'permissions';
  displayName: string;
  description?: string;
  isEditable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SystemSettingsByCategory {
  [category: string]: SystemSetting[];
}

export interface UpdateSettingPayload {
  value: string;
}

export interface BatchUpdateSettingsPayload {
  settings: Array<{ key: string; value: string }>;
}

export const getSystemSettings = async (filters?: {
  category?: string;
  isEditable?: boolean;
}): Promise<SystemSetting[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isEditable !== undefined) params.append('isEditable', String(filters.isEditable));

  const { data } = await api.get<SystemSetting[]>(`/system/settings?${params.toString()}`);
  return data;
};

export const getSystemSettingsByCategory = async (): Promise<SystemSettingsByCategory> => {
  const { data } = await api.get<SystemSettingsByCategory>('/system/settings/by-category');
  return data;
};

export const getSystemSettingByKey = async (key: string): Promise<SystemSetting> => {
  const { data } = await api.get<SystemSetting>(`/system/settings/${key}`);
  return data;
};

export const updateSystemSetting = async (
  key: string,
  payload: UpdateSettingPayload
): Promise<{ message: string; setting: SystemSetting }> => {
  const { data } = await api.put<{ message: string; setting: SystemSetting }>(
    `/system/settings/${key}`,
    payload
  );
  return data;
};

export const batchUpdateSystemSettings = async (
  payload: BatchUpdateSettingsPayload
): Promise<{ message: string; updatedCount: number }> => {
  const { data } = await api.post<{ message: string; updatedCount: number }>(
    '/system/settings/batch',
    payload
  );
  return data;
};
