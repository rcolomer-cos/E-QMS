import api from './api';

export interface Tag {
  id?: number;
  name: string;
  description?: string;
  backgroundColor: string;
  fontColor: string;
  createdBy?: number;
  createdAt?: string;
  updatedBy?: number;
  updatedAt?: string;
}

export interface TagUsage {
  tagId: number;
  tagName: string;
  documentCount: number;
}

/**
 * Get all tags
 */
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags');
  return response.data;
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: number): Promise<Tag> => {
  const response = await api.get(`/tags/${id}`);
  return response.data;
};

/**
 * Create a new tag (admin only)
 */
export const createTag = async (tag: Partial<Tag>): Promise<{ tagId: number }> => {
  const response = await api.post('/tags', tag);
  return response.data;
};

/**
 * Update a tag (admin only)
 */
export const updateTag = async (id: number, updates: Partial<Tag>): Promise<void> => {
  await api.put(`/tags/${id}`, updates);
};

/**
 * Delete a tag (admin only)
 */
export const deleteTag = async (id: number): Promise<void> => {
  await api.delete(`/tags/${id}`);
};

/**
 * Get tag usage statistics
 */
export const getTagUsage = async (): Promise<TagUsage[]> => {
  const response = await api.get('/tags/usage');
  return response.data;
};

/**
 * Get tags assigned to a document
 */
export const getDocumentTags = async (documentId: number): Promise<Tag[]> => {
  const response = await api.get(`/documents/${documentId}/tags`);
  return response.data;
};

/**
 * Assign tags to a document
 */
export const assignTagsToDocument = async (documentId: number, tagIds: number[]): Promise<void> => {
  await api.post(`/documents/${documentId}/tags`, { tagIds });
};

/**
 * Remove tags from a document
 */
export const removeTagsFromDocument = async (documentId: number, tagIds: number[]): Promise<void> => {
  await api.delete(`/documents/${documentId}/tags`, { data: { tagIds } });
};
