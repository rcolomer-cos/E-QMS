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
