import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProcesses } from '../services/processService';
import { Process } from '../types';
import '../styles/Processes.css';

function ProcessOverview() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProcesses();
        setProcesses(data.filter(p => p.active !== false));
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load processes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    return {
      main: processes.filter(p => (p.processType || 'main') === 'main' && !p.parentProcessId),
      sub: processes.filter(p => (p.processType || 'sub') === 'sub'),
      support: processes.filter(p => (p.processType || 'support') === 'support' && !p.parentProcessId),
    };
  }, [processes]);

  if (loading) return <div className="loading">Loading processes...</div>;

  return (
    <div className="processes-page">
      <div className="page-header">
        <h1>Active Processes</h1>
        <p className="subtitle">Browse processes and open details</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section>
        <h2>Main Processes</h2>
        <div className="cards-grid">
          {grouped.main.length === 0 && <div className="no-data">No main processes</div>}
          {grouped.main.map(p => (
            <div key={p.id} className="process-card" onClick={() => navigate(`/processes/${p.id}/detail`)}>
              <div className="process-card-header">
                <span className="code-badge">{p.code}</span>
                <span className="type-badge">Main</span>
              </div>
              <div className="process-card-title">{p.name}</div>
              <div className="process-card-desc">{p.description || '—'}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Support Processes</h2>
        <div className="cards-grid">
          {grouped.support.length === 0 && <div className="no-data">No support processes</div>}
          {grouped.support.map(p => (
            <div key={p.id} className="process-card" onClick={() => navigate(`/processes/${p.id}/detail`)}>
              <div className="process-card-header">
                <span className="code-badge">{p.code}</span>
                <span className="type-badge">Support</span>
              </div>
              <div className="process-card-title">{p.name}</div>
              <div className="process-card-desc">{p.description || '—'}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProcessOverview;
