import { useToast } from '../contexts/ToastContext';
import '../styles/Toast.css';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)} role="status" aria-live="polite">
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
