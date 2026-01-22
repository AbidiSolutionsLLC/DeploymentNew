import React from "react";

const UserManagementTable = ({ users, }) => {
  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                {["ID", "Name", "Email", "Department", "Role", "Status"].map(
                  (header, index) => (
                    <th
                      key={index}
                      className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-200 group"
                  >
                    <td className="p-4 text-sm font-medium text-slate-500">
                      #{user.id}
                    </td>
                    <td className="p-4">
   
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </span>
                    
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {user.department}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === "Admin"
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                            }`}
                        ></span>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {[...Array(6)].map((__, colIndex) => (
                      <td key={colIndex} className="p-4">
                        <div className="h-5 bg-slate-100/70 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
      {/* Summary Footer */}
      <div className="mt-4 pt-4 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Active:{" "}
                <span className="text-slate-800">
                  {users.filter((u) => u.status === "Active").length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Inactive:{" "}
                <span className="text-slate-800">
                  {users.filter((u) => u.status === "Inactive").length}
                </span>
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Total Users: <span className="text-slate-800">{users.length}</span>
          </div>
        </div>
      </div>

    </>
  );
};

export default UserManagementTable;