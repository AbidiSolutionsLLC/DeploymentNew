import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[10000] px-6 py-4 rounded-xl shadow-lg ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white font-medium animate-slideIn`}>
    <div className="flex items-center gap-3">
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        <FaTimes />
      </button>
    </div>
  </div>
);

export default Toast;
