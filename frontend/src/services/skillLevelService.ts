import api from './api';

export interface SkillLevel {
  id?: number;
  level: number;
  name: string;
  shortName?: string;
  description: string;
  knowledgeCriteria?: string;
  skillsCriteria?: string;
  experienceCriteria?: string;
  autonomyCriteria?: string;
  complexityCriteria?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
  exampleBehaviors?: string;
  assessmentGuidance?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
}

export interface SkillLevelSummary {
  level: number;
  name: string;
  shortName: string;
  color: string;
  icon: string;
}

/**
 * Get all skill levels
 */
export const getSkillLevels = async (): Promise<{ skillLevels: SkillLevel[] }> => {
  const response = await api.get('/skill-levels');
  return response.data;
};

/**
 * Get skill level summary (quick reference)
 */
export const getSkillLevelSummary = async (): Promise<SkillLevelSummary[]> => {
  const response = await api.get('/skill-levels/summary');
  return response.data;
};

/**
 * Get a single skill level by ID
 */
export const getSkillLevelById = async (id: number): Promise<SkillLevel> => {
  const response = await api.get(`/skill-levels/${id}`);
  return response.data;
};

/**
 * Get skill level by level number (1-5)
 */
export const getSkillLevelByLevel = async (level: number): Promise<SkillLevel> => {
  const response = await api.get(`/skill-levels/level/${level}`);
  return response.data;
};

/**
 * Create a new skill level
 */
export const createSkillLevel = async (skillLevel: Omit<SkillLevel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<SkillLevel> => {
  const response = await api.post('/skill-levels', skillLevel);
  return response.data;
};

/**
 * Update an existing skill level
 */
export const updateSkillLevel = async (id: number, skillLevel: Partial<SkillLevel>): Promise<SkillLevel> => {
  const response = await api.put(`/skill-levels/${id}`, skillLevel);
  return response.data;
};

/**
 * Delete a skill level (soft delete)
 */
export const deleteSkillLevel = async (id: number): Promise<void> => {
  await api.delete(`/skill-levels/${id}`);
};
