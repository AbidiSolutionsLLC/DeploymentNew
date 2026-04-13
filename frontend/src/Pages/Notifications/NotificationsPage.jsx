import { useEffect, useState, useMemo } from 'react';
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
  const [selectedNotif, setSelectedNotif] = useState(null);
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
    setSelectedNotif(notif);
    if (!notif.isRead) dispatch(markAsRead(notif._id));
    // NOTE: Removed immediate navigation to allow viewing in the master-detail layout.
  };

  const handleBackToList = () => setSelectedNotif(null);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const totalPages = Math.ceil((pagination.total || 0) / limit);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white rounded-2xl my-2">
      {/* --- MASTER LIST SIDEBAR --- */}
      <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-gray-200 flex flex-col transition-all bg-white ${selectedNotif ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filtering Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-lg">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => handleTabChange(idx)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === idx
                    ? 'bg-white text-teal-600 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-20 px-8 text-center">
              <p className="text-sm text-gray-400">No {activeTab === 1 ? 'unread ' : ''}notifications.</p>
            </div>
          )}

          {items.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleClick(notif)}
              className={`relative p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 group border-l-4 ${
                selectedNotif?._id === notif._id 
                  ? 'bg-teal-50/50 border-l-teal-600' 
                  : 'bg-white border-l-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 select-none">
                  {getNotificationIcon(notif.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-0.5">
                    <h3 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5 font-medium">
                      {formatNotifDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                )}
              </div>
              
              {/* Delete on hover */}
              <button
                onClick={(e) => handleDelete(e, notif._id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Pagination in Sidebar */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[10px] font-bold text-gray-400 disabled:opacity-30 hover:text-teal-600 uppercase tracking-tighter"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[10px] font-bold text-gray-400 disabled:opacity-30 hover:text-teal-600 uppercase tracking-tighter"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- DETAIL VIEW PANE --- */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!selectedNotif ? 'hidden md:flex' : 'flex'}`}>
        {selectedNotif ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Detail Header */}
            <div className="bg-white p-4 md:p-6 border-b border-gray-200 flex items-center gap-4">
              <button 
                onClick={handleBackToList}
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-teal-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <span className="text-4xl p-3 bg-gray-50 rounded-2xl">{getNotificationIcon(selectedNotif.type)}</span>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedNotif.title}</h2>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{formatNotifDate(selectedNotif.createdAt)}</p>
                  </div>
                </div>
              </div>
              {/* Hiding Deep Link button for now per request
              <button
                onClick={() => {
                  const route = getRouteForNotification(selectedNotif);
                  if (route) navigate(route);
                }}
                className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-100 transition-all active:scale-95"
              >
                Deep Link →
              </button>
              */}
            </div>

            {/* Detail Body */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-gray-50/50">
              <div className="max-w-3xl mx-auto bg-white p-10 md:p-14 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <h3 className="text-xs font-bold text-teal-600 uppercase tracking-[0.2em] mb-6">Notification Details</h3>
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                  {selectedNotif.message}
                </p>
                
                {/* Specific Action Buttons for Leave/Tickets etc. - REMOVED per user request */}
                
                {/* Reference to Deep Link button hidden as well
                <div className="mt-12 pt-10 border-t border-gray-100 italic text-sm text-gray-400 font-medium leading-relaxed">
                  Use the "Deep Link" button above to view full context and take actions in the relevant module.
                </div>
                */}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-[30%] rotate-12 flex items-center justify-center mb-8 shadow-2xl shadow-gray-200 border border-gray-50">
              <svg className="w-10 h-10 text-teal-400 -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Select a notification</h3>
            <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">Choose an item from the list to view its full content and available actions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
