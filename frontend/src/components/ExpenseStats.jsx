import React from "react";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import "../styles/adminPortal.css";

const ExpenseStats = ({ stats }) => {
 const statCards = [
 {
 title: "Total Expenses",
 value: stats.total,
 subValue: `$${stats.totalAmount.toFixed(2)}`,
 icon: DollarSign,
 textColor: "text-main",
 iconColor: "text-main",
 iconBg: "bg-app",
 accent: "#64748B"
 },
 {
 title: "Pending",
 value: stats.pending,
 subValue: `$${stats.pendingAmount.toFixed(2)}`,
 icon: Clock,
 textColor: "text-amber-600 dark:text-amber-400",
 iconColor: "text-amber-600 dark:text-amber-400",
 iconBg: "bg-amber-100 dark:bg-amber-900/40",
 accent: "#F59E0B"
 },
 {
 title: "Approved",
 value: stats.approved,
 subValue: `$${stats.approvedAmount.toFixed(2)}`,
 icon: CheckCircle,
 textColor: "text-emerald-600 dark:text-emerald-400",
 iconColor: "text-emerald-600 dark:text-emerald-400",
 iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
 accent: "#10B981"
 },
 {
 title: "Rejected",
 value: stats.rejected,
 subValue: `$${(
 stats.totalAmount -
 stats.approvedAmount -
 stats.pendingAmount
 ).toFixed(2)}`,
 icon: XCircle,
 textColor: "text-rose-600 dark:text-rose-400",
 iconColor: "text-rose-600 dark:text-rose-400",
 iconBg: "bg-rose-100 dark:bg-rose-900/40",
 accent: "#F43F5E"
 }
 ];

 return (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {statCards.map((stat, index) => {
 const Icon = stat.icon;

 return (
 <div key={index} className="glass-card p-4 flex items-center justify-between">
 <div>
 <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.textColor} opacity-60`}>
 {stat.title}
 </p>
 <p className={`text-2xl font-black ${stat.textColor}`}>
 {stat.value}
 </p>
 <p className={`text-[10px] font-bold mt-0.5 opacity-50 ${stat.textColor} uppercase tracking-tight`}>
 {stat.subValue}
 </p>
 </div>
 <div
 className={`lm-ico-ring w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} flex-shrink-0`}
 style={{ "--lm-accent": stat.accent }}
 >
 <span className="lm-glow" aria-hidden="true" />
 <Icon size={20} className={`relative z-[2] ${stat.iconColor}`} />
 </div>
 </div>
 );
 })}
 </div>
 );
};

export default ExpenseStats;