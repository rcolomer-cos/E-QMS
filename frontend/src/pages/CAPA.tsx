import { useState } from 'react';

function CAPA() {
  const [capas] = useState([]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Corrective and Preventive Actions (CAPA)</h1>
        <button className="btn-primary">Create CAPA</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>CAPA Number</th>
            <th>Title</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Target Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {capas.length === 0 ? (
            <tr>
              <td colSpan={7}>No CAPAs found</td>
            </tr>
          ) : (
            capas.map((capa: any) => (
              <tr key={capa.id}>
                <td>{capa.capaNumber}</td>
                <td>{capa.title}</td>
                <td>{capa.type}</td>
                <td>{capa.priority}</td>
                <td>
                  <span className={`status-badge status-${capa.status}`}>
                    {capa.status}
                  </span>
                </td>
                <td>{new Date(capa.targetDate).toLocaleDateString()}</td>
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

export default CAPA;
