import { useState } from 'react';

function Training() {
  const [trainings] = useState([]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Training Management</h1>
        <button className="btn-primary">Schedule Training</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Training Number</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Scheduled Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainings.length === 0 ? (
            <tr>
              <td colSpan={6}>No trainings found</td>
            </tr>
          ) : (
            trainings.map((training: any) => (
              <tr key={training.id}>
                <td>{training.trainingNumber}</td>
                <td>{training.title}</td>
                <td>{training.category}</td>
                <td>
                  <span className={`status-badge status-${training.status}`}>
                    {training.status}
                  </span>
                </td>
                <td>{new Date(training.scheduledDate).toLocaleDateString()}</td>
                <td>
                  <button className="btn-small">View</button>
                  <button className="btn-small">Manage Attendees</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Training;
