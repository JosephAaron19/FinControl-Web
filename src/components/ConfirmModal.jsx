import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, type = 'danger', onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon-title">
            <AlertTriangle className={`confirm-modal-icon ${type}`} size={20} />
            <h3>{title || 'Confirmar Acción'}</h3>
          </div>
          <button className="confirm-modal-close-btn" onClick={onCancel} title="Cerrar" type="button">
            <X size={16} />
          </button>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-confirm-cancel" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button 
            className={`btn-confirm-accept ${isDanger ? 'danger' : 'primary'}`} 
            onClick={onConfirm} 
            type="button"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
