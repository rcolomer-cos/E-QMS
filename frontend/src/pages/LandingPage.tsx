import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '../services/authService';
import { getRecentDocuments, RecentDocument } from '../services/documentService';
import '../styles/LandingPage.css';

function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const documents = await getRecentDocuments(10);
      setRecentDocuments(documents);
    } catch (err) {
      console.error('Failed to load recent documents:', err);
      setError('Failed to load recent documents');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('common.today');
    } else if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      return `${diffDays} ${t('common.daysAgo')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType.toLowerCase()) {
      case 'policy':
        return '📋';
      case 'procedure':
        return '📝';
      case 'work instruction':
        return '📄';
      case 'form':
        return '📑';
      case 'record':
        return '📊';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      approved: 'status-badge approved',
      review: 'status-badge review',
      draft: 'status-badge draft',
      obsolete: 'status-badge obsolete',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'status-badge';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="landing-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          {t('landing.welcome')}, {currentUser?.firstName || currentUser?.email}! 👋
        </h1>
        <p className="welcome-subtitle">{t('landing.subtitle')}</p>
      </div>

      {/* Recent Documents Section */}
      <div className="recent-documents-section">
        <div className="section-header">
          <h2>{t('landing.recentChanges')}</h2>
          <button 
            className="tw-btn tw-btn-link"
            onClick={() => navigate('/documents')}
          >
            {t('landing.viewAll')} →
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!error && recentDocuments.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p>{t('landing.noRecentDocuments')}</p>
            <button 
              className="tw-btn tw-btn-primary"
              onClick={() => navigate('/documents')}
            >
              {t('landing.browseDocuments')}
            </button>
          </div>
        )}

        {!error && recentDocuments.length > 0 && (
          <div className="documents-list">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="document-card"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <div className="document-icon">
                  {getDocumentIcon(doc.documentType)}
                </div>
                <div className="document-content">
                  <div className="document-header">
                    <h3 className="document-title">{doc.title}</h3>
                    <span className={getStatusBadge(doc.status)}>
                      {t(`documents.status.${doc.status}`)}
                    </span>
                  </div>
                  <div className="document-meta">
                    <span className="document-type">{doc.documentType}</span>
                    <span className="document-separator">•</span>
                    <span className="document-version">v{doc.version}</span>
                    <span className="document-separator">•</span>
                    <span className="document-category">{doc.category}</span>
                  </div>
                  {doc.description && (
                    <p className="document-description">{doc.description}</p>
                  )}
                  <div className="document-footer">
                    <span className="document-author">
                      {doc.creatorFirstName && doc.creatorLastName
                        ? `${doc.creatorFirstName} ${doc.creatorLastName}`
                        : doc.creatorEmail}
                    </span>
                    <span className="document-separator">•</span>
                    <span className="document-date">
                      {formatDate(doc.lastModified)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="quick-actions-section">
        <h2>{t('landing.quickActions')}</h2>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-card"
            onClick={() => navigate('/dashboard')}
          >
            <div className="quick-action-icon">📊</div>
            <div className="quick-action-title">{t('landing.viewDashboard')}</div>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => navigate('/documents')}
          >
            <div className="quick-action-icon">📄</div>
            <div className="quick-action-title">{t('landing.browseDocuments')}</div>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => navigate('/revisioner')}
          >
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-title">{t('landing.viewAudits')}</div>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => navigate('/ncr')}
          >
            <div className="quick-action-icon">⚠️</div>
            <div className="quick-action-title">{t('landing.viewNCRs')}</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
