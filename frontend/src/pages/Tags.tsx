import { useAuth } from '../services/authService';
import TagManager from '../components/TagManager';

function Tags() {
  const { user } = useAuth();

  // Check if user is admin, manager, or superuser
  if (user?.role !== 'admin' && user?.role !== 'manager' && user?.role !== 'superuser') {
    return (
      <div className="page-container">
        <div className="error-message">
          You do not have permission to access this page. Only administrators and managers can manage tags.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TagManager />
    </div>
  );
}

export default Tags;
