import React, { useState, useEffect } from 'react';
import '../styles/BackupManagement.css';
import {
  createBackup,
  listBackups,
  restoreBackup,
  verifyBackup,
  deleteBackup,
  BackupFileInfo,
} from '../services/systemService';

interface BackupStatus {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const BackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [backupPath, setBackupPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupFileInfo | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await listBackups();
      setBackups(data.backups);
      setBackupPath(data.backupPath);
      setStatus(null);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to load backups',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Creating backup... This may take several minutes.' });
      
      const result = await createBackup();
      
      setStatus({
        type: 'success',
        message: `Backup created successfully: ${result.backup.fileName} (${result.backup.fileSizeMB} MB)`,
      });
      
      // Reload backups list
      await loadBackups();
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to create backup',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackup = async (filePath: string, fileName: string) => {
    try {
      setLoading(true);
      setStatus({ type: 'info', message: `Verifying backup: ${fileName}...` });
      
      const result = await verifyBackup({ backupFile: filePath });
      
      setStatus({
        type: 'success',
        message: result.message,
      });
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to verify backup',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) {
      setStatus({ type: 'warning', message: 'Please select a backup to restore' });
      return;
    }

    try {
      setLoading(true);
      setShowRestoreConfirm(false);
      setStatus({
        type: 'info',
        message: 'Restoring database... This may take several minutes. DO NOT close this window.',
      });
      
      const result = await restoreBackup({
        backupFile: selectedBackup,
        replaceExisting,
      });
      
      setStatus({
        type: 'success',
        message: result.message + ' You may need to refresh the application.',
      });
      
      setSelectedBackup('');
      setReplaceExisting(false);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to restore backup',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      
      await deleteBackup({ fileName: backupToDelete.fileName });
      
      setStatus({
        type: 'success',
        message: `Backup deleted: ${backupToDelete.fileName}`,
      });
      
      setBackupToDelete(null);
      await loadBackups();
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete backup',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatSize = (sizeMB: number) => {
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)} KB`;
    }
    if (sizeMB > 1024) {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeMB.toFixed(2)} MB`;
  };

  return (
    <div className="backup-management">
      <div className="page-header">
        <h1>Database Backup & Restore</h1>
        <p className="subtitle">Manage MSSQL database backups and restore operations</p>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`status-message status-${status.type}`}>
          <span className="status-icon">
            {status.type === 'success' && '✓'}
            {status.type === 'error' && '✕'}
            {status.type === 'warning' && '⚠'}
            {status.type === 'info' && 'ℹ'}
          </span>
          <span className="status-text">{status.message}</span>
          <button className="status-close" onClick={() => setStatus(null)}>×</button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-section">
        <div className="action-card">
          <h2>Create New Backup</h2>
          <p>Create a full backup of the database with compression.</p>
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Backup'}
          </button>
        </div>

        <div className="action-card">
          <h2>Backup Location</h2>
          <p className="backup-path">{backupPath || 'Not configured'}</p>
          <button
            className="btn btn-secondary"
            onClick={loadBackups}
            disabled={loading}
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Available Backups */}
      <div className="backups-section">
        <h2>Available Backups ({backups.length})</h2>
        
        {backups.length === 0 && !loading && (
          <div className="empty-state">
            <p>No backups found. Create your first backup to get started.</p>
          </div>
        )}

        {backups.length > 0 && (
          <div className="backups-table">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.fileName}>
                    <td className="file-name">{backup.fileName}</td>
                    <td>{formatSize(backup.fileSizeMB)}</td>
                    <td>{formatDate(backup.createdAt)}</td>
                    <td>{backup.age}</td>
                    <td className="actions">
                      <button
                        className="btn-action btn-verify"
                        onClick={() => handleVerifyBackup(backup.filePath, backup.fileName)}
                        disabled={loading}
                        title="Verify backup integrity"
                      >
                        Verify
                      </button>
                      <button
                        className="btn-action btn-restore"
                        onClick={() => {
                          setSelectedBackup(backup.filePath);
                          setShowRestoreConfirm(true);
                        }}
                        disabled={loading}
                        title="Restore from this backup"
                      >
                        Restore
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => {
                          setBackupToDelete(backup);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={loading}
                        title="Delete this backup"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Confirm Database Restore</h3>
            <p className="warning-text">
              <strong>WARNING:</strong> Restoring the database will replace the current data
              with the selected backup. This operation cannot be undone.
            </p>
            <p>Selected backup: {selectedBackup.split(/[\\/]/).pop()}</p>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                Replace existing database (required if database exists)
              </label>
            </div>

            <p className="info-text">
              All active connections will be terminated during restore.
              The application may need to be restarted after restore.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={handleRestoreBackup}
                disabled={loading}
              >
                Confirm Restore
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup('');
                  setReplaceExisting(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && backupToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this backup?</p>
            <p className="file-name">{backupToDelete.fileName}</p>
            <p className="info-text">This action cannot be undone.</p>

            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={handleDeleteBackup}
                disabled={loading}
              >
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setBackupToDelete(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="notes-section">
        <h3>Important Notes</h3>
        <ul>
          <li>
            <strong>Backup Location:</strong> Backups are stored in the configured backup
            directory on the server. Ensure sufficient disk space is available.
          </li>
          <li>
            <strong>Backup Size:</strong> Compressed backups typically use 20-40% of the
            database size.
          </li>
          <li>
            <strong>Retention Policy:</strong> Old backups are automatically cleaned up based
            on the configured retention period (default: 30 days).
          </li>
          <li>
            <strong>Before Restore:</strong> Always verify a backup before restoring to ensure
            it's valid and contains the expected data.
          </li>
          <li>
            <strong>Off-site Storage:</strong> For disaster recovery, copy backup files to
            off-site or cloud storage regularly.
          </li>
          <li>
            <strong>Test Restores:</strong> Periodically test restore procedures to ensure
            backups are valid and can be restored successfully.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManagement;
