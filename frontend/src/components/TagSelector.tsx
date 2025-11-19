import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  getTags,
  getDocumentTags,
  assignTagsToDocument,
  removeTagsFromDocument,
  Tag,
} from '../services/tagService';
import '../styles/TagSelector.css';

interface TagSelectorProps {
  documentId: number;
  canEdit?: boolean;
}

const TagSelector = ({ documentId, canEdit = false }: TagSelectorProps) => {
  const toast = useToast();
  const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTags();
  }, [documentId]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const [assigned, all] = await Promise.all([
        getDocumentTags(documentId),
        getTags(),
      ]);
      setAssignedTags(assigned);
      setAllTags(all);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load tags';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    const assignedIds = assignedTags.map((t) => t.id!);
    setSelectedTagIds(assignedIds);
    setShowModal(true);
    setSearchTerm('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTagIds([]);
    setSearchTerm('');
  };

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSaveTags = async () => {
    try {
      const currentIds = assignedTags.map((t) => t.id!);
      const toAdd = selectedTagIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedTagIds.includes(id));

      if (toAdd.length > 0) {
        await assignTagsToDocument(documentId, toAdd);
      }
      if (toRemove.length > 0) {
        await removeTagsFromDocument(documentId, toRemove);
      }

      toast.showUpdateSuccess('Document tags');
      await loadTags();
      handleCloseModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update document tags';
      toast.error(errorMsg);
    }
  };

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="tag-selector-loading">Loading tags...</div>;
  }

  return (
    <div className="tag-selector">
      <div className="tags-header">
        <h3>Tags</h3>
        {canEdit && (
          <button className="btn-secondary btn-small" onClick={handleOpenModal}>
            Manage Tags
          </button>
        )}
      </div>

      {assignedTags.length === 0 ? (
        <p className="no-tags">No tags assigned to this document.</p>
      ) : (
        <div className="assigned-tags-list">
          {assignedTags.map((tag) => (
            <span
              key={tag.id}
              className="tag-badge"
              style={{
                backgroundColor: tag.backgroundColor,
                color: tag.fontColor,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Document Tags</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Select tags to categorize this document. Tags help users find and filter documents.
              </p>

              <div className="tag-search">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredTags.length === 0 ? (
                <p className="no-results">
                  {searchTerm ? 'No tags match your search.' : 'No tags available. Contact an administrator to create tags.'}
                </p>
              ) : (
                <div className="tag-selection-list">
                  {filteredTags.map((tag) => (
                    <div key={tag.id} className="tag-selection-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id!)}
                          onChange={() => handleToggleTag(tag.id!)}
                        />
                        <span
                          className="tag-badge"
                          style={{
                            backgroundColor: tag.backgroundColor,
                            color: tag.fontColor,
                          }}
                        >
                          {tag.name}
                        </span>
                        {tag.description && (
                          <span className="tag-description">{tag.description}</span>
                        )}
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
              <button type="button" className="btn-primary" onClick={handleSaveTags}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
