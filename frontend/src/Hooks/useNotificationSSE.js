import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addRealtimeNotification, fetchUnreadCount } from '../slices/notificationSlice';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/web';

// Shared MSAL instance (same config as axios.js uses)
const msalInstance = new PublicClientApplication(msalConfig);
let msalReady = false;

/**
 * Establishes a Server-Sent Events connection once the user is authenticated.
 * Dispatches addRealtimeNotification on each new pushed notification.
 * Auto-reconnects on error with 5s delay.
 *
 * @param {boolean} isAuthenticated - Whether the user is currently authenticated
 */
export const useNotificationSSE = (isAuthenticated) => {
  const dispatch = useDispatch();
  const sourceRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = async () => {
    try {
      if (!msalReady) {
        await msalInstance.initialize();
        msalReady = true;
      }

      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount() || accounts[0];
      if (!activeAccount) return;

      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: activeAccount,
      });

      const token = tokenResponse.accessToken;
      if (!token) return;

      // Close any existing connection
      if (sourceRef.current) {
        sourceRef.current.close();
      }

      const url = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
      const source = new EventSource(url);
      sourceRef.current = source;

      source.onopen = () => {
        console.log('[SSE] Notification stream connected.');
        // Refresh unread count on reconnect
        dispatch(fetchUnreadCount());
      };

      source.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          // Ignore system events like CONNECTED confirmation
          if (!notification._id) return;

          dispatch(addRealtimeNotification(notification));

          // Native browser notification when tab is not focused
          if (
            typeof window !== 'undefined' &&
            window.Notification &&
            window.Notification.permission === 'granted' &&
            document.hidden
          ) {
            new window.Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
            });
          }
        } catch {
          // Heartbeat comment lines (": heartbeat") will cause parse errors — ignore them
        }
      };

      source.onerror = () => {
        console.warn('[SSE] Connection lost. Reconnecting in 5s...');
        source.close();
        sourceRef.current = null;
        reconnectTimer.current = setTimeout(() => {
          if (isAuthenticated) connect();
        }, 5000);
      };
    } catch (err) {
      console.error('[SSE] Failed to establish connection:', err.message);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    connect();

    // Request browser notification permission on mount (requires user gesture — best effort)
    if (typeof window !== 'undefined' && window.Notification && window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {});
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
};
