import api from './api';
import { Document, PendingDocument, DocumentRevision } from '../types';

export interface DocumentFilters {
  status?: string;
  category?: string;
  documentType?: string;
  search?: string;
}

export const getDocuments = async (filters?: DocumentFilters): Promise<Document[]> => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.documentType) params.append('documentType', filters.documentType);
  
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
