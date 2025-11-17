import api from './api';

export interface AuditorAccessToken {
  id: number;
  tokenPreview: string;
  auditorName: string;
  auditorEmail: string;
  auditorOrganization?: string;
  expiresAt: string;
  maxUses?: number;
  currentUses: number;
  scopeType: 'full_read_only' | 'specific_audit' | 'specific_document' | 'specific_ncr' | 'specific_capa';
  scopeEntityId?: number;
  allowedResources?: string[];
  active: boolean;
  revokedAt?: string;
  revokedBy?: number;
  revocationReason?: string;
  purpose: string;
  notes?: string;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
}

export interface CreateAuditorAccessTokenRequest {
  auditorName: string;
  auditorEmail: string;
  auditorOrganization?: string;
  expiresAt: string;
  scopeType: 'full_read_only' | 'specific_audit' | 'specific_document' | 'specific_ncr' | 'specific_capa';
  scopeEntityId?: number;
  allowedResources?: string[];
  purpose: string;
  notes?: string;
  maxUses?: number;
}

export interface CreateAuditorAccessTokenResponse {
  message: string;
  tokenId: number;
  token: string;
  expiresAt: string;
  accessUrl?: string;
  warning: string;
}

export interface AuditorAccessTokenOptions {
  scopeTypes: string[];
  resourceTypes: string[];
  defaultExpirationDays: number;
}

export interface RevokeTokenRequest {
  reason: string;
}

/**
 * Generate a new auditor access token
 */
export const createAuditorAccessToken = async (
  data: CreateAuditorAccessTokenRequest
): Promise<CreateAuditorAccessTokenResponse> => {
  const response = await api.post('/auditor-access-tokens', data);
  return response.data;
};

/**
 * Get list of auditor access tokens
 */
export const getAuditorAccessTokens = async (params?: {
  activeOnly?: boolean;
  auditorEmail?: string;
  scopeType?: string;
}): Promise<AuditorAccessToken[]> => {
  const response = await api.get('/auditor-access-tokens', { params });
  return response.data;
};

/**
 * Get a specific auditor access token by ID
 */
export const getAuditorAccessTokenById = async (id: number): Promise<AuditorAccessToken> => {
  const response = await api.get(`/auditor-access-tokens/${id}`);
  return response.data;
};

/**
 * Revoke an auditor access token
 */
export const revokeAuditorAccessToken = async (
  id: number,
  data: RevokeTokenRequest
): Promise<void> => {
  await api.put(`/auditor-access-tokens/${id}/revoke`, data);
};

/**
 * Get available options for token creation
 */
export const getAuditorAccessTokenOptions = async (): Promise<AuditorAccessTokenOptions> => {
  const response = await api.get('/auditor-access-tokens/options');
  return response.data;
};

/**
 * Clean up expired tokens (admin only)
 */
export const cleanupExpiredTokens = async (): Promise<{ cleaned: number }> => {
  const response = await api.post('/auditor-access-tokens/cleanup');
  return response.data;
};
