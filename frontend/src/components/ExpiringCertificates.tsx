import { useState, useEffect } from 'react';
import {
  getExpiringCertificates,
  getExpiringAttendeeRecords,
  ExpiringCertificate,
  ExpiringAttendeeRecord,
} from '../services/trainingService';
import '../styles/ExpiringCertificates.css';

interface ExpiringCertificatesProps {
  daysThreshold?: number;
  showAttendeeRecords?: boolean;
}

function ExpiringCertificates({ daysThreshold = 90, showAttendeeRecords = false }: ExpiringCertificatesProps) {
  const [certificates, setCertificates] = useState<ExpiringCertificate[]>([]);
  const [attendeeRecords, setAttendeeRecords] = useState<ExpiringAttendeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(daysThreshold);
  const [includeExpired, setIncludeExpired] = useState(true);

  useEffect(() => {
    loadData();
  }, [threshold, includeExpired, showAttendeeRecords]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (showAttendeeRecords) {
        const response = await getExpiringAttendeeRecords(threshold, includeExpired);
        setAttendeeRecords(response.data);
      } else {
        const response = await getExpiringCertificates(threshold, includeExpired);
        setCertificates(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load expiring certificates');
      console.error('Error loading expiring certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyClass = (daysUntilExpiry: number | null, isExpired: boolean): string => {
    if (isExpired) return 'urgency-expired';
    if (daysUntilExpiry === null) return 'urgency-none';
    if (daysUntilExpiry <= 0) return 'urgency-expired';
    if (daysUntilExpiry <= 30) return 'urgency-critical';
    if (daysUntilExpiry <= 60) return 'urgency-high';
    return 'urgency-medium';
  };

  const getUrgencyLabel = (daysUntilExpiry: number | null, isExpired: boolean): string => {
    if (isExpired) return 'Expired';
    if (daysUntilExpiry === null) return 'No expiry';
    if (daysUntilExpiry <= 0) return 'Expired';
    if (daysUntilExpiry === 1) return '1 day';
    return `${daysUntilExpiry} days`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading expiring certificates...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const hasData = showAttendeeRecords ? attendeeRecords.length > 0 : certificates.length > 0;

  return (
    <div className="expiring-certificates">
      <div className="expiring-certificates-header">
        <h2>
          {showAttendeeRecords ? 'Expiring Training Records' : 'Expiring Certificates'}
        </h2>
        
        <div className="filter-controls">
          <label>
            Threshold:
            <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={120}>120 days</option>
              <option value={180}>180 days</option>
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
            />
            Include expired
          </label>
        </div>
      </div>

      {!hasData ? (
        <div className="no-data">
          No {showAttendeeRecords ? 'training records' : 'certificates'} expiring in the next {threshold} days.
        </div>
      ) : showAttendeeRecords ? (
        <table className="expiring-certificates-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Training</th>
              <th>Training Number</th>
              <th>Certificate Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendeeRecords.map((record) => (
              <tr key={record.id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{record.userFirstName} {record.userLastName}</div>
                    <div className="user-email">{record.userEmail}</div>
                  </div>
                </td>
                <td>{record.trainingTitle}</td>
                <td>{record.trainingNumber}</td>
                <td>{formatDate(record.certificateDate)}</td>
                <td>{formatDate(record.expiryDate)}</td>
                <td>
                  <span className={`expiry-badge ${getUrgencyClass(record.daysUntilExpiry, record.isExpired)}`}>
                    {getUrgencyLabel(record.daysUntilExpiry, record.isExpired)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="expiring-certificates-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Certificate</th>
              <th>Certificate Number</th>
              <th>Type</th>
              <th>Competency Area</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{cert.userFirstName} {cert.userLastName}</div>
                    <div className="user-email">{cert.userEmail}</div>
                  </div>
                </td>
                <td>{cert.certificateName}</td>
                <td>{cert.certificateNumber}</td>
                <td>{cert.certificateType}</td>
                <td>{cert.competencyArea || 'N/A'}</td>
                <td>{formatDate(cert.issueDate)}</td>
                <td>{formatDate(cert.expiryDate || cert.nextRenewalDate)}</td>
                <td>
                  <span className={`expiry-badge ${getUrgencyClass(cert.daysUntilExpiry, cert.isExpired)}`}>
                    {getUrgencyLabel(cert.daysUntilExpiry, cert.isExpired)}
                    {cert.requiresRenewal && cert.nextRenewalDate && !cert.expiryDate && ' (renewal)'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpiringCertificates;
