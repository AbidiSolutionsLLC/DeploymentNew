/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import GlassModal from '../components/ui/GlassModal';
import GlassButton from '../components/ui/GlassButton';

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
      } catch {
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
            <GlassButton variant="secondary" onClick={handleCancel} disabled={isLoading}>
              {confirmState.cancelText}
            </GlassButton>
            <GlassButton
              variant={confirmState.isDanger ? "danger" : "primary"}
              onClick={handleConfirm}
              isLoading={isLoading}
              className="min-w-[100px]"
            >
              {confirmState.confirmText}
            </GlassButton>
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
