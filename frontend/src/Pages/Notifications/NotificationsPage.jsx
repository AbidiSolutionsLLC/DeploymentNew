import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../slices/notificationSlice';
import { getNotificationIcon, getRouteForNotification, formatNotifDate } from '../../utils/notificationUtils';
import NotificationItem from '../../Components/NotificationItem';



export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, pagination, unreadCount, loading } = useSelector((s) => s.notifications);

  const [searchParams, setSearchParams] = useSearchParams();
  
  const notifId = searchParams.get('id');
  
  const [page, setPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const limit = 20;

  // Sync selectedNotif with URL 'id'
  useEffect(() => {
    if (notifId && items.length > 0) {
      const found = items.find(n => n._id === notifId);
      if (found) setSelectedNotif(found);
    } else if (!notifId) {
      setSelectedNotif(null);
    }
  }, [notifId, items]);

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit }));
  }, [page, dispatch]);

  const handleClick = (notif) => {
    setSearchParams({ id: notif._id });
    if (!notif.isRead) dispatch(markAsRead(notif._id));
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const totalPages = Math.ceil((pagination.total || 0) / limit);

  return (
    <div className="flex h-[calc(100vh-84px)] overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl mx-4 my-4">
      {/* --- MASTER LIST SIDEBAR --- */}
      <div className={`w-full md:w-[380px] lg:w-[440px] border-r border-slate-200/60 flex flex-col transition-all bg-white/80 ${selectedNotif ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Stay updated with your activities</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="px-3 py-1.5 text-[10px] font-black text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg uppercase tracking-tighter transition-all"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {loading && items.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Inbox...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-32 px-10 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl opacity-20">📭</span>
              </div>
              <h3 className="text-slate-800 font-bold mb-1">Your inbox is empty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Notifications will appear here when events occur in the system.</p>
            </div>
          )}

          <div className="divide-y divide-slate-50">
            {items.map((notif) => (
              <NotificationItem
                key={notif._id}
                notif={notif}
                onClick={handleClick}
                isSelected={selectedNotif?._id === notif._id}
              >
                {/* Delete on hover */}
                <button
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </NotificationItem>
            ))}
          </div>

          {/* Pagination in Sidebar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 sticky bottom-0 backdrop-blur-md">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-[10px] font-black text-slate-500 disabled:opacity-30 hover:text-teal-600 hover:bg-white rounded-xl uppercase tracking-widest transition-all border border-transparent hover:border-slate-200"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
                {page} <span className="mx-1 text-slate-200">/</span> {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-[10px] font-black text-slate-500 disabled:opacity-30 hover:text-teal-600 hover:bg-white rounded-xl uppercase tracking-widest transition-all border border-transparent hover:border-slate-200"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- DETAIL VIEW PANE --- */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!selectedNotif ? 'hidden md:flex' : 'flex'}`}>
        {selectedNotif ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Detail Header */}
            <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 border-b border-slate-200/60 flex items-center gap-6">
              <button 
                onClick={handleBackToList}
                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-teal-600 bg-slate-50 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="shrink-0 w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-5xl shadow-inner border border-white">
                {getNotificationIcon(selectedNotif.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedNotif.title}</h2>
                  <button 
                    onClick={handleBackToList}
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                    title="Close detail"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-teal-500/10 text-teal-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-teal-500/10">
                    System Alert
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{formatNotifDate(selectedNotif.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Detail Body */}
            <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-white/50">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white p-12 md:p-20 rounded-[48px] shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                  {/* Decorative background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/30 rounded-full -ml-32 -mb-32 blur-3xl" />
                  
                  <div className="relative">
                    <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-10 pb-4 border-b border-slate-50 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      Detailed Log Entry
                    </h3>
                    
                    <p className="text-slate-800 leading-[1.8] text-xl whitespace-pre-wrap font-bold tracking-tight">
                      {selectedNotif.message}
                    </p>
                    
                    <div className="mt-16 pt-12 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Security & Context</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Notification ID</p>
                          <p className="text-xs font-mono text-slate-600 break-all">{selectedNotif._id}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Recieved At</p>
                          <p className="text-xs font-bold text-slate-600">{new Date(selectedNotif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Visual indicator of "all read" status */}
                <div className="mt-8 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">End of Notification Detail</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/30 backdrop-blur-sm">
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-[40px] rotate-[15deg] flex items-center justify-center mb-10 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-slate-100 group">
                <svg className="w-12 h-12 text-slate-300 -rotate-[15deg] transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                <span className="text-lg font-black">?</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">SELECT A NOTIFICATION</h3>
            <p className="text-sm text-slate-500 max-w-sm font-bold leading-relaxed uppercase tracking-widest opacity-60">Choose an item from your inbox to view full context and event logs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
