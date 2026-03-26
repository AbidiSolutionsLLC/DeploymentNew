import React from "react";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";

const ExpenseStats = ({ stats }) => {
  const statCards = [
    {
      title: "Total Expenses",
      value: stats.total,
      subValue: `$${stats.totalAmount.toFixed(2)}`,
      icon: DollarSign,
      textColor: "text-slate-800",
      iconColor: "text-slate-700",
      iconBg: "bg-slate-200"
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white/90 rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              
              {/* TITLE */}
              <p className={`text-[10px] font-black uppercase tracking-widest ${stat.textColor}`}>
                {stat.title}
              </p>

              {/* ICON WITH BACKGROUND */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <Icon size={16} className={stat.iconColor} />
              </div>
            </div>

            {/* VALUE */}
            <p className={`text-2xl font-black ${stat.textColor}`}>
              {stat.value}
            </p>

            {/* SUB VALUE */}
            <p className={`text-xs font-bold mt-1 opacity-60 ${stat.textColor}`}>
              {stat.subValue}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseStats;