import React from 'react';

const AdminDashboardStatCard = ({ title, value, icon, gradient, trend, subtext, onClick }) => {
 return (
 <div 
 onClick={onClick}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
 role="button"
 tabIndex={0}
 aria-label={`${title}: ${value}`}
 className={`group relative overflow-hidden bg-surface rounded-3xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2`}
 >
 {/* Decorative Gradient Background */}
 <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${gradient}`} aria-hidden="true" />
 
 <div className="relative z-10 flex flex-col h-full">
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-2xl bg-app text-muted transition-colors group-hover:bg-slate-900 group-hover:text-white`} aria-hidden="true">
 {icon}
 </div>
 {trend && (
 <div 
 className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
 trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
 }`}
 aria-label={`Trend: ${trend.isPositive ? 'Up' : 'Down'} ${trend.value}%`}
 >
 {trend.isPositive ? '↑' : '↓'} {trend.value}%
 </div>
 )}
 </div>

 <div className="mt-auto">
 <p className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1">
 {title}
 </p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-3xl font-black text-main tracking-tighter">
 {value}
 </h3>
 {subtext && (
 <span className="text-[10px] font-bold text-muted">
 {subtext}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Hover Line Detail */}
 <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 bg-gradient-to-r w-0 group-hover:w-full ${gradient}`} />
 </div>
 );
};

export default AdminDashboardStatCard;
