import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { markAsRead, markAllAsRead } from "../slices/notificationSlice";
import { getRouteForNotification } from "../utils/notificationUtils";
import NotificationItem from "./NotificationItem";

const NotificationPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector((s) => s.notifications);
  const { user: authUser } = useSelector((s) => s.auth);
  const userRole = authUser?.user?.role || authUser?.role || '';

  if (!isOpen) return null;

  const handleNotifClick = (notif) => {
    if (!notif.isRead) dispatch(markAsRead(notif._id));
    const route = getRouteForNotification(notif, userRole);
    if (route) navigate(route);
    onClose();
  };

  const handleMarkAll = () => {
    dispatch(markAllAsRead());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
      
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* PANEL */}
      <div className="relative w-full max-w-md h-full bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-teal-500 text-white text-[10px] font-black rounded-full px-2 py-0.5 shadow-sm">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Recent activity stream</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAll}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                title="Mark all as read"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing...</p>
            </div>
          ) : items.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {items.map((item) => (
                <NotificationItem 
                  key={item._id} 
                  notif={item} 
                  onClick={handleNotifClick}
                  isDense={true} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 p-10 text-center">
              <div className="w-20 h-20 bg-white rounded-[40px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <span className="text-4xl opacity-20">🔔</span>
              </div>
              <h3 className="text-slate-800 font-bold mb-1">No notifications</h3>
              <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-widest">You're all caught up for now</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => { navigate('/notifications'); onClose(); }}
            className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Manage Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;