import { useState, useEffect } from 'react';
import {
  generateEvidencePack,
  downloadBlob,
  EvidencePackFilters,
} from '../services/evidencePackService';
import {
  createAuditorAccessToken,
  getAuditorAccessTokens,
  revokeAuditorAccessToken,
  AuditorAccessToken,
  CreateAuditorAccessTokenRequest,
} from '../services/auditorAccessTokenService';
import { getCurrentUser } from '../services/authService';
import '../styles/ExternalAuditSupport.css';

function ExternalAuditSupport() {
  const [activeTab, setActiveTab] = useState<'evidence' | 'tokens'>('evidence');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currentUser = getCurrentUser();

  // Evidence Pack state
  const [evidenceFilters, setEvidenceFilters] = useState<EvidencePackFilters>({
    includeDocuments: true,
    includeNCRs: true,
    includeCAPAs: true,
    includeTraining: true,
    includeAudits: true,
    includeAttachments: true,
  });

  // Auditor Token state
  const [tokens, setTokens] = useState<AuditorAccessToken[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenForm, setTokenForm] = useState<CreateAuditorAccessTokenRequest>({
    auditorName: '',
    auditorEmail: '',
    auditorOrganization: '',
    expiresAt: '',
    scopeType: 'full_read_only',
    purpose: '',
    notes: '',
  });

  useEffect(() => {
    if (activeTab === 'tokens') {
      loadTokens();
    }
  }, [activeTab, showActiveOnly]);

  const loadTokens = async () => {
    try {
      const data = await getAuditorAccessTokens({ activeOnly: showActiveOnly });
      setTokens(data);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setMessage({ type: 'error', text: 'Failed to load tokens' });
    }
  };

  const handleGenerateEvidencePack = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const blob = await generateEvidencePack(evidenceFilters);
      const filename = `QMS_Evidence_Pack_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadBlob(blob, filename);
      setMessage({ type: 'success', text: 'Evidence pack generated successfully' });
    } catch (error) {
      console.error('Failed to generate evidence pack:', error);
      setMessage({ type: 'error', text: 'Failed to generate evidence pack' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setGeneratedToken(null);
    try {
      const response = await createAuditorAccessToken(tokenForm);
      setGeneratedToken(response.token);
      setMessage({ type: 'success', text: 'Token generated successfully' });
      setShowCreateForm(false);
      loadTokens();
      // Reset form
      setTokenForm({
        auditorName: '',
        auditorEmail: '',
        auditorOrganization: '',
        expiresAt: '',
        scopeType: 'full_read_only',
        purpose: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Failed to create token:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create token',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (id: number) => {
    const reason = prompt('Please provide a reason for revoking this token:');
    if (!reason) return;

    try {
      await revokeAuditorAccessToken(id, { reason });
      setMessage({ type: 'success', text: 'Token revoked successfully' });
      loadTokens();
    } catch (error) {
      console.error('Failed to revoke token:', error);
      setMessage({ type: 'error', text: 'Failed to revoke token' });
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setMessage({ type: 'success', text: 'Token copied to clipboard' });
  };

  const getDefaultExpiryDate = (days: number = 7): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 16);
  };

  const canManageTokens = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <div className="external-audit-support">
      <h1>External Audit Support</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === 'evidence' ? 'active' : ''}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence Pack
        </button>
        <button
          className={activeTab === 'tokens' ? 'active' : ''}
          onClick={() => setActiveTab('tokens')}
        >
          Auditor Access Tokens
        </button>
      </div>

      {activeTab === 'evidence' && (
        <div className="evidence-pack-section">
          <h2>Generate Evidence Pack</h2>
          <p className="section-description">
            Generate a comprehensive PDF report containing quality management system evidence for
            external auditors.
          </p>

          <div className="filter-section">
            <h3>Date Range (Optional)</h3>
            <div className="date-filters">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={evidenceFilters.startDate || ''}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={evidenceFilters.endDate || ''}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <h3>Include Sections</h3>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeDocuments}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, includeDocuments: e.target.checked })
                  }
                />
                Documents
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeNCRs}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, includeNCRs: e.target.checked })
                  }
                />
                Non-Conformance Reports (NCRs)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeCAPAs}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, includeCAPAs: e.target.checked })
                  }
                />
                Corrective & Preventive Actions (CAPAs)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeTraining}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, includeTraining: e.target.checked })
                  }
                />
                Training Records
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeAudits}
                  onChange={(e) =>
                    setEvidenceFilters({ ...evidenceFilters, includeAudits: e.target.checked })
                  }
                />
                Audit Records
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={evidenceFilters.includeAttachments}
                  onChange={(e) =>
                    setEvidenceFilters({
                      ...evidenceFilters,
                      includeAttachments: e.target.checked,
                    })
                  }
                />
                Attachment Summaries
              </label>
            </div>
          </div>

          <button
            className="btn btn-primary generate-btn"
            onClick={handleGenerateEvidencePack}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate & Download Evidence Pack'}
          </button>
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="tokens-section">
          <div className="section-header">
            <h2>Auditor Access Tokens</h2>
            {canManageTokens && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : 'Create New Token'}
              </button>
            )}
          </div>

          {generatedToken && (
            <div className="token-generated-alert">
              <h3>⚠️ Token Generated Successfully</h3>
              <p>
                <strong>This token will only be displayed once. Save it securely!</strong>
              </p>
              <div className="token-display">
                <code>{generatedToken}</code>
                <button onClick={() => handleCopyToken(generatedToken)}>Copy</button>
              </div>
              <button onClick={() => setGeneratedToken(null)}>Dismiss</button>
            </div>
          )}

          {showCreateForm && canManageTokens && (
            <form className="token-form" onSubmit={handleCreateToken}>
              <h3>Create New Auditor Access Token</h3>

              <div className="form-group">
                <label>
                  Auditor Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tokenForm.auditorName}
                  onChange={(e) => setTokenForm({ ...tokenForm, auditorName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="form-group">
                <label>
                  Auditor Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={tokenForm.auditorEmail}
                  onChange={(e) => setTokenForm({ ...tokenForm, auditorEmail: e.target.value })}
                  placeholder="jane.smith@audit-firm.com"
                />
              </div>

              <div className="form-group">
                <label>Auditor Organization</label>
                <input
                  type="text"
                  value={tokenForm.auditorOrganization}
                  onChange={(e) =>
                    setTokenForm({ ...tokenForm, auditorOrganization: e.target.value })
                  }
                  placeholder="External Audit Firm LLC"
                />
              </div>

              <div className="form-group">
                <label>
                  Expiration Date <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={tokenForm.expiresAt}
                  onChange={(e) => setTokenForm({ ...tokenForm, expiresAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <small>
                  Quick set:{' '}
                  <button
                    type="button"
                    onClick={() =>
                      setTokenForm({ ...tokenForm, expiresAt: getDefaultExpiryDate(1) })
                    }
                  >
                    24h
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTokenForm({ ...tokenForm, expiresAt: getDefaultExpiryDate(7) })
                    }
                  >
                    7 days
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTokenForm({ ...tokenForm, expiresAt: getDefaultExpiryDate(30) })
                    }
                  >
                    30 days
                  </button>
                </small>
              </div>

              <div className="form-group">
                <label>
                  Access Scope <span className="required">*</span>
                </label>
                <select
                  value={tokenForm.scopeType}
                  onChange={(e) =>
                    setTokenForm({
                      ...tokenForm,
                      scopeType: e.target.value as any,
                    })
                  }
                >
                  <option value="full_read_only">Full Read-Only Access</option>
                  <option value="specific_audit">Specific Audit</option>
                  <option value="specific_document">Specific Document</option>
                  <option value="specific_ncr">Specific NCR</option>
                  <option value="specific_capa">Specific CAPA</option>
                </select>
              </div>

              {tokenForm.scopeType !== 'full_read_only' && (
                <div className="form-group">
                  <label>
                    Entity ID <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={tokenForm.scopeEntityId || ''}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, scopeEntityId: parseInt(e.target.value) })
                    }
                    placeholder="Enter the ID of the audit/document/NCR/CAPA"
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  Purpose <span className="required">*</span>
                </label>
                <textarea
                  required
                  value={tokenForm.purpose}
                  onChange={(e) => setTokenForm({ ...tokenForm, purpose: e.target.value })}
                  placeholder="ISO 9001:2015 certification audit"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={tokenForm.notes}
                  onChange={(e) => setTokenForm({ ...tokenForm, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Maximum Uses (Optional)</label>
                <input
                  type="number"
                  min="1"
                  value={tokenForm.maxUses || ''}
                  onChange={(e) =>
                    setTokenForm({
                      ...tokenForm,
                      maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Leave empty for unlimited uses"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Generate Token'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="tokens-list-header">
            <h3>Token List</h3>
            <label className="filter-label">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              Show active only
            </label>
          </div>

          <div className="tokens-list">
            {tokens.length === 0 ? (
              <p className="no-data">No tokens found</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Auditor</th>
                    <th>Organization</th>
                    <th>Token Preview</th>
                    <th>Scope</th>
                    <th>Purpose</th>
                    <th>Expires</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id} className={token.active ? '' : 'revoked'}>
                      <td>
                        <div>{token.auditorName}</div>
                        <div className="small-text">{token.auditorEmail}</div>
                      </td>
                      <td>{token.auditorOrganization || '-'}</td>
                      <td>
                        <code>{token.tokenPreview}</code>
                      </td>
                      <td>
                        <span className="scope-badge">{token.scopeType}</span>
                        {token.scopeEntityId && (
                          <div className="small-text">ID: {token.scopeEntityId}</div>
                        )}
                      </td>
                      <td className="purpose-cell">{token.purpose}</td>
                      <td>
                        {new Date(token.expiresAt).toLocaleString()}
                        {new Date(token.expiresAt) < new Date() && (
                          <div className="status-expired">Expired</div>
                        )}
                      </td>
                      <td>
                        {token.currentUses}
                        {token.maxUses && ` / ${token.maxUses}`}
                        {token.lastUsedAt && (
                          <div className="small-text">
                            Last: {new Date(token.lastUsedAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {token.active ? (
                          <span className="status-active">Active</span>
                        ) : (
                          <span className="status-revoked">Revoked</span>
                        )}
                        {token.revokedAt && (
                          <div className="small-text">
                            {new Date(token.revokedAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {token.active && canManageTokens && (
                          <button
                            className="btn-small btn-danger"
                            onClick={() => handleRevokeToken(token.id)}
                          >
                            Revoke
                          </button>
                        )}
                        {token.revocationReason && (
                          <div className="small-text" title={token.revocationReason}>
                            ℹ️
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExternalAuditSupport;
