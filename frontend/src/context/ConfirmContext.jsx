import React, { createContext, useContext, useState, useCallback } from 'react';
import GlassModal from '../components/ui/GlassModal';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: 'Confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: true,
    resolve: null,
    onConfirmAction: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback(({ title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = true, onConfirmAction = null }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        resolve,
        onConfirmAction
      });
    });
  }, []);

  const handleConfirm = async () => {
    if (confirmState.onConfirmAction) {
      setIsLoading(true);
      try {
        await confirmState.onConfirmAction();
        if (confirmState.resolve) confirmState.resolve(true);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      } catch (err) {
        if (confirmState.resolve) confirmState.resolve(false);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (confirmState.resolve) confirmState.resolve(true);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleCancel = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <GlassModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        title={confirmState.title}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-colors theme-settings-item border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}
            >
              {confirmState.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-bold text-white shadow-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[100px] ${
                confirmState.isDanger ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              }`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {!isLoading && confirmState.confirmText}
            </button>
          </div>
        }
        maxWidth="max-w-sm"
      >
        <div className="text-center py-4">
          {confirmState.isDanger && (
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          )}
          <p className="text-sm px-2 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {confirmState.message}
          </p>
        </div>
      </GlassModal>
    </ConfirmContext.Provider>
  );
};
