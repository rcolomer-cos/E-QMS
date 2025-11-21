import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/userService';
import { User } from '../types';
import AvatarUpload from '../components/AvatarUpload';
import { useTranslation } from 'react-i18next';
import '../styles/UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUploadSuccess = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatarUrl });
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!user) {
    return <div className="error-message">User not found</div>;
  }

  return (
    <div className="page user-profile">
      <div className="page-header">
        <h1>User Profile</h1>
      </div>

      <div className="user-profile-content">
        <div className="user-profile-section">
          <h2>Avatar</h2>
          <AvatarUpload user={user} onUploadSuccess={handleAvatarUploadSuccess} />
        </div>

        <div className="user-profile-section">
          <h2>Personal Information</h2>
          <div className="user-profile-info">
            <div className="info-row">
              <label>Name:</label>
              <span>{user.firstName} {user.lastName}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            {user.department && (
              <div className="info-row">
                <label>Department:</label>
                <span>{user.department}</span>
              </div>
            )}
            {user.phone && (
              <div className="info-row">
                <label>Phone:</label>
                <span>{user.phone}</span>
              </div>
            )}
            {user.roleNames && user.roleNames.length > 0 && (
              <div className="info-row">
                <label>Roles:</label>
                <span>{user.roleNames.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
