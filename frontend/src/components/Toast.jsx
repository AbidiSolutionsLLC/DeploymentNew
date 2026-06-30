import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

const Toast = ({ message, type, onClose }) => {
  const toastContent = (
    <div className={`fixed top-4 right-4 z-[999999] px-6 py-4 rounded-xl shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-medium animate-slideIn`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="btn-ghost">
          <FaTimes />
        </button>
      </div>
    </div>
  );
  
  return createPortal(toastContent, document.body);
};

export default Toast;
