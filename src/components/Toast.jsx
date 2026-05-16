import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="toast-icon" size={20} />;
      case 'error': return <XCircle className="toast-icon" size={20} />;
      case 'warning': return <AlertTriangle className="toast-icon" size={20} />;
      default: return <Info className="toast-icon" size={20} />;
    }
  };

  return (
    <div className={`toast-item ${type}`}>
      {getIcon()}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
