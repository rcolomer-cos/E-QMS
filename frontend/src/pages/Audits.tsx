import { useState, useEffect } from 'react';
import api from '../services/api';
import { Audit } from '../types';

function Audits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await api.get('/audits');
      setAudits(response.data);
    } catch (error) {
      console.error('Failed to load audits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading audits...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit Management</h1>
        <button className="btn-primary">Schedule Audit</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Audit Number</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Scheduled Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {audits.length === 0 ? (
            <tr>
              <td colSpan={6}>No audits found</td>
            </tr>
          ) : (
            audits.map((audit) => (
              <tr key={audit.id}>
                <td>{audit.auditNumber}</td>
                <td>{audit.title}</td>
                <td>{audit.auditType}</td>
                <td>
                  <span className={`status-badge status-${audit.status}`}>
                    {audit.status}
                  </span>
                </td>
                <td>{new Date(audit.scheduledDate).toLocaleDateString()}</td>
                <td>
                  <button className="btn-small">View</button>
                  <button className="btn-small">Edit</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Audits;
