import api from './api';

export interface Attachment {
  id: number;
  fileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  entityType: string;
  entityId: number;
  description?: string;
  category?: string;
  version?: string;
  uploadedBy: number;
  isPublic: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentListResponse {
  data: Attachment[];
  count: number;
}

/**
 * Get attachments for a specific entity
 */
export const getAttachmentsByEntity = async (
  entityType: string,
  entityId: number
): Promise<AttachmentListResponse> => {
  const response = await api.get<AttachmentListResponse>(
    `/attachments/entity/${entityType}/${entityId}`
  );
  return response.data;
};

/**
 * Get attachment by ID
 */
export const getAttachmentById = async (id: number): Promise<Attachment> => {
  const response = await api.get<Attachment>(`/attachments/${id}`);
  return response.data;
};

/**
 * Get download URL for an attachment
 */
export const getAttachmentDownloadUrl = (id: number): string => {
  return `${api.defaults.baseURL}/attachments/${id}/download`;
};

/**
 * Delete an attachment (Admin/Manager only)
 */
export const deleteAttachment = async (id: number): Promise<void> => {
  await api.delete(`/attachments/${id}`);
};

/**
 * Upload attachment to an entity
 */
export const uploadAttachment = async (
  file: File,
  entityType: string,
  entityId: number,
  description?: string,
  category?: string
): Promise<{ message: string; id: number; fileName: string; fileSize: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', entityType);
  formData.append('entityId', entityId.toString());
  
  if (description) {
    formData.append('description', description);
  }
  
  if (category) {
    formData.append('category', category);
  }

  const response = await api.post<{ message: string; id: number; fileName: string; fileSize: number }>(
    '/attachments',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Check if file is an image based on MIME type
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
};

/**
 * Get icon for file type
 */
export const getFileTypeIcon = (mimeType: string, fileExtension: string): string => {
  if (isImageFile(mimeType)) {
    return '🖼️';
  } else if (isPdfFile(mimeType)) {
    return '📄';
  } else if (mimeType.includes('word') || fileExtension === '.doc' || fileExtension === '.docx') {
    return '📝';
  } else if (mimeType.includes('excel') || fileExtension === '.xls' || fileExtension === '.xlsx') {
    return '📊';
  } else if (mimeType.includes('powerpoint') || fileExtension === '.ppt' || fileExtension === '.pptx') {
    return '📽️';
  } else if (mimeType === 'text/plain') {
    return '📃';
  }
  return '📎';
};
