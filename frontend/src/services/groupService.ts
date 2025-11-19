import api from './api';

export interface Group {
  id?: number;
  name: string;
  description?: string;
  active?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  documentCount?: number;
}

export interface GroupUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  active: boolean;
  addedAt: string;
  addedByFirstName?: string;
  addedByLastName?: string;
}

export interface GroupDocument {
  id: number;
  title: string;
  documentType: string;
  category: string;
  version: string;
  status: string;
  assignedAt: string;
  assignedByFirstName?: string;
  assignedByLastName?: string;
}

/**
 * Get all groups
 */
export const getGroups = async (includeInactive = false, withCounts = true): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups', {
    params: { includeInactive, withCounts },
  });
  return response.data;
};

/**
 * Get group by ID
 */
export const getGroupById = async (id: number): Promise<Group> => {
  const response = await api.get<Group>(`/groups/${id}`);
  return response.data;
};

/**
 * Create a new group
 */
export const createGroup = async (group: Omit<Group, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<{ groupId: number }> => {
  const response = await api.post('/groups', group);
  return response.data;
};

/**
 * Update a group
 */
export const updateGroup = async (id: number, updates: Partial<Group>): Promise<void> => {
  await api.put(`/groups/${id}`, updates);
};

/**
 * Delete (deactivate) a group
 */
export const deleteGroup = async (id: number): Promise<void> => {
  await api.delete(`/groups/${id}`);
};

/**
 * Get users in a group
 */
export const getGroupUsers = async (groupId: number): Promise<GroupUser[]> => {
  const response = await api.get<GroupUser[]>(`/groups/${groupId}/users`);
  return response.data;
};

/**
 * Add users to a group
 */
export const addUsersToGroup = async (groupId: number, userIds: number[]): Promise<void> => {
  await api.post(`/groups/${groupId}/users`, { userIds });
};

/**
 * Remove users from a group
 */
export const removeUsersFromGroup = async (groupId: number, userIds: number[]): Promise<void> => {
  await api.delete(`/groups/${groupId}/users`, { data: { userIds } });
};

/**
 * Get documents assigned to a group
 */
export const getGroupDocuments = async (groupId: number): Promise<GroupDocument[]> => {
  const response = await api.get<GroupDocument[]>(`/groups/${groupId}/documents`);
  return response.data;
};

/**
 * Get groups for a specific user
 */
export const getUserGroups = async (userId: number): Promise<Group[]> => {
  const response = await api.get<Group[]>(`/groups/user/${userId}`);
  return response.data;
};

/**
 * Get groups assigned to a document
 */
export const getDocumentGroups = async (documentId: number): Promise<Group[]> => {
  const response = await api.get<Group[]>(`/documents/${documentId}/groups`);
  return response.data;
};

/**
 * Assign groups to a document
 */
export const assignGroupsToDocument = async (documentId: number, groupIds: number[]): Promise<void> => {
  await api.post(`/documents/${documentId}/groups`, { groupIds });
};

/**
 * Remove groups from a document
 */
export const removeGroupsFromDocument = async (documentId: number, groupIds: number[]): Promise<void> => {
  await api.delete(`/documents/${documentId}/groups`, { data: { groupIds } });
};
