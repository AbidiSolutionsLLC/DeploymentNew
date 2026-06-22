import React from 'react';
import { 
 CheckCircleIcon, 
 ExclamationCircleIcon, 
 InformationCircleIcon,
 ClockIcon
} from '@heroicons/react/24/outline';

const ActivityFeed = ({ logs }) => {
 if (!logs || logs.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <div className="w-16 h-16 bg-app rounded-full flex items-center justify-center mb-4">
 <InformationCircleIcon className="w-8 h-8 text-slate-300" />
 </div>
 <p className="text-sm font-bold text-muted uppercase tracking-widest">No recent activity</p>
 </div>
 );
 }

 const getLevelStyles = (level) => {
 switch (level?.toLowerCase()) {
 case 'error': return { icon: ExclamationCircleIcon, color: 'text-rose-500', bg: 'bg-rose-50' };
 case 'warning': return { icon: ExclamationCircleIcon, color: 'text-amber-500', bg: 'bg-amber-50' };
 default: return { icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' };
 }
 };

 return (
 <div className="flow-root">
 <ul className="-mb-8">
 {logs.map((log, logIdx) => {
 const styles = getLevelStyles(log.level);
 const Icon = styles.icon;

 return (
 <li key={logIdx}>
 <div className="relative pb-8">
 {logIdx !== logs.length - 1 ? (
 <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-app" aria-hidden="true" />
 ) : null}
 <div className="relative flex space-x-3">
 <div>
 <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${styles.bg}`}>
 <Icon className={`h-5 w-5 ${styles.color}`} aria-hidden="true" />
 </span>
 </div>
 <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
 <div>
 <p className="text-sm text-main font-medium">
 {log.message}{' '}
 <span className="font-black text-main">{log.user || ''}</span>
 </p>
 </div>
 <div className="whitespace-nowrap text-right text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1">
 <ClockIcon className="w-3 h-3" />
 <time dateTime={log.time}>{log.time}</time>
 </div>
 </div>
 </div>
 </div>
 </li>
 );
 })}
 </ul>
 </div>
 );
};

export default ActivityFeed;
