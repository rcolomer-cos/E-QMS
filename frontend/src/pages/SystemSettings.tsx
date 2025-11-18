import { useState, useEffect } from 'react';
import {
  getSystemSettingsByCategory,
  batchUpdateSystemSettings,
  SystemSetting,
  SystemSettingsByCategory,
} from '../services/systemService';
import '../styles/SystemSettings.css';

interface SettingFormState {
  [key: string]: string;
}

const SystemSettings = () => {
  const [settingsByCategory, setSettingsByCategory] = useState<SystemSettingsByCategory>({});
  const [formState, setFormState] = useState<SettingFormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('general');

  const categoryLabels: Record<string, string> = {
    general: 'General Settings',
    notifications: 'Notification Settings',
    audit: 'Audit Configuration',
    backup: 'Backup Configuration',
    permissions: 'Default Permissions',
  };

  const categoryDescriptions: Record<string, string> = {
    general: 'Configure basic system information and display settings',
    notifications: 'Set reminder intervals for various system notifications',
    audit: 'Configure audit logging and retention policies',
    backup: 'Manage backup retention and automation settings',
    permissions: 'Set default permissions and access control settings',
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSystemSettingsByCategory();
      setSettingsByCategory(data);

      // Initialize form state with current values
      const initialFormState: SettingFormState = {};
      Object.values(data).flat().forEach((setting: SystemSetting) => {
        initialFormState[setting.settingKey] = setting.settingValue || '';
      });
      setFormState(initialFormState);
    } catch (err: any) {
      console.error('Error loading system settings:', err);
      setError(err.response?.data?.error || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear success message when user starts editing
    if (success) setSuccess('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Build the update payload - only include changed values
      const updates: Array<{ key: string; value: string }> = [];
      Object.values(settingsByCategory).flat().forEach((setting: SystemSetting) => {
        const currentValue = formState[setting.settingKey];
        if (currentValue !== setting.settingValue && setting.isEditable) {
          updates.push({
            key: setting.settingKey,
            value: currentValue,
          });
        }
      });

      if (updates.length === 0) {
        setSuccess('No changes to save');
        return;
      }

      const result = await batchUpdateSystemSettings({ settings: updates });
      setSuccess(result.message);

      // Reload settings to get fresh data
      await loadSettings();
    } catch (err: any) {
      console.error('Error saving system settings:', err);
      setError(err.response?.data?.error || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form to current saved values
    const resetFormState: SettingFormState = {};
    Object.values(settingsByCategory).flat().forEach((setting: SystemSetting) => {
      resetFormState[setting.settingKey] = setting.settingValue || '';
    });
    setFormState(resetFormState);
    setSuccess('');
    setError('');
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = formState[setting.settingKey] || '';

    if (!setting.isEditable) {
      return (
        <input
          type="text"
          value={value}
          disabled
          className="setting-input readonly"
          title="This setting is read-only"
        />
      );
    }

    switch (setting.settingType) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
            className="setting-input"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
            className="setting-input"
            min="0"
          />
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
            className="setting-input"
          />
        );
    }
  };

  const renderCategory = (category: string, settings: SystemSetting[]) => {
    if (settings.length === 0) return null;

    return (
      <div key={category} className="settings-category">
        <div className="category-header">
          <h3>{categoryLabels[category] || category}</h3>
          <p className="category-description">
            {categoryDescriptions[category] || ''}
          </p>
        </div>
        <div className="settings-list">
          {settings.map((setting) => (
            <div key={setting.settingKey} className="setting-item">
              <div className="setting-info">
                <label className="setting-label">
                  {setting.displayName}
                  {!setting.isEditable && (
                    <span className="readonly-badge">Read-only</span>
                  )}
                </label>
                {setting.description && (
                  <p className="setting-description">{setting.description}</p>
                )}
              </div>
              <div className="setting-control">
                {renderSettingInput(setting)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
  }

  const categories = Object.keys(settingsByCategory);

  return (
    <div className="system-settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p className="subtitle">
          Manage global system configuration and preferences
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <nav className="category-nav">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-nav-item ${
                  activeCategory === category ? 'active' : ''
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content">
          {categories
            .filter((cat) => cat === activeCategory)
            .map((category) =>
              renderCategory(category, settingsByCategory[category])
            )}

          <div className="settings-actions">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              Reset Changes
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
