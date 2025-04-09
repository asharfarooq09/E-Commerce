
import React, { useContext } from 'react';
import ToastContext from '../contexts/ToastContext';
import { Check, X } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast ${toast.type} ${toast.closing ? 'closing' : ''}`}
        >
          {toast.type === 'success' && <Check className="toast-icon" />}
          <span>{toast.message}</span>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
