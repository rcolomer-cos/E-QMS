import api from './api';
import axios from 'axios';

export type ImportTemplateType = 'users' | 'equipment' | 'training' | 'suppliers' | 'documents';

export interface ImportTemplate {
  type: ImportTemplateType;
  name: string;
  description: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  error: string;
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  hasErrors: boolean;
  rows: ImportPreviewRow[];
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: ImportError[];
}

export interface ImportLog {
  id: number;
  importType: string;
  fileName: string;
  fileSize?: number;
  status: 'in_progress' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  successRows: number;
  failedRows: number;
  errorDetails?: string;
  importedBy: number;
  startedAt: string;
  completedAt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ImportHistoryResponse {
  logs: ImportLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get list of available import templates
 */
export const getAvailableTemplates = async (): Promise<ImportTemplate[]> => {
  const response = await api.get('/imports/templates');
  return response.data;
};

/**
 * Download Excel template for a specific type
 */
export const downloadTemplate = async (type: ImportTemplateType): Promise<void> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const response = await axios.get(`/api/imports/templates/${type}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });

  // Create a download link and trigger download
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}_import_template.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Upload and preview Excel file
 */
export const uploadAndPreview = async (
  file: File,
  type: ImportTemplateType
): Promise<{
  success: boolean;
  fileName: string;
  fileSize: number;
  tempFilePath: string;
  preview: ImportPreview;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post('/imports/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Execute import after preview
 */
export const executeImport = async (data: {
  type: ImportTemplateType;
  tempFilePath: string;
  fileName: string;
  fileSize: number;
}): Promise<{
  success: boolean;
  importLogId: number;
  result: ImportResult;
}> => {
  const response = await api.post('/imports/execute', data);
  return response.data;
};

/**
 * Get import history with pagination and filters
 */
export const getImportHistory = async (params?: {
  importType?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ImportHistoryResponse> => {
  const response = await api.get('/imports/history', { params });
  return response.data;
};

/**
 * Get import log details by ID
 */
export const getImportLogDetails = async (id: number): Promise<ImportLog> => {
  const response = await api.get(`/imports/history/${id}`);
  return response.data;
};
