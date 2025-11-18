import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, getRememberMe } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { getInitStatus } from '../services/systemService';
import { useBranding } from '../contexts/BrandingContext';
import '../styles/Login.css';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState<boolean>(getRememberMe());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { branding } = useBranding();

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
      const name = result?.user?.firstName || result?.user?.email || t('dashboard.welcome');
      toast.success(`${t('dashboard.welcome')}, ${name}!`);
      const from = (location.state as any)?.from;
      if (from && typeof from === 'object' && 'pathname' in from) {
        const dest = `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`;
        navigate(dest, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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
        (status === 429 ? t('auth.tooManyAttempts') : undefined) ||
        err.message ||
        t('auth.invalidCredentials');
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
        {branding?.companyLogoUrl || branding?.companyLogoPath ? (
          <div className="brand-logo-wrap">
            <img
              src={branding.companyLogoUrl || branding.companyLogoPath || ''}
              alt={branding.companyName || 'Company Logo'}
              className="brand-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : null}
        <h1>{branding?.companyName || t('branding.companyName')}</h1>
        <h2>{t('branding.tagline')}</h2>
        {branding?.tagline ? (
          <p className="subtitle">{branding.tagline}</p>
        ) : (
          <p className="subtitle">{t('branding.isoCompliant')}</p>
        )}
        {(location.state as any)?.from?.pathname && (
          <p className="redirect-hint">
            {t('auth.redirectHint')}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
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
              <span>{t('auth.rememberMe')}</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? `${t('common.loading')}` : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
