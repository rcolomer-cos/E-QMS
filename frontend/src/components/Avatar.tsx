import { User } from '../types';
import '../styles/Avatar.css';

interface AvatarProps {
  user: User | { firstName?: string; lastName?: string; avatarUrl?: string };
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  showName?: boolean;
}

const Avatar = ({ user, size = 'medium', className = '', showName = false }: AvatarProps) => {
  const getInitials = () => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || '?';
  };

  const getBackgroundColor = () => {
    // Generate a consistent color based on the user's name
    const name = `${user.firstName || ''}${user.lastName || ''}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  const apiUrl = typeof window !== 'undefined' ? (window as any).ENV?.VITE_API_URL || 'http://localhost:3001' : 'http://localhost:3001';
  const avatarUrl = user.avatarUrl ? `${apiUrl}${user.avatarUrl}` : null;

  return (
    <div className={`avatar-container ${className}`}>
      <div className={`avatar avatar-${size}`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`${user.firstName} ${user.lastName}`}
            className="avatar-image"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundColor = getBackgroundColor();
                parent.innerHTML = `<span class="avatar-initials">${getInitials()}</span>`;
              }
            }}
          />
        ) : (
          <div 
            className="avatar-initials-container" 
            style={{ backgroundColor: getBackgroundColor() }}
          >
            <span className="avatar-initials">{getInitials()}</span>
          </div>
        )}
      </div>
      {showName && (
        <span className="avatar-name">
          {user.firstName} {user.lastName}
        </span>
      )}
    </div>
  );
};

export default Avatar;
