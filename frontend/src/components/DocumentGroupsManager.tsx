import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  getDocumentGroups,
  getGroups,
  assignGroupsToDocument,
  removeGroupsFromDocument,
  Group,
} from '../services/groupService';
import '../styles/DocumentGroupsManager.css';

interface DocumentGroupsManagerProps {
  documentId: number;
  canEdit?: boolean;
}

const DocumentGroupsManager = ({ documentId, canEdit = false }: DocumentGroupsManagerProps) => {
  const toast = useToast();
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  useEffect(() => {
    loadGroups();
  }, [documentId]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const [assigned, all] = await Promise.all([
        getDocumentGroups(documentId),
        getGroups(false, false),
      ]);
      setAssignedGroups(assigned);
      setAllGroups(all);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load groups';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    const assignedIds = assignedGroups.map((g) => g.id!);
    setSelectedGroupIds(assignedIds);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGroupIds([]);
  };

  const handleToggleGroup = (groupId: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveGroups = async () => {
    try {
      const currentIds = assignedGroups.map((g) => g.id!);
      const toAdd = selectedGroupIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedGroupIds.includes(id));

      if (toAdd.length > 0) {
        await assignGroupsToDocument(documentId, toAdd);
      }
      if (toRemove.length > 0) {
        await removeGroupsFromDocument(documentId, toRemove);
      }

      toast.showUpdateSuccess('Document groups');
      await loadGroups();
      handleCloseModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update document groups';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return <div className="document-groups-loading">Loading groups...</div>;
  }

  return (
    <div className="document-groups-manager">
      <div className="groups-header">
        <h3>Assigned Groups</h3>
        {canEdit && (
          <button className="btn-secondary btn-small" onClick={handleOpenModal}>
            Manage Groups
          </button>
        )}
      </div>

      {assignedGroups.length === 0 ? (
        <p className="no-groups">No groups assigned to this document.</p>
      ) : (
        <div className="assigned-groups-list">
          {assignedGroups.map((group) => (
            <div key={group.id} className="group-tag">
              <span className="group-name">{group.name}</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Document Groups</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Select groups that should have access to this document. Users in these groups will be
                notified when the document is created or updated.
              </p>
              {allGroups.length === 0 ? (
                <p>No groups available.</p>
              ) : (
                <div className="group-selection-list">
                  {allGroups.map((group) => (
                    <div key={group.id} className="group-selection-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id!)}
                          onChange={() => handleToggleGroup(group.id!)}
                        />
                        <span className="group-info">
                          <strong>{group.name}</strong>
                          {group.description && (
                            <span className="group-description">{group.description}</span>
                          )}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveGroups}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGroupsManager;
