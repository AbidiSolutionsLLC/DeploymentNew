import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../slices/notificationSlice';
import { getNotificationIcon, getRouteForNotification, formatNotifDate } from '../../utils/notificationUtils';

const TABS = ['All', 'Unread'];

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, pagination, unreadCount, loading } = useSelector((s) => s.notifications);

  const [activeTab, setActiveTab] = useState(0); // 0 = All, 1 = Unread
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const params = { page, limit };
    if (activeTab === 1) params.isRead = false;
    dispatch(fetchNotifications(params));
  }, [activeTab, page, dispatch]);

  const handleTabChange = (idx) => {
    setActiveTab(idx);
    setPage(1);
  };

  const handleClick = (notif) => {
    if (!notif.isRead) dispatch(markAsRead(notif._id));
    const route = getRouteForNotification(notif);
    if (route) navigate(route);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const totalPages = Math.ceil((pagination.total || 0) / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllAsRead())}
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium border border-teal-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => handleTabChange(idx)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === idx
                  ? 'border-b-2 border-teal-600 text-teal-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'Unread' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` : tab}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-2">
          {loading && (
            <div className="py-16 text-center text-gray-400">
              <div className="inline-block w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 1 ? '✅' : '🔔'}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {activeTab === 1 ? "You're all caught up!" : 'No notifications yet'}
              </h3>
              <p className="text-sm text-gray-400">
                {activeTab === 1 ? 'No unread notifications at the moment.' : "We'll notify you when something happens."}
              </p>
            </div>
          )}

          {items.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleClick(notif)}
              className={`group relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-200 ${
                !notif.isRead
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-white border-gray-100'
              }`}
            >
              {/* Icon */}
              <span className="text-2xl shrink-0 mt-0.5 select-none" aria-hidden="true">
                {getNotificationIcon(notif.type)}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-snug ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                    {formatNotifDate(notif.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>

              {/* Unread indicator */}
              {!notif.isRead && (
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-none" aria-label="Unread" />
              )}

              {/* Delete button (visible on hover) */}
              <button
                onClick={(e) => handleDelete(e, notif._id)}
                className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1 rounded"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
