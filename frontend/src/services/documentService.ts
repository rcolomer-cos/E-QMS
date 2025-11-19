import api from './api';
import { Document, PendingDocument, DocumentRevision } from '../types';

export interface DocumentFilters {
  status?: string;
  category?: string;
  documentType?: string;
  search?: string;
  processId?: number;
  includeSubProcesses?: boolean;
  tagIds?: number[];
}

export const getDocuments = async (filters?: DocumentFilters): Promise<Document[]> => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.documentType) params.append('documentType', filters.documentType);
  if (filters?.processId) params.append('processId', String(filters.processId));
  if (filters?.includeSubProcesses) params.append('includeSubProcesses', 'true');
  if (filters?.tagIds && filters.tagIds.length > 0) {
    params.append('tagIds', filters.tagIds.join(','));
  }
  
  const response = await api.get(`/documents?${params.toString()}`);
  return response.data;
};

export const getDocumentById = async (id: number): Promise<Document> => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const getDocumentVersionHistory = async (id: number): Promise<Document[]> => {
  const response = await api.get(`/documents/${id}/versions`);
  return response.data;
};

export const createDocument = async (document: Partial<Document>): Promise<{ documentId: number }> => {
  const response = await api.post('/documents', document);
  return response.data;
};

export const updateDocument = async (id: number, updates: Partial<Document>): Promise<void> => {
  await api.put(`/documents/${id}`, updates);
};

export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const createDocumentVersion = async (id: number): Promise<{ documentId: number }> => {
  const response = await api.post(`/documents/${id}/version`);
  return response.data;
};

export const uploadDocumentFile = async (id: number, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  
  await api.post(`/documents/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadDocumentFile = async (id: number, fileName: string): Promise<void> => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  
  // Create a download link and trigger it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getPendingDocuments = async (): Promise<PendingDocument[]> => {
  const response = await api.get('/documents/pending');
  return response.data;
};

export const approveDocument = async (id: number, comments?: string): Promise<void> => {
  await api.post(`/documents/${id}/approve`, { comments });
};

export const rejectDocument = async (id: number, reason: string): Promise<void> => {
  await api.post(`/documents/${id}/reject`, { reason });
};

export const requestChanges = async (id: number, changes: string): Promise<void> => {
  await api.post(`/documents/${id}/request-changes`, { changes });
};

export const getDocumentRevisionHistory = async (id: number): Promise<DocumentRevision[]> => {
  const response = await api.get(`/documents/${id}/revisions`);
  return response.data;
};

export const createDocumentRevision = async (
  id: number,
  revision: {
    changeType: string;
    changeDescription?: string;
    changeReason?: string;
    statusBefore?: string;
    statusAfter?: string;
  }
): Promise<{ revisionId: number }> => {
  const response = await api.post(`/documents/${id}/revisions`, revision);
  return response.data;
};

export interface DocumentContentPayload {
  content: string;
  contentFormat: 'html' | 'prosemirror';
}

export const getDocumentContent = async (id: number): Promise<DocumentContentPayload & { documentId: number } > => {
  const response = await api.get(`/documents/${id}/content`);
  return response.data;
};

export const saveDocumentContent = async (id: number, payload: DocumentContentPayload): Promise<void> => {
  await api.put(`/documents/${id}/content`, payload);
};

export const uploadContentImage = async (id: number, file: File): Promise<{ url: string } > => {
  const formData = new FormData();
  formData.append('file', file);
  // Optionally hint server foldering
  formData.append('entityType', 'general');
  const response = await api.post(`/documents/${id}/content-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const exportDocumentPdf = async (id: number): Promise<Blob> => {
  const response = await api.post(`/documents/${id}/export-pdf`, {}, { responseType: 'blob' });
  return response.data;
};

export const getDocumentProcesses = async (id: number): Promise<any[]> => {
  const response = await api.get(`/documents/${id}/processes`);
  return response.data;
};

export interface RecentDocument extends Document {
  creatorFirstName?: string;
  creatorLastName?: string;
  creatorEmail?: string;
  lastModified: string;
}

export const getRecentDocuments = async (limit: number = 10): Promise<RecentDocument[]> => {
  const response = await api.get(`/documents/recent?limit=${limit}`);
  return response.data;
};

// Compliance Acknowledgement Functions

export interface ComplianceStatus {
  documentId: number;
  userId: number;
  isCompliant: boolean;
  currentVersion: string;
  acknowledgedVersion?: string;
  acknowledgedAt?: Date;
  requiresAcknowledgement: boolean;
}

export interface ComplianceReport {
  documentId: number;
  title: string;
  version: string;
  complianceRequired: boolean;
  totalUsersRequired: number;
  acknowledgedCount: number;
  pendingCount: number;
  acknowledgedUsers: Array<{
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    acknowledgedAt: Date;
  }>;
  pendingUsers: Array<{
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export interface ComplianceDocument extends Document {
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
}

export const acknowledgeDocument = async (documentId: number): Promise<void> => {
  await api.post(`/documents/compliance/${documentId}/acknowledge`);
};

export const getComplianceStatus = async (documentId: number): Promise<ComplianceStatus> => {
  const response = await api.get(`/documents/compliance/${documentId}/status`);
  return response.data;
};

export const getDocumentComplianceReport = async (documentId: number): Promise<ComplianceReport> => {
  const response = await api.get(`/documents/compliance/${documentId}/report`);
  return response.data;
};

export const getPendingComplianceDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/documents/compliance/pending');
  return response.data;
};

export const getComplianceDocuments = async (): Promise<ComplianceDocument[]> => {
  const response = await api.get('/documents/compliance/all');
  return response.data;
};

export const toggleComplianceRequired = async (
  documentId: number,
  complianceRequired: boolean
): Promise<void> => {
  await api.put(`/documents/compliance/${documentId}/toggle`, { complianceRequired });
};
