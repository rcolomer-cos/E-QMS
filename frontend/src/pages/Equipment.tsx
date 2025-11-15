import { useState, useEffect } from 'react';
import api from '../services/api';
import { Equipment } from '../types';

function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      setEquipment(response.data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading equipment...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Equipment Management</h1>
        <button className="btn-primary">Add Equipment</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Equipment Number</th>
            <th>Name</th>
            <th>Location</th>
            <th>Status</th>
            <th>Next Calibration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.length === 0 ? (
            <tr>
              <td colSpan={6}>No equipment found</td>
            </tr>
          ) : (
            equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.equipmentNumber}</td>
                <td>{item.name}</td>
                <td>{item.location}</td>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.nextCalibrationDate
                    ? new Date(item.nextCalibrationDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <button className="btn-small">View</button>
                  <button className="btn-small">QR Code</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentPage;
