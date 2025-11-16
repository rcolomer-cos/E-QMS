import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInitStatus,
  createFirstSuperuser,
} from '../services/systemService';
import '../styles/Login.css';

function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [statusError, setStatusError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [databaseReady, setDatabaseReady] = useState<boolean>(true);
  const [missingTables, setMissingTables] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getInitStatus();
        setDatabaseReady(status.databaseReady ?? status.hasDatabase);
        setMissingTables(status.missingTables);
        if (!status.needsSetup) {
          navigate('/login', { replace: true });
          return;
        }
        setNeedsSetup(true);
      } catch (e) {
        setStatusError('Unable to check system status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createFirstSuperuser({ email, password, firstName, lastName });
      navigate('/login', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to create superuser. Check inputs and try again.';
      setError(msg);
      const details = err?.response?.data?.details;
      setErrorDetails(Array.isArray(details) ? details : null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box"><p>Checking system status…</p></div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="login-container">
        <div className="login-box"><p className="error-message">{statusError}</p></div>
      </div>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>E-QMS</h1>
        <h2>Initial Setup</h2>
        <p className="subtitle">Create the first superuser account</p>

        {!databaseReady && (
          <div className="error-message" style={{ marginBottom: 12 }}>
            Database is not fully initialized. Please run the database setup first.
            {missingTables && missingTables.length > 0 && (
              <>
                <br />Missing tables: {missingTables.join(', ')}
              </>
            )}
            <br />See SETUP_GUIDE.md (Database Setup) and re-try.
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              title="Enter a valid email like user@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small>Password must be at least 8 characters and strong.</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
              {errorDetails && errorDetails.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {errorDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button type="submit" disabled={submitting || !databaseReady}>
            {submitting ? 'Creating…' : 'Create Superuser'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Setup;
