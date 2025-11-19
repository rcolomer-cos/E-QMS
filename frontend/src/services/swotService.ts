import api from './api';

export interface SwotEntry {
  id?: number;
  title: string;
  description?: string;
  category: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat';
  owner?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reviewDate?: string;
  nextReviewDate?: string;
  status: 'active' | 'archived' | 'addressed';
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSwotEntryData {
  title: string;
  description?: string;
  category: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat';
  owner?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reviewDate?: string;
  nextReviewDate?: string;
  status?: 'active' | 'archived' | 'addressed';
}

export interface UpdateSwotEntryData {
  title?: string;
  description?: string;
  category?: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat';
  owner?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reviewDate?: string;
  nextReviewDate?: string;
  status?: 'active' | 'archived' | 'addressed';
}

export interface SwotListResponse {
  data: SwotEntry[];
  total: number;
}

export interface SwotStatistics {
  totalEntries: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface SwotFilters {
  category?: string;
  status?: string;
  priority?: string;
  owner?: number;
}

/**
 * Get priority color for UI display
 */
export const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'critical':
      return '#d32f2f'; // Red
    case 'high':
      return '#f57c00'; // Orange
    case 'medium':
      return '#fbc02d'; // Yellow
    case 'low':
      return '#388e3c'; // Green
    default:
      return '#757575'; // Grey
  }
};

/**
 * Get category color for UI display
 */
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Strength':
      return '#388e3c'; // Green
    case 'Weakness':
      return '#d32f2f'; // Red
    case 'Opportunity':
      return '#1976d2'; // Blue
    case 'Threat':
      return '#f57c00'; // Orange
    default:
      return '#757575'; // Grey
  }
};

/**
 * Create a new SWOT entry
 */
export const createSwotEntry = async (data: CreateSwotEntryData): Promise<{ id: number }> => {
  const response = await api.post('/swot', data);
  return response.data;
};

/**
 * Get all SWOT entries with optional filters
 */
export const getSwotEntries = async (filters?: SwotFilters): Promise<SwotListResponse> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.owner) params.append('owner', filters.owner.toString());

  const response = await api.get(`/swot?${params.toString()}`);
  return response.data;
};

/**
 * Get a single SWOT entry by ID
 */
export const getSwotEntryById = async (id: number): Promise<SwotEntry> => {
  const response = await api.get(`/swot/${id}`);
  return response.data;
};

/**
 * Update a SWOT entry
 */
export const updateSwotEntry = async (id: number, data: UpdateSwotEntryData): Promise<void> => {
  await api.put(`/swot/${id}`, data);
};

/**
 * Delete a SWOT entry
 */
export const deleteSwotEntry = async (id: number): Promise<void> => {
  await api.delete(`/swot/${id}`);
};

/**
 * Get SWOT statistics
 */
export const getSwotStatistics = async (): Promise<SwotStatistics> => {
  const response = await api.get('/swot/statistics');
  return response.data;
};
