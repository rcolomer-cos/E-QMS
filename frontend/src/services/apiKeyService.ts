import api from './api';

export interface ApiKey {
  id: number;
  name: string;
  keyPreview: string;
  description?: string;
  expiresAt?: string;
  scopes?: string[];
  allowedIPs?: string[];
  active: boolean;
  revokedAt?: string;
  revokedBy?: number;
  revocationReason?: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  usageCount: number;
  createdAt: string;
  createdBy: number;
  creatorEmail?: string;
  creatorName?: string;
  updatedAt: string;
}

export interface CreateApiKeyData {
  name: string;
  description?: string;
  expiresAt?: string;
  scopes?: string[];
  allowedIPs?: string[];
}

export interface CreateApiKeyResponse {
  message: string;
  apiKey: ApiKey;
  rawKey: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string;
  expiresAt?: string | null;
  scopes?: string[];
  allowedIPs?: string[];
}

/**
 * Get all API keys
 */
export const getAllApiKeys = async (): Promise<ApiKey[]> => {
  const response = await api.get<ApiKey[]>('/api-keys');
  return response.data;
};

/**
 * Get an API key by ID
 */
export const getApiKeyById = async (id: number): Promise<ApiKey> => {
  const response = await api.get<ApiKey>(`/api-keys/${id}`);
  return response.data;
};

/**
 * Create a new API key
 */
export const createApiKey = async (data: CreateApiKeyData): Promise<CreateApiKeyResponse> => {
  const response = await api.post<CreateApiKeyResponse>('/api-keys', data);
  return response.data;
};

/**
 * Update an API key
 */
export const updateApiKey = async (id: number, data: UpdateApiKeyData): Promise<void> => {
  await api.put(`/api-keys/${id}`, data);
};

/**
 * Revoke an API key
 */
export const revokeApiKey = async (id: number, reason?: string): Promise<void> => {
  await api.post(`/api-keys/${id}/revoke`, { reason });
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (id: number): Promise<void> => {
  await api.delete(`/api-keys/${id}`);
};
