import { Fragment, useEffect, useMemo, useState } from 'react';
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
      main: processes.filter(p => p.processType === 'main' && !p.parentProcessId),
      sub: processes.filter(p => p.processType === 'sub'),
      support: processes.filter(p => p.processType === 'support' && !p.parentProcessId),
    };
  }, [processes]);

  const subsByParent = useMemo(() => {
    const map: Record<number, Process[]> = {} as Record<number, Process[]>;
    processes.forEach(p => {
      if (p.processType === 'sub' && p.parentProcessId) {
        const pid = p.parentProcessId;
        if (!map[pid]) map[pid] = [];
        map[pid].push(p);
      }
    });
    Object.values(map).forEach(arr =>
      arr.sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name)
      )
    );
    return map;
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
        <h2>Support Processes</h2>
        <div className="cards-grid">
          {grouped.support.length === 0 && <div className="no-data">No support processes</div>}
          {grouped.support.map(p => (
            <div key={p.id} className="process-card" onClick={() => navigate(`/processes/${p.id}/detail`)}>
              <div className="process-card-header">
                <span className="type-badge">{p.name}</span>
              </div>
              <div className="process-card-desc">{p.description || '—'}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Main Processes</h2>
        <div className="cards-grid">
          {grouped.main.length === 0 && <div className="no-data">No main processes</div>}
          {grouped.main.map((p, index) => (
            <Fragment key={p.id}>
              <div className="main-with-subs">
                <div className="process-card" onClick={() => navigate(`/processes/${p.id}/detail`)}>
                  <div className="process-card-header">
                    <span className="type-badge">{p.name}</span>
                  </div>
                  <div className="process-card-desc">{p.description || '—'}</div>
                </div>
                {subsByParent[p.id] && subsByParent[p.id].length > 0 && (
                  <>
                    <div className="down-arrow" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M12 16 L5 9 H9 V4 H15 V9 H19 Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="sub-row">
                      {subsByParent[p.id].map((sp, sIndex) => (
                        <Fragment key={sp.id}>
                          <div className="process-card" onClick={() => navigate(`/processes/${sp.id}/detail`)}>
                            <div className="process-card-header">
                              <span className="type-badge">{sp.name}</span>
                            </div>
                            <div className="process-card-desc">{sp.description || '—'}</div>
                          </div>
                          {sIndex < subsByParent[p.id].length - 1 && (
                            <div className="sub-chevron" aria-hidden="true">
                              <svg width="24" height="24" viewBox="0 0 24 24">
                                <path d="M12 16 L5 9 H9 V4 H15 V9 H19 Z" fill="currentColor" />
                              </svg>
                            </div>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {index < grouped.main.length - 1 && (
                <div className="process-arrow">
                  <svg width="40" height="60" viewBox="0 0 40 60">
                    <path d="M5 30 L25 30 L25 10 L35 30 L25 50 L25 30" fill="currentColor" />
                  </svg>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProcessOverview;
