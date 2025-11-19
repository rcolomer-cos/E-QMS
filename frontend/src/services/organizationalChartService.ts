import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Get organizational hierarchy with departments, processes, and user assignments
 */
export const getOrganizationalHierarchy = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/departments/hierarchy/full`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
