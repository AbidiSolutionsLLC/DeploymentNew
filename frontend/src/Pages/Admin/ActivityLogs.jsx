import React, { useState, useMemo } from "react";
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([
    {
      id: "1",
      timestamp: "May 10, 2025 8:29 AM FDT",
      category: "Notifications",
      activity: "Sent email notification to user",
      status: "Success",
      date: "2025-05-10"
    },
    {
      id: "2",
      timestamp: "May 11, 2025 2:15 PM FDT",
      category: "System",
      activity: "Database backup completed",
      status: "Success",
      date: "2025-05-11"
    },
    {
      id: "3",
      timestamp: "May 12, 2025 9:00 AM FDT",
      category: "API",
      activity: "Failed authentication attempt from IP 192.168.1.1",
      status: "Warning",
      date: "2025-05-12"
    },
    {
      id: "4",
      timestamp: "May 13, 2025 6:45 AM FDT",
      category: "Auth",
      activity: "User 'admin' logged in",
      status: "Success",
      date: "2025-05-13"
    },
    {
      id: "5",
      timestamp: "May 14, 2025 1:30 PM FDT",
      category: "Security",
      activity: "Permission change for 'Role: Editor'",
      status: "Critical",
      date: "2025-05-14"
    }
  ]);

  const [filterValues, setFilterValues] = useState({
    search: "",
    category: "All",
    status: "All"
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !filterValues.search || 
        log.activity.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        log.category.toLowerCase().includes(filterValues.search.toLowerCase());
      
      const matchesCategory = filterValues.category === "All" || 
        log.category === filterValues.category;
      
      const matchesStatus = filterValues.status === "All" || 
        log.status === filterValues.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [logs, filterValues]);

  const columns = [
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{row.timestamp}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.date}</span>
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100">
          {row.category}
        </span>
      )
    },
    {
      key: "activity",
      label: "Activity Log",
      sortable: true,
      render: (row) => (
        <p className="text-sm text-slate-600 font-medium max-w-[400px] truncate" title={row.activity}>
          {row.activity}
        </p>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
          row.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          row.status === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  const filterConfig = [
    { name: "search", type: "search", placeholder: "Search activities or categories..." },
    { 
      name: "category", 
      type: "select", 
      options: ["All", "Notifications", "System", "API", "Auth", "Security"] 
    },
    { 
      name: "status", 
      type: "select", 
      options: ["All", "Success", "Warning", "Critical"] 
    }
  ];

  return (
    <div className="min-h-screen bg-transparent p-4">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">System Activity Logs</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Track and audit system-wide events
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filterValues}
        onChange={(name, value) => setFilterValues(prev => ({ ...prev, [name]: value }))}
        onReset={() => setFilterValues({ search: "", category: "All", status: "All" })}
        totalResults={filteredLogs.length}
      />

      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <DataTable
          columns={columns}
          data={filteredLogs}
          emptyMessage="No activity logs found for the selected criteria."
        />
      </div>
    </div>
  );
};

export default ActivityLogs;
 
 