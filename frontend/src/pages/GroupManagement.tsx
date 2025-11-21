import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getCurrentUser } from '../services/authService';
import { getGroups, createGroup, updateGroup, deleteGroup, Group } from '../services/groupService';
import { useNavigate } from 'react-router-dom';
import '../styles/GroupManagement.css';

const GroupManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Check user permissions
  const roleNames: string[] = ((currentUser?.roles?.map(r => r.name)) || (currentUser?.role ? [currentUser.role as string] : [])) as string[];
  const normalizeRole = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'administrator' || n.startsWith('admin')) return 'admin';
    if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
    if (n.startsWith('manager')) return 'manager';
    return n;
  };
  const hasRole = (r: string) => roleNames.map(normalizeRole).includes(r.toLowerCase());
  const canEdit = hasRole('admin') || hasRole('manager') || hasRole('superuser');
  const canDelete = hasRole('superuser');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await getGroups(false, true);
      setGroups(data);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load groups';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id!, formData);
        toast.showUpdateSuccess('Group');
      } else {
        await createGroup(formData);
        toast.showCreateSuccess('Group');
      }
      await loadGroups();
      handleCloseModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || `Failed to ${editingGroup ? 'update' : 'create'} group`;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate the group "${groupName}"?`)) {
      return;
    }

    try {
      await deleteGroup(groupId);
      toast.showDeleteSuccess('Group');
      await loadGroups();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete group';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleManageGroup = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading) {
    return <div className="loading">Loading groups...</div>;
  }

  if (error && groups.length === 0) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="group-management">
      <div className="page-header">
        <h1>Group Management</h1>
        {canEdit && (
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            Create Group
          </button>
        )}
      </div>

      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="empty-state">
            <p>No groups found. Create your first group to get started.</p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-card-header">
                  <h3>{group.name}</h3>
                  <span className={`status-badge ${group.active ? 'active' : 'inactive'}`}>
                    {group.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="group-description">{group.description || 'No description'}</p>
                <div className="group-stats">
                  <div className="stat">
                    <span className="stat-label">Users:</span>
                    <span className="stat-value">{group.userCount || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Documents:</span>
                    <span className="stat-value">{group.documentCount || 0}</span>
                  </div>
                </div>
                <div className="group-card-actions">
                  <button className="btn-secondary" onClick={() => handleManageGroup(group.id!)}>
                    Manage
                  </button>
                  {canEdit && (
                    <button className="btn-secondary" onClick={() => handleOpenModal(group)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn-danger" onClick={() => handleDelete(group.id!, group.name)}>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Group Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="Enter group name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                  rows={4}
                  placeholder="Enter group description (optional)"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
