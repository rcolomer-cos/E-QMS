import api from './api';

export interface ImplementationTask {
  id?: number;
  improvementIdeaId: number;
  taskName: string;
  taskDescription?: string;
  assignedTo?: number;
  deadline?: string;
  startedDate?: string;
  completedDate?: string;
  status: string;
  progressPercentage: number;
  completionEvidence?: string;
  createdAt?: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
  assignedToFirstName?: string;
  assignedToLastName?: string;
  assignedToEmail?: string;
  createdByFirstName?: string;
  createdByLastName?: string;
  createdByEmail?: string;
}

export interface ImplementationTaskStatistics {
  totalTasks: number;
  pending: number;
  inProgress: number;
  completed: number;
  blocked: number;
  cancelled: number;
  avgProgress: number;
  overdueTasks: number;
}

class ImplementationTaskService {
  /**
   * Create a new implementation task
   */
  async createTask(task: Partial<ImplementationTask>): Promise<ImplementationTask> {
    const response = await api.post('/implementation-tasks', task);
    return response.data;
  }

  /**
   * Get all implementation tasks with optional filters
   */
  async getTasks(filters?: {
    improvementIdeaId?: number;
    status?: string;
    assignedTo?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: ImplementationTask[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (filters?.improvementIdeaId) params.append('improvementIdeaId', filters.improvementIdeaId.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/implementation-tasks?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a single implementation task by ID
   */
  async getTaskById(id: number): Promise<ImplementationTask> {
    const response = await api.get(`/implementation-tasks/${id}`);
    return response.data;
  }

  /**
   * Get all tasks for a specific improvement idea
   */
  async getTasksByImprovementIdeaId(improvementIdeaId: number): Promise<ImplementationTask[]> {
    const response = await api.get(`/implementation-tasks/idea/${improvementIdeaId}`);
    return response.data;
  }

  /**
   * Update an implementation task
   */
  async updateTask(id: number, updates: Partial<ImplementationTask>): Promise<ImplementationTask> {
    const response = await api.put(`/implementation-tasks/${id}`, updates);
    return response.data;
  }

  /**
   * Mark task as completed
   */
  async completeTask(id: number, completionEvidence?: string): Promise<ImplementationTask> {
    const response = await api.post(`/implementation-tasks/${id}/complete`, { completionEvidence });
    return response.data;
  }

  /**
   * Delete an implementation task
   */
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/implementation-tasks/${id}`);
  }

  /**
   * Get task statistics for an improvement idea
   */
  async getTaskStatistics(improvementIdeaId: number): Promise<ImplementationTaskStatistics> {
    const response = await api.get(`/implementation-tasks/idea/${improvementIdeaId}/statistics`);
    return response.data;
  }
}

export default new ImplementationTaskService();
