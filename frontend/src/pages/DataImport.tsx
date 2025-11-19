import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  getAvailableTemplates,
  downloadTemplate,
  uploadAndPreview,
  executeImport,
  getImportHistory,
  ImportTemplate,
  ImportTemplateType,
  ImportPreview,
  ImportLog,
} from '../services/importService';
import '../styles/DataImport.css';

const DataImport = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<ImportTemplateType | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [tempFilePath, setTempFilePath] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getAvailableTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getImportHistory({ limit: 20 });
      setImportHistory(data.logs);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedType) {
      toast.warning('Please select an import type');
      return;
    }

    try {
      await downloadTemplate(selectedType);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(null);
      setTempFilePath('');
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile || !selectedType) {
      toast.warning('Please select a file and import type');
      return;
    }

    try {
      setLoading(true);
      const result = await uploadAndPreview(selectedFile, selectedType);
      setPreview(result.preview);
      setTempFilePath(result.tempFilePath);
      
      if (result.preview.hasErrors) {
        toast.warning('File contains validation errors. Review and fix them before importing.');
      } else {
        toast.success('File validated successfully. Ready to import.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.details || 'Failed to parse file');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview || !tempFilePath || !selectedType || !selectedFile) {
      toast.warning('No data to import');
      return;
    }

    if (preview.hasErrors) {
      toast.error('Cannot import file with validation errors');
      return;
    }

    if (!window.confirm(`Are you sure you want to import ${preview.validRows} rows?`)) {
      return;
    }

    try {
      setImporting(true);
      const result = await executeImport({
        type: selectedType,
        tempFilePath,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      if (result.success) {
        toast.success(`Successfully imported ${result.result.successCount} rows`);
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        setTempFilePath('');
        setSelectedType('');
        // Refresh history
        await loadHistory();
      } else {
        toast.error(
          `Import completed with errors: ${result.result.successCount} succeeded, ${result.result.failureCount} failed`
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.details || 'Failed to execute import');
    } finally {
      setImporting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'partial':
        return 'badge-warning';
      case 'in_progress':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="data-import-page">
      <div className="page-header">
        <h1>Data Import</h1>
        <p className="page-description">
          Import data from Excel templates. Only superusers can access this functionality.
        </p>
      </div>

      <div className="import-container">
        <div className="import-card">
          <h2>Step 1: Download Template</h2>
          <div className="form-group">
            <label htmlFor="importType">Select Import Type:</label>
            <select
              id="importType"
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ImportTemplateType | '')}
            >
              <option value="">-- Select Type --</option>
              {templates.map((template) => (
                <option key={template.type} value={template.type}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDownloadTemplate}
            disabled={!selectedType}
          >
            Download Template
          </button>
        </div>

        <div className="import-card">
          <h2>Step 2: Upload File</h2>
          <div className="form-group">
            <label htmlFor="fileUpload">Select Excel File:</label>
            <input
              id="fileUpload"
              type="file"
              className="form-control"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="file-info">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleUploadAndPreview}
            disabled={!selectedFile || !selectedType || loading}
          >
            {loading ? 'Processing...' : 'Upload & Preview'}
          </button>
        </div>

        {preview && (
          <div className="import-card">
            <h2>Step 3: Preview & Import</h2>
            <div className="preview-summary">
              <div className="summary-item">
                <span className="label">Total Rows:</span>
                <span className="value">{preview.totalRows}</span>
              </div>
              <div className="summary-item">
                <span className="label">Valid Rows:</span>
                <span className="value success">{preview.validRows}</span>
              </div>
              <div className="summary-item">
                <span className="label">Invalid Rows:</span>
                <span className="value danger">{preview.invalidRows}</span>
              </div>
            </div>

            {preview.hasErrors && (
              <div className="alert alert-warning">
                <strong>Validation Errors Found:</strong> Please review the errors below and fix them in your Excel file before importing.
              </div>
            )}

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>Data Preview</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.rowNumber} className={row.errors.length > 0 ? 'row-error' : 'row-valid'}>
                      <td>{row.rowNumber}</td>
                      <td>
                        {row.errors.length > 0 ? (
                          <span className="badge badge-danger">Invalid</span>
                        ) : (
                          <span className="badge badge-success">Valid</span>
                        )}
                      </td>
                      <td className="data-preview">
                        {Object.entries(row.data)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {String(value || 'N/A')}
                            </div>
                          ))}
                      </td>
                      <td className="errors-cell">
                        {row.errors.map((error, idx) => (
                          <div key={idx} className="error-message">
                            {error.field ? `${error.field}: ` : ''}{error.error}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="import-actions">
              <button
                className="btn btn-success"
                onClick={handleExecuteImport}
                disabled={preview.hasErrors || importing}
              >
                {importing ? 'Importing...' : 'Execute Import'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPreview(null);
                  setTempFilePath('');
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="import-card">
          <div className="card-header">
            <h2>Import History</h2>
            <button
              className="btn btn-link"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>

          {showHistory && (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Success</th>
                    <th>Failed</th>
                    <th>Imported By</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">
                        No import history found
                      </td>
                    </tr>
                  ) : (
                    importHistory.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDate(log.startedAt)}</td>
                        <td className="import-type">{log.importType}</td>
                        <td className="file-name">{log.fileName}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="success-count">{log.successRows}</td>
                        <td className="failed-count">{log.failedRows}</td>
                        <td>
                          {log.firstName} {log.lastName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImport;
