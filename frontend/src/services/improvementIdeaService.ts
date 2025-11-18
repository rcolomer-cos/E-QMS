import api from './api';
import { ImprovementIdea, ImprovementIdeaStatistics } from '../types';

export interface CreateImprovementIdeaData {
  title: string;
  description: string;
  category: string;
  expectedImpact?: string;
  impactArea?: string;
  responsibleUser?: number;
  department?: string;
  estimatedCost?: number;
  estimatedBenefit?: string;
}

export interface UpdateImprovementIdeaData {
  title?: string;
  description?: string;
  category?: string;
  expectedImpact?: string;
  impactArea?: string;
  responsibleUser?: number;
  department?: string;
  reviewComments?: string;
  implementationNotes?: string;
  estimatedCost?: number;
  estimatedBenefit?: string;
}

export interface ImprovementIdeaListResponse {
  data: ImprovementIdea[];
  total: number;
  page: number;
  limit: number;
}

export interface ImprovementIdeaFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  impactArea?: string;
  submittedBy?: number;
  responsibleUser?: number;
  department?: string;
  sortBy?: 'submittedDate' | 'reviewedDate' | 'implementedDate' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Get improvement idea status badge color
 */
export const getStatusColor = (status: ImprovementIdea['status']): string => {
  switch (status) {
    case 'implemented':
      return '#388e3c'; // Green
    case 'in_progress':
      return '#2196f3'; // Blue
    case 'approved':
      return '#4caf50'; // Light Green
    case 'under_review':
      return '#ff9800'; // Orange
    case 'submitted':
      return '#fbc02d'; // Yellow
    case 'rejected':
      return '#f44336'; // Red
    case 'closed':
      return '#757575'; // Grey
    default:
      return '#757575';
  }
};

/**
 * Get status display name
 */
export const getStatusDisplayName = (status: ImprovementIdea['status']): string => {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'in_progress':
      return 'In Progress';
    case 'implemented':
      return 'Implemented';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
};

/**
 * Create a new improvement idea
 */
export const createImprovementIdea = async (data: CreateImprovementIdeaData): Promise<{ id: number; ideaNumber: string }> => {
  const response = await api.post('/api/improvement-ideas', data);
  return response.data;
};

/**
 * Get all improvement ideas with filters
 */
export const getImprovementIdeas = async (filters: ImprovementIdeaFilters = {}): Promise<ImprovementIdeaListResponse> => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.impactArea) params.append('impactArea', filters.impactArea);
  if (filters.submittedBy) params.append('submittedBy', filters.submittedBy.toString());
  if (filters.responsibleUser) params.append('responsibleUser', filters.responsibleUser.toString());
  if (filters.department) params.append('department', filters.department);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await api.get(`/api/improvement-ideas?${params.toString()}`);
  return response.data;
};

/**
 * Get improvement idea by ID
 */
export const getImprovementIdeaById = async (id: number): Promise<ImprovementIdea> => {
  const response = await api.get(`/api/improvement-ideas/${id}`);
  return response.data;
};

/**
 * Update improvement idea
 */
export const updateImprovementIdea = async (id: number, data: UpdateImprovementIdeaData): Promise<ImprovementIdea> => {
  const response = await api.put(`/api/improvement-ideas/${id}`, data);
  return response.data.data;
};

/**
 * Update improvement idea status
 */
export const updateImprovementIdeaStatus = async (
  id: number, 
  status: ImprovementIdea['status'],
  reviewComments?: string
): Promise<ImprovementIdea> => {
  const response = await api.put(`/api/improvement-ideas/${id}/status`, { status, reviewComments });
  return response.data.data;
};

/**
 * Approve improvement idea
 */
export const approveImprovementIdea = async (
  id: number,
  reviewComments?: string,
  responsibleUser?: number,
  implementationNotes?: string
): Promise<ImprovementIdea> => {
  const response = await api.post(`/api/improvement-ideas/${id}/approve`, {
    reviewComments,
    responsibleUser,
    implementationNotes,
  });
  return response.data.data;
};

/**
 * Reject improvement idea
 */
export const rejectImprovementIdea = async (
  id: number,
  reviewComments: string
): Promise<ImprovementIdea> => {
  const response = await api.post(`/api/improvement-ideas/${id}/reject`, {
    reviewComments,
  });
  return response.data.data;
};

/**
 * Delete improvement idea
 */
export const deleteImprovementIdea = async (id: number): Promise<void> => {
  await api.delete(`/api/improvement-ideas/${id}`);
};

/**
 * Get improvement idea statistics
 */
export const getImprovementIdeaStatistics = async (): Promise<ImprovementIdeaStatistics> => {
  const response = await api.get('/api/improvement-ideas/statistics');
  return response.data;
};
