import { useState, useEffect } from 'react';
import { getTags, Tag } from '../services/tagService';
import '../styles/TagFilter.css';

interface TagFilterProps {
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
}

const TagFilter = ({ selectedTagIds, onTagsChange }: TagFilterProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tagId: number) => {
    const newSelectedIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onTagsChange(newSelectedIds);
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  if (loading) {
    return <div className="tag-filter-loading">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return null;
  }

  const visibleTags = expanded ? tags : tags.slice(0, 6);
  const hasMore = tags.length > 6;

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <h4>Filter by Tags</h4>
        {selectedTagIds.length > 0 && (
          <button className="btn-link btn-small" onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      <div className="tag-filter-list">
        {visibleTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id!);
          return (
            <button
              key={tag.id}
              className={`tag-filter-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggleTag(tag.id!)}
              style={{
                backgroundColor: isSelected ? tag.backgroundColor : '#f3f4f6',
                color: isSelected ? tag.fontColor : '#374151',
                border: `1px solid ${isSelected ? tag.backgroundColor : '#d1d5db'}`,
              }}
            >
              {tag.name}
              {isSelected && <span className="check-icon">✓</span>}
            </button>
          );
        })}
      </div>

      {hasMore && (
        <button
          className="btn-link btn-small expand-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : `Show ${tags.length - 6} More`}
        </button>
      )}
    </div>
  );
};

export default TagFilter;
