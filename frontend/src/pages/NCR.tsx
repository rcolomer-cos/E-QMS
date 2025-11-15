import { useState } from 'react';

function NCR() {
  const [ncrs] = useState([]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Non-Conformance Reports (NCR)</h1>
        <button className="btn-primary">Create NCR</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>NCR Number</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Detected Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ncrs.length === 0 ? (
            <tr>
              <td colSpan={6}>No NCRs found</td>
            </tr>
          ) : (
            ncrs.map((ncr: any) => (
              <tr key={ncr.id}>
                <td>{ncr.ncrNumber}</td>
                <td>{ncr.title}</td>
                <td>{ncr.severity}</td>
                <td>
                  <span className={`status-badge status-${ncr.status}`}>
                    {ncr.status}
                  </span>
                </td>
                <td>{new Date(ncr.detectedDate).toLocaleDateString()}</td>
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

export default NCR;
