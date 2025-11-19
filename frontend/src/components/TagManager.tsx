import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getTags, createTag, updateTag, deleteTag, Tag, TagUsage, getTagUsage } from '../services/tagService';
import '../styles/TagManager.css';

const TagManager = () => {
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagUsage, setTagUsage] = useState<TagUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<Partial<Tag>>({
    name: '',
    description: '',
    backgroundColor: '#3B82F6',
    fontColor: '#FFFFFF',
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const [tagsData, usageData] = await Promise.all([getTags(), getTagUsage()]);
      setTags(tagsData);
      setTagUsage(usageData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load tags';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || '',
        backgroundColor: tag.backgroundColor,
        fontColor: tag.fontColor,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        description: '',
        backgroundColor: '#3B82F6',
        fontColor: '#FFFFFF',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      backgroundColor: '#3B82F6',
      fontColor: '#FFFFFF',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      if (editingTag) {
        await updateTag(editingTag.id!, formData);
        toast.showUpdateSuccess('Tag');
      } else {
        await createTag(formData);
        toast.showCreateSuccess('Tag');
      }
      await loadTags();
      handleCloseModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to save tag';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (tag: Tag) => {
    const usage = tagUsage.find((u) => u.tagId === tag.id);
    const documentCount = usage?.documentCount || 0;

    const confirmMsg = documentCount > 0
      ? `Are you sure you want to delete tag "${tag.name}"? This tag is assigned to ${documentCount} document(s).`
      : `Are you sure you want to delete tag "${tag.name}"?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await deleteTag(tag.id!);
      toast.showDeleteSuccess('Tag');
      await loadTags();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete tag';
      toast.error(errorMsg);
    }
  };

  const getUsageCount = (tagId: number): number => {
    const usage = tagUsage.find((u) => u.tagId === tagId);
    return usage?.documentCount || 0;
  };

  if (loading) {
    return <div className="tag-manager-loading">Loading tags...</div>;
  }

  return (
    <div className="tag-manager">
      <div className="tag-manager-header">
        <h2>Document Tags</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          Create Tag
        </button>
      </div>

      <div className="tags-list">
        {tags.length === 0 ? (
          <p className="no-tags">No tags created yet. Create your first tag to get started.</p>
        ) : (
          <table className="tags-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Description</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <span
                      className="tag-badge"
                      style={{
                        backgroundColor: tag.backgroundColor,
                        color: tag.fontColor,
                      }}
                    >
                      {tag.name}
                    </span>
                  </td>
                  <td>{tag.description || '-'}</td>
                  <td>{getUsageCount(tag.id!)}</td>
                  <td className="actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleOpenModal(tag)}
                      title="Edit tag"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(tag)}
                      title="Delete tag"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name">
                    Tag Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="backgroundColor">Background Color</label>
                    <div className="color-picker-wrapper">
                      <input
                        type="color"
                        id="backgroundColor"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={handleChange}
                        name="backgroundColor"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fontColor">Font Color</label>
                    <div className="color-picker-wrapper">
                      <input
                        type="color"
                        id="fontColor"
                        name="fontColor"
                        value={formData.fontColor}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        value={formData.fontColor}
                        onChange={handleChange}
                        name="fontColor"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                <div className="tag-preview">
                  <label>Preview:</label>
                  <span
                    className="tag-badge"
                    style={{
                      backgroundColor: formData.backgroundColor,
                      color: formData.fontColor,
                    }}
                  >
                    {formData.name || 'Sample Tag'}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
