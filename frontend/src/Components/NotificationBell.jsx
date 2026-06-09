import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../slices/notificationSlice';
import { getNotificationIcon, getRouteForNotification, formatNotifDate } from '../../utils/notificationUtils';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector((s) => s.notifications);
  const { user: authUser } = useSelector((s) => s.auth);
  const userRole = authUser?.user?.role || authUser?.role || '';
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Load notifications and badge count on mount
  useEffect(() => {
    dispatch(fetchUnreadCount());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    if (!notif.isRead) dispatch(markAsRead(notif._id));
    const route = getRouteForNotification(notif, userRole);
    if (route) navigate(route);
    setOpen(false);
  };

  const handleMarkAll = (e) => {
    e.stopPropagation();
    dispatch(markAllAsRead());
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-xl transition-all duration-300 focus:outline-none ${
          open 
            ? 'bg-teal-600/20 ring-2 ring-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
            : 'hover:bg-teal-700/50'
        }`}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-5.5 h-5.5 transition-transform duration-300 ${open ? 'scale-110' : 'group-hover:rotate-12'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-primary shadow-sm leading-none animate-in zoom-in duration-300"
            aria-live="polite"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 mt-3 w-96 backdrop-blur-xl bg-white/95 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 z-[200] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/50">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-teal-500 text-white text-[10px] font-extrabold rounded-full px-2 py-0.5 shadow-sm shadow-teal-200">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-[11px] text-teal-600 hover:text-teal-700 font-bold uppercase tracking-wider transition-all hover:translate-y-[-1px] active:translate-y-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 divide-y divide-slate-50" role="list">
            {loading && items.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="font-medium">Refreshing stream...</p>
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100/50">
                  <span className="text-3xl opacity-50">🔔</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1.5 px-6 leading-relaxed">
                  We'll notify you here when there's an update to your tasks, leaves, or tickets.
                </p>
              </div>
            )}
            {items.slice(0, 20).map((notif) => (
              <NotificationItem
                key={notif._id}
                notif={notif}
                onClick={handleNotifClick}
                isDense={true}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="group text-xs text-teal-600 hover:text-teal-700 font-bold uppercase tracking-widest transition-all"
            >
              See all notifications
              <span className="inline-block transition-transform group-hover:translate-x-1 ml-1.5">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
