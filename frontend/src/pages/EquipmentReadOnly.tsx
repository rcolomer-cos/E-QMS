import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEquipmentReadOnly, Equipment as EquipmentType } from '../services/equipmentService';
import '../styles/Equipment.css';

function EquipmentReadOnly() {
  const { equipmentNumber } = useParams<{ equipmentNumber: string }>();
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentNumber]);

  const loadEquipment = async () => {
    if (!equipmentNumber) {
      setError('Equipment number is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getEquipmentReadOnly(equipmentNumber);
      setEquipment(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'status-operational';
      case 'maintenance':
        return 'status-maintenance';
      case 'out_of_service':
        return 'status-out-of-service';
      case 'calibration_due':
        return 'status-calibration-due';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="readonly-page">
        <div className="loading">Loading equipment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="readonly-page">
        <div className="error-container">
          <h2>⚠ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="readonly-page">
        <div className="error-container">
          <h2>Equipment Not Found</h2>
          <p>The requested equipment could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="readonly-page">
      <div className="readonly-container">
        <div className="readonly-header">
          <div className="readonly-logo">
            <h1>E-QMS</h1>
            <p>Equipment Management System</p>
          </div>
        </div>

        <div className="readonly-content">
          <div className="readonly-title">
            <h2>{equipment.name}</h2>
            <span className={`status-badge ${getStatusClass(equipment.status)}`}>
              {getStatusLabel(equipment.status)}
            </span>
          </div>

          {/* Status Alerts */}
          {equipment.status === 'calibration_due' && (
            <div className="alert-banner alert-warning">
              ⚠ Calibration is due for this equipment
            </div>
          )}
          {equipment.status === 'out_of_service' && (
            <div className="alert-banner alert-danger">
              ⛔ This equipment is out of service
            </div>
          )}
          {equipment.status === 'maintenance' && (
            <div className="alert-banner alert-info">
              🔧 This equipment is currently under maintenance
            </div>
          )}

          {/* Basic Information */}
          <div className="readonly-section">
            <h3>Basic Information</h3>
            <div className="readonly-grid">
              <div className="readonly-item">
                <span className="readonly-label">Equipment Number</span>
                <span className="readonly-value">{equipment.equipmentNumber}</span>
              </div>
              <div className="readonly-item">
                <span className="readonly-label">Location</span>
                <span className="readonly-value">{equipment.location}</span>
              </div>
              {equipment.description && (
                <div className="readonly-item readonly-full">
                  <span className="readonly-label">Description</span>
                  <span className="readonly-value">{equipment.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Details */}
          {(equipment.manufacturer || equipment.model || equipment.serialNumber) && (
            <div className="readonly-section">
              <h3>Equipment Details</h3>
              <div className="readonly-grid">
                {equipment.manufacturer && (
                  <div className="readonly-item">
                    <span className="readonly-label">Manufacturer</span>
                    <span className="readonly-value">{equipment.manufacturer}</span>
                  </div>
                )}
                {equipment.model && (
                  <div className="readonly-item">
                    <span className="readonly-label">Model</span>
                    <span className="readonly-value">{equipment.model}</span>
                  </div>
                )}
                {equipment.serialNumber && (
                  <div className="readonly-item">
                    <span className="readonly-label">Serial Number</span>
                    <span className="readonly-value">{equipment.serialNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Schedule */}
          {(equipment.nextCalibrationDate || equipment.nextMaintenanceDate) && (
            <div className="readonly-section">
              <h3>Maintenance Schedule</h3>
              <div className="readonly-grid">
                {equipment.nextCalibrationDate && (
                  <div className="readonly-item">
                    <span className="readonly-label">Next Calibration</span>
                    <span className="readonly-value">{formatDate(equipment.nextCalibrationDate)}</span>
                  </div>
                )}
                {equipment.nextMaintenanceDate && (
                  <div className="readonly-item">
                    <span className="readonly-label">Next Maintenance</span>
                    <span className="readonly-value">{formatDate(equipment.nextMaintenanceDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="readonly-footer">
          <p>For authorized access and full details, please log in to the E-QMS system.</p>
        </div>
      </div>
    </div>
  );
}

export default EquipmentReadOnly;
