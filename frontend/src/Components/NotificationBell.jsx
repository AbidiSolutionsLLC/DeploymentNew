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
        className="relative p-2 rounded-full hover:bg-teal-700 transition-colors duration-200 focus:outline-none"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
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
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1 leading-none"
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
          className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px]">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
                title="Mark all as read"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50" role="list">
            {loading && (
              <li className="p-6 text-center text-sm text-gray-400">
                <div className="inline-block w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Loading...</p>
              </li>
            )}
            {!loading && items.length === 0 && (
              <li className="p-10 text-center text-sm text-gray-400">
                <div className="text-4xl mb-3">🔔</div>
                <p className="font-medium text-gray-500">No notifications yet</p>
                <p className="text-xs mt-1">We'll let you know when something happens.</p>
              </li>
            )}
            {items.slice(0, 20).map((notif) => (
              <li
                key={notif._id}
                onClick={() => handleNotifClick(notif)}
                role="listitem"
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-teal-50 ${
                  !notif.isRead ? 'bg-blue-50/60' : 'bg-white'
                }`}
              >
                {/* Icon */}
                <span className="shrink-0 mt-0.5 text-xl select-none" aria-hidden="true">
                  {getNotificationIcon(notif.type)}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatNotifDate(notif.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-blue-500 flex-none" aria-label="Unread" />
                )}
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="text-xs text-teal-600 hover:text-teal-800 hover:underline font-medium transition-colors"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
