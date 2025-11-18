import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getRememberMe } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { getInitStatus } from '../services/systemService';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState<boolean>(getRememberMe());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // If the system needs setup, redirect to setup page
    const checkSetup = async () => {
      try {
        const status = await getInitStatus();
        if (status.needsSetup) {
          navigate('/setup', { replace: true });
        }
      } catch {
        // ignore; login may still work if API reachable
      }
    };
    checkSetup();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted', { email, passwordLength: password.length });
    setError('');
    setLoading(true);

    try {
      console.log('Calling login API...');
      const result = await login({ email, password, rememberMe });
      console.log('Login successful:', result);
      const name = result?.user?.firstName || result?.user?.email || 'Welcome';
      toast.success(`Welcome, ${name}!`);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      const data = err?.response?.data;
      const status = err?.response?.status;
      const derived =
        (typeof data === 'string' && data) ||
        data?.error ||
        data?.message ||
        (status === 429 ? 'Too many attempts. Please try again later.' : undefined) ||
        err.message ||
        'Invalid credentials. Please try again.';
      const errorMessage = derived;
      setError(errorMessage);
      // Show toast for quick visual feedback
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>E-QMS</h1>
        <h2>Quality Management System</h2>
        <p className="subtitle">ISO 9001:2015 Compliant</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
