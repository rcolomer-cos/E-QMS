import api from './api';

/**
 * Get organizational hierarchy with departments, processes, and user assignments
 * Uses shared api instance so dev proxy (/api -> backend) is respected.
 */
export const getOrganizationalHierarchy = async () => {
  const response = await api.get('/departments/hierarchy/full');
  return response.data;
};

/**
 * Diagnostic helper to verify departments base route
 */
export const pingDepartmentsBase = async () => {
  try {
    const response = await api.get('/departments');
    return { ok: true, count: Array.isArray(response.data) ? response.data.length : 0 };
  } catch (e: any) {
    return { ok: false, status: e.response?.status, error: e.response?.data?.error || e.message };
  }
};
