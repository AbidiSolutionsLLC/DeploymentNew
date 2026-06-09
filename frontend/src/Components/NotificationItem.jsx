import { getNotificationIcon, formatNotifDate } from '../utils/notificationUtils';

export default function NotificationItem({ notif, onClick, isDense = false, children, isSelected = false }) {
  return (
    <div
      onClick={() => onClick(notif)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(notif); } }}
      role="button"
      tabIndex={0}
      aria-label={`${notif.isRead ? 'Read' : 'Unread'} notification: ${notif.title}`}
      className={`group relative flex items-start gap-4 cursor-pointer transition-all duration-300 border-l-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:z-10 ${
        isDense ? 'px-4 py-3' : 'px-6 py-5'
      } ${
        isSelected
          ? 'bg-teal-50/40 border-l-teal-600'
          : !notif.isRead 
            ? 'bg-white border-l-teal-400/30 hover:bg-slate-50' 
            : 'bg-white border-l-transparent hover:bg-slate-50'
      }`}
    >
      {/* Icon Container */}
      <div className={`shrink-0 flex items-center justify-center rounded-2xl shadow-sm border transition-all duration-300 group-hover:scale-110 ${
        isDense ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'
      } ${
        !notif.isRead ? 'bg-white border-teal-100' : 'bg-slate-50 border-slate-100'
      }`}>
        <span className="select-none" aria-hidden="true">
          {getNotificationIcon(notif.type)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className={`truncate tracking-tight transition-colors ${
            isDense ? 'text-sm' : 'text-base'
          } ${
            !notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'
          }`}>
            {notif.title}
          </h4>
          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
            )}
            <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {formatNotifDate(notif.createdAt)}
            </span>
          </div>
        </div>
        
        <p className={`line-clamp-2 leading-relaxed font-medium transition-colors ${
          isDense ? 'text-[12px]' : 'text-sm'
        } ${
          !notif.isRead ? 'text-slate-700' : 'text-slate-500'
        }`}>
          {notif.message}
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          {notif.type.startsWith('LEAVE') && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase border border-blue-100">Leave</span>
          )}
          {notif.type.startsWith('EXPENSE') && (
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded uppercase border border-amber-100">Expense</span>
          )}
          {notif.type.startsWith('TICKET') && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black rounded uppercase border border-purple-100">Ticket</span>
          )}
          {notif.type.startsWith('TASK') && (
            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded uppercase border border-rose-100">Task</span>
          )}
          {notif.type.startsWith('PROJECT') && (
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase border border-indigo-100">Project</span>
          )}
          {notif.type.includes('TIMESHEET') && (
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase border border-emerald-100">Timesheet</span>
          )}
          {notif.type.startsWith('USER') && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[8px] font-black rounded uppercase border border-slate-100">System</span>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
