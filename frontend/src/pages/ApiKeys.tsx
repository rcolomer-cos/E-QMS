import { useState, useEffect } from 'react';
import {
  getAllApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  ApiKey,
  CreateApiKeyData,
} from '../services/apiKeyService';
import '../styles/ApiKeys.css';

const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ name: string; key: string } | null>(null);

  // Form state for creating API key
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    description: '',
    expiresAt: '',
    scopes: [],
    allowedIPs: [],
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllApiKeys();
      setApiKeys(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const response = await createApiKey(formData);
      setGeneratedKey({
        name: response.apiKey.name,
        key: response.rawKey,
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        expiresAt: '',
        scopes: [],
        allowedIPs: [],
      });
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleRevokeApiKey = async (id: number, name: string) => {
    const reason = window.prompt(`Revoke API key "${name}"?\n\nOptional: Enter reason for revocation:`);
    if (reason === null) return; // User cancelled

    try {
      setError('');
      await revokeApiKey(id, reason || undefined);
      setSuccess(`API key "${name}" revoked successfully`);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke API key');
    }
  };

  const handleDeleteApiKey = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete API key "${name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      await deleteApiKey(id);
      setSuccess(`API key "${name}" deleted successfully`);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('API key copied to clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };

  const closeGeneratedKeyModal = () => {
    setGeneratedKey(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.active) {
      return <span className="status-badge revoked">Revoked</span>;
    }
    if (isExpired(apiKey.expiresAt)) {
      return <span className="status-badge expired">Expired</span>;
    }
    return <span className="status-badge active">Active</span>;
  };

  if (loading) {
    return <div className="loading">Loading API keys...</div>;
  }

  return (
    <div className="api-keys-page">
      <div className="page-header">
        <div>
          <h1>API Key Management</h1>
          <p className="subtitle">Manage API keys for integration endpoints</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Generate API Key
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="api-keys-table-container">
        <table className="api-keys-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key Preview</th>
              <th>Status</th>
              <th>Last Used</th>
              <th>Usage Count</th>
              <th>Expires</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No API keys found. Create one to get started.
                </td>
              </tr>
            ) : (
              apiKeys.map((apiKey) => (
                <tr key={apiKey.id}>
                  <td>
                    <div className="key-name">
                      <strong>{apiKey.name}</strong>
                      {apiKey.description && (
                        <div className="key-description">{apiKey.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <code className="key-preview">{apiKey.keyPreview}</code>
                  </td>
                  <td>{getStatusBadge(apiKey)}</td>
                  <td>{formatDate(apiKey.lastUsedAt)}</td>
                  <td className="text-center">{apiKey.usageCount}</td>
                  <td>{formatDate(apiKey.expiresAt)}</td>
                  <td>
                    <div>{formatDate(apiKey.createdAt)}</div>
                    {apiKey.creatorName && (
                      <div className="creator-info">by {apiKey.creatorName}</div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {apiKey.active && !isExpired(apiKey.expiresAt) && (
                        <button
                          className="btn-small btn-warning"
                          onClick={() => handleRevokeApiKey(apiKey.id, apiKey.name)}
                          title="Revoke this API key"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                        title="Delete this API key"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate New API Key</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateApiKey}>
              <div className="form-group">
                <label htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Production Integration Key"
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this API key"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="expiresAt">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <small className="form-help">Leave empty for no expiration</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Key Display Modal */}
      {generatedKey && (
        <div className="modal-overlay">
          <div className="modal-content generated-key-modal">
            <div className="modal-header">
              <h2>API Key Generated Successfully</h2>
            </div>
            <div className="generated-key-content">
              <div className="alert alert-warning">
                <strong>⚠️ Important:</strong> Save this API key now. You won't be able to see it again!
              </div>
              <div className="key-display-section">
                <label>API Key Name:</label>
                <div className="key-name-display">{generatedKey.name}</div>
              </div>
              <div className="key-display-section">
                <label>API Key:</label>
                <div className="key-display">
                  <code>{generatedKey.key}</code>
                  <button
                    className="btn-copy"
                    onClick={() => handleCopyKey(generatedKey.key)}
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="usage-instructions">
                <h3>Usage Instructions:</h3>
                <p>Include this API key in your HTTP requests using the X-API-Key header:</p>
                <pre className="code-block">
{`curl -H "X-API-Key: ${generatedKey.key}" \\
  https://your-domain.com/api/endpoint`}
                </pre>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={closeGeneratedKeyModal}>
                I've Saved the Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
