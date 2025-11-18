import api from './api';

export interface EmailTemplate {
  id?: number;
  name: string;
  displayName: string;
  type: string;
  category: string;
  subject: string;
  body: string;
  description?: string;
  placeholders?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateEmailTemplateData {
  name: string;
  displayName: string;
  type: string;
  category: string;
  subject: string;
  body: string;
  description?: string;
  placeholders?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface UpdateEmailTemplateData {
  name?: string;
  displayName?: string;
  type?: string;
  category?: string;
  subject?: string;
  body?: string;
  description?: string;
  placeholders?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface EmailTemplateFilters {
  type?: string;
  category?: string;
  isActive?: boolean;
}

/**
 * Get all email templates with optional filtering
 */
export const getEmailTemplates = async (filters?: EmailTemplateFilters): Promise<EmailTemplate[]> => {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const response = await api.get<EmailTemplate[]>(`/email-templates?${params.toString()}`);
  return response.data;
};

/**
 * Get email template by ID
 */
export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  const response = await api.get<EmailTemplate>(`/email-templates/${id}`);
  return response.data;
};

/**
 * Get email templates by type
 */
export const getEmailTemplatesByType = async (type: string, activeOnly = true): Promise<EmailTemplate[]> => {
  const params = new URLSearchParams();
  if (!activeOnly) params.append('activeOnly', 'false');

  const response = await api.get<EmailTemplate[]>(`/email-templates/by-type/${type}?${params.toString()}`);
  return response.data;
};

/**
 * Get default email template by type
 */
export const getDefaultEmailTemplate = async (type: string): Promise<EmailTemplate> => {
  const response = await api.get<EmailTemplate>(`/email-templates/default/${type}`);
  return response.data;
};

/**
 * Create a new email template
 */
export const createEmailTemplate = async (data: CreateEmailTemplateData): Promise<{ message: string; id: number }> => {
  const response = await api.post<{ message: string; id: number }>('/email-templates', data);
  return response.data;
};

/**
 * Update an existing email template
 */
export const updateEmailTemplate = async (id: number, data: UpdateEmailTemplateData): Promise<void> => {
  await api.put(`/email-templates/${id}`, data);
};

/**
 * Delete an email template (Admin only)
 */
export const deleteEmailTemplate = async (id: number): Promise<void> => {
  await api.delete(`/email-templates/${id}`);
};

/**
 * Get template types
 */
export const getTemplateTypes = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/email-templates/types');
  return response.data;
};

/**
 * Get template categories
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/email-templates/categories');
  return response.data;
};
