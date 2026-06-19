import React from "react";
import GlassTable from "./ui/GlassTable";
import GlassCard from "./ui/GlassCard";

const UserManagementTable = ({ users }) => {
  const headers = ["ID", "Name", "Email", "Department", "Role", "Status"];

  return (
    <>
      <GlassCard noPadding className="w-full mb-4 overflow-hidden">
        <div className="overflow-x-auto">
          <GlassTable headers={headers}>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={index}
                  className="group hover:bg-surface/50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <td className="p-4 text-sm font-medium text-muted dark:text-slate-400">
                    #{user.empID || user.id}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-heading dark:text-white group-hover:text-brand-primary transition-colors">
                      {user.name}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-muted dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-muted bg-surface/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-border-subtle dark:border-slate-700">
                      {user.department?.name || user.department || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        user.role === "Admin"
                          ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                          : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        user.empStatus === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                          : user.empStatus === "Pending" 
                          ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
                          : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.empStatus === "Active"
                            ? "bg-emerald-500"
                            : user.empStatus === "Pending" ? "bg-amber-500" : "bg-rose-500"
                        }`}
                      ></span>
                      {user.empStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              [...Array(5)].map((_, index) => (
                <tr key={index}>
                  {[...Array(6)].map((__, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <div className="h-5 bg-surface/50 dark:bg-slate-800/50 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </GlassTable>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-xs font-bold text-muted dark:text-slate-400 uppercase tracking-wide">
                Active:{" "}
                <span className="text-heading dark:text-white">
                  {users.filter((u) => u.empStatus === "Active").length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
              <span className="text-xs font-bold text-muted dark:text-slate-400 uppercase tracking-wide">
                Inactive:{" "}
                <span className="text-heading dark:text-white">
                  {users.filter((u) => u.empStatus === "Inactive").length}
                </span>
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-muted dark:text-slate-400 uppercase tracking-wide">
            Total Users: <span className="text-heading dark:text-white">{users.length}</span>
          </div>
        </div>
      </GlassCard>
    </>
  );
};

export default UserManagementTable;