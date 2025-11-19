import { useState, useEffect } from 'react';
import {
  getAllModules,
  updateModuleVisibility,
  ModuleVisibility,
} from '../services/moduleVisibilityService';
import { useModuleVisibility } from '../contexts/ModuleVisibilityContext';
import { useToast } from '../contexts/ToastContext';

const ModuleVisibilitySettings = () => {
  const [modules, setModules] = useState<ModuleVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshModules } = useModuleVisibility();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await getAllModules();
      setModules(data);
    } catch (err) {
      console.error('Error loading modules:', err);
      showError('Failed to load module visibility settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (moduleKey: string, currentState: boolean) => {
    try {
      setSaving(true);
      const newState = !currentState;
      
      await updateModuleVisibility(moduleKey, newState);
      
      // Update local state
      setModules(prevModules =>
        prevModules.map(m =>
          m.moduleKey === moduleKey ? { ...m, isEnabled: newState } : m
        )
      );

      // Refresh the global module visibility context
      await refreshModules();

      success(
        `Module "${modules.find(m => m.moduleKey === moduleKey)?.moduleName}" ${newState ? 'enabled' : 'disabled'}`
      );
    } catch (err) {
      console.error('Error updating module visibility:', err);
      showError('Failed to update module visibility');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading module visibility settings...</div>;
  }

  return (
    <div className="module-visibility-settings">
      <div className="settings-section">
        <h3>Module Visibility</h3>
        <p className="section-description">
          Control which modules are visible to end users. Administrators always have access to all modules regardless of these settings.
        </p>
      </div>

      <div className="module-list">
        {modules.map((module) => (
          <div key={module.moduleKey} className="module-item">
            <div className="module-info">
              <div className="module-header">
                <h4>{module.moduleName}</h4>
                <span className={`module-status ${module.isEnabled ? 'enabled' : 'disabled'}`}>
                  {module.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {module.description && (
                <p className="module-description">{module.description}</p>
              )}
            </div>
            <div className="module-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={module.isEnabled}
                  onChange={() => handleToggle(module.moduleKey, module.isEnabled)}
                  disabled={saving}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-info">
        <div className="info-box">
          <h4>ℹ️ Important Notes</h4>
          <ul>
            <li>Disabling a module will hide it from the navigation menu and prevent non-admin users from accessing it.</li>
            <li>Administrators and superusers always have access to all modules regardless of visibility settings.</li>
            <li>Changes take effect immediately for all users.</li>
            <li>Users will not be redirected if they are currently viewing a disabled module; they will lose access on the next navigation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModuleVisibilitySettings;
