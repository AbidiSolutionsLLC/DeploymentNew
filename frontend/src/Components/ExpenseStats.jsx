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
            className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] p-4 border border-white/50 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${stat.textColor} opacity-60`}>
                {stat.title}
              </p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon size={16} className={stat.iconColor} />
              </div>
            </div>

            <p className={`text-xl font-bold ${stat.textColor}`}>
              {stat.value}
            </p>

            <p className={`text-[10px] font-bold mt-0.5 opacity-50 ${stat.textColor} uppercase tracking-tight`}>
              {stat.subValue}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseStats;