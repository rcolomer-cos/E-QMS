import { useToast } from '../contexts/ToastContext';
import '../styles/Toast.css';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div 
      className="toast-container" 
      role="region" 
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast toast-${t.type}`} 
          onClick={() => dismiss(t.id)} 
          role="alert" 
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <span className="toast-message">{t.message}</span>
          <button 
            className="toast-close" 
            aria-label="Dismiss notification" 
            onClick={(e) => { 
              e.stopPropagation(); 
              dismiss(t.id); 
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
