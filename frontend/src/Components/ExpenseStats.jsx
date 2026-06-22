import React from "react";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";

const ExpenseStats = ({ stats }) => {
 const statCards = [
 {
 title: "Total Expenses",
 value: stats.total,
 subValue: `$${stats.totalAmount.toFixed(2)}`,
 icon: DollarSign,
 textColor: "text-main",
 iconColor: "text-main",
 iconBg: "bg-app"
 },
 {
 title: "Pending",
 value: stats.pending,
 subValue: `$${stats.pendingAmount.toFixed(2)}`,
 icon: Clock,
 textColor: "text-amber-600",
 iconColor: "text-amber-600",
 iconBg: "bg-amber-100"
 },
 {
 title: "Approved",
 value: stats.approved,
 subValue: `$${stats.approvedAmount.toFixed(2)}`,
 icon: CheckCircle,
 textColor: "text-emerald-600",
 iconColor: "text-emerald-600",
 iconBg: "bg-emerald-100"
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
 textColor: "text-rose-600",
 iconColor: "text-rose-600",
 iconBg: "bg-rose-100"
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
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} flex-shrink-0`}>
 <Icon size={20} className={stat.iconColor} />
 </div>
 </div>
 );
 })}
 </div>
 );
};

export default ExpenseStats;