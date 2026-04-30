import React, { useState, useEffect } from "react";
import api from "../../axios";
import {
  Search, Calendar, Clock, User, CheckCircle,
  AlertCircle, XCircle, Download, Edit2, Save, X, Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminAddAttendanceModal from "../../Components/AdminAddAttendanceModal";

// --- SUB-COMPONENT: LIVE TIMER ---
const LiveTimer = ({ startTime }) => {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) return setDuration("00:00:00");

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="text-blue-600 font-mono font-bold tracking-wider">{duration}</span>;
};

// --- MAIN COMPONENT ---
const AdminAttendance = () => {
  const [summaryData, setSummaryData] = useState({ present: [], absent: [], onLeave: [], counts: { present: 0, absent: 0, onLeave: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(() => {
    const savedDate = localStorage.getItem('admin_attendance_date');
    return savedDate ? new Date(savedDate) : new Date();
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('admin_attendance_tab') || "present";
  });
  const [allUsers, setAllUsers] = useState([]);
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({ checkInTime: null, checkOutTime: null, status: "" });

  // Permission State
  const [currentUserRole, setCurrentUserRole] = useState("");

  const fetchSummary = async (date) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get(`/timetrackers/admin-summary?date=${dateStr}`);
      setSummaryData(res.data);
    } catch (error) {
      console.error("Fetch Summary Error:", error);
      toast.error("Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH USER INFO ON MOUNT ---
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userRes = await api.get("/auth/me");
        const role = userRes.data.user.role || "";
        const processedRole = role.replace(/\s+/g, '').toLowerCase();
        setCurrentUserRole(processedRole);
        
        if (processedRole === 'superadmin' || processedRole === 'admin') {
            const allUsersRes = await api.get("/users");
            setAllUsers(allUsersRes.data);
        }
      } catch (error) {
        console.error("User Init Error:", error);
      }
    };
    fetchUserInfo();
  }, []);

  // --- FETCH SUMMARY ON DATE CHANGE ---
  useEffect(() => {
    if (filterDate) {
      fetchSummary(filterDate);
    }
  }, [filterDate]);

  const canEdit = currentUserRole === 'superadmin';

  // --- DOWNLOAD EXCEL (CSV) ---
  const handleDownload = () => {
    const dataToExport = activeTabLogs;
    if (dataToExport.length === 0) {
      toast.warn("No data to download");
      return;
    }

    const isPresentTab = activeTab === "present";
    const headers = isPresentTab 
      ? ["Employee Name", "Email", "Date", "Check In", "Check Out", "Total Hours", "Status"]
      : ["Employee Name", "Email", "Date", "Status"];

    const rows = dataToExport.map(log => {
      const base = [
        `"${log.user?.name || 'Unknown'}"`,
        `"${log.user?.email || 'N/A'}"`,
        new Date(log.date || filterDate).toLocaleDateString(),
        log.status
      ];
      if (isPresentTab) {
        return [
          base[0], base[1], base[2],
          log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "--",
          log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "Active",
          log.totalHours || "--",
          base[3]
        ];
      }
      return base;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${activeTab}_report_${filterDate.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = (log) => {
    setEditingLog(log);
    setEditFormData({
      checkInTime: log.checkInTime ? new Date(log.checkInTime) : null,
      checkOutTime: log.checkOutTime ? new Date(log.checkOutTime) : null,
      status: log.status
    });
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      let updates = { ...editFormData };

      // VALIDATION
      // Auto-clear times for Absent/Leave
      if (updates.status === 'Absent' || updates.status === 'On Leave' || updates.status === 'Leave') {
        updates.checkInTime = null;
        updates.checkOutTime = null;
        updates.totalHours = 0;
      } else {
        const now = new Date();
        if (updates.checkInTime && new Date(updates.checkInTime) > now) {
          return toast.error("Check-in time cannot be in the future");
        }
        if (updates.checkOutTime && new Date(updates.checkOutTime) > now) {
          return toast.error("Check-out time cannot be in the future");
        }

        if (updates.checkInTime && updates.checkOutTime) {
          if (new Date(updates.checkOutTime) <= new Date(updates.checkInTime)) {
            return toast.error("Check-out cannot be before check-in");
          }
        }
        if (!updates.checkInTime && updates.checkOutTime) {
          return toast.error("Check-in is required if check-out is provided");
        }
      }

      // Auto-calc duration if times changed
      if (updates.checkInTime && updates.checkOutTime) {
        const start = new Date(updates.checkInTime);
        const end = new Date(updates.checkOutTime);
        const diffMs = end - start;
        const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        updates.totalHours = totalHours;
      }

      await api.put(`/timetrackers/${editingLog._id}`, updates);
      toast.success("Attendance updated successfully");
      setIsEditModalOpen(false);
      await fetchSummary(filterDate);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update record");
    }
  };

  const handleDeleteRecord = async (logId) => {
    if (!window.confirm("Delete this attendance record permanently?")) return;
    try {
      await api.delete(`/timetrackers/${logId}`);
      toast.success("Record deleted");
      await fetchSummary(filterDate);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete record");
    }
  };

  // --- HELPERS ---
  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={12} /> Present</span>;
      case "Half Day":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertCircle size={12} /> Half Day</span>;
      case "Absent":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200"><XCircle size={12} /> Absent</span>;
      case "On Leave":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Calendar size={12} /> On Leave</span>;
      default:
        return <span className="text-slate-500 text-xs font-bold">{status}</span>;
    }
  };

  const getActiveTabData = () => {
    switch (activeTab) {
      case "present": return summaryData.present.filter(log => log.status !== 'Absent' && log.status !== 'On Leave' && log.status !== 'Leave');
      case "absent": return summaryData.absent;
      case "leave": return summaryData.onLeave;
      default: return [];
    }
  };

  const activeTabLogs = getActiveTabData().filter((log) => {
    const employeeName = log.user?.name || "Unknown";
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Employee Attendance</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Monitor daily check-ins, check-outs, and working hours.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setIsAddAttendanceOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-[11px] font-black uppercase tracking-wide"
            >
              + Check In/Out
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition shadow-lg shadow-slate-200 text-[11px] font-black uppercase tracking-wide"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-2 h-auto sm:h-16">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search Employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="relative sm:w-48">
            <DatePicker
              selected={filterDate}
              onChange={(date) => {
                setFilterDate(date);
                if (date) {
                  localStorage.setItem('admin_attendance_date', date.toISOString());
                } else {
                  localStorage.removeItem('admin_attendance_date');
                }
              }}
              dateFormat="yyyy-MM-dd"
              wrapperClassName="w-full h-full" // Ensure the wrapper fills the div
              className="w-full h-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-600 cursor-pointer"
              placeholderText="Filter by Date"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-0 bg-white border border-slate-100 rounded-xl overflow-hidden divide-x divide-slate-100 shadow-sm">
          <div className="px-2 py-3 flex flex-col justify-center text-center bg-blue-50/30">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">TOTAL</p>
            <p className="text-xl font-black text-slate-700">{summaryData.counts.total}</p>
          </div>
          <div 
            onClick={() => {
              setActiveTab("present");
              localStorage.setItem('admin_attendance_tab', 'present');
            }}
            className={`px-2 py-3 flex flex-col justify-center text-center cursor-pointer transition-all ${activeTab === 'present' ? 'bg-emerald-100/50' : 'bg-emerald-50/30 hover:bg-emerald-50'}`}
          >
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">PRESENT</p>
            <p className="text-xl font-black text-emerald-700">{summaryData.counts.present}</p>
          </div>
          <div 
            onClick={() => {
              setActiveTab("absent");
              localStorage.setItem('admin_attendance_tab', 'absent');
            }}
            className={`px-2 py-3 flex flex-col justify-center text-center cursor-pointer transition-all ${activeTab === 'absent' ? 'bg-rose-100/50' : 'bg-rose-50/30 hover:bg-rose-50'}`}
          >
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">ABSENT</p>
            <p className="text-xl font-black text-rose-700">{summaryData.counts.absent}</p>
          </div>
          <div 
            onClick={() => {
              setActiveTab("leave");
              localStorage.setItem('admin_attendance_tab', 'leave');
            }}
            className={`px-2 py-3 flex flex-col justify-center text-center cursor-pointer transition-all ${activeTab === 'leave' ? 'bg-blue-100/50' : 'bg-blue-50/30 hover:bg-blue-50'}`}
          >
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">LEAVE</p>
            <p className="text-xl font-black text-blue-700">{summaryData.counts.onLeave}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["present", "absent", "leave"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              localStorage.setItem('admin_attendance_tab', t);
            }}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              activeTab === t 
                ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200" 
                : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[30%] min-w-[200px]">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[15%] min-w-[120px]">Date</th>
                {activeTab === "present" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[12%] min-w-[100px]">Check In</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[12%] min-w-[100px]">Check Out</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[12%] min-w-[100px]">Duration</th>
                  </>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[12%] min-w-[100px]">Status</th>
                {canEdit && (
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap w-[7%] min-w-[100px]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={activeTab === 'present' ? (canEdit ? 7 : 6) : (canEdit ? 4 : 3)} className="px-6 py-12 text-center text-slate-400 italic font-medium">Loading attendance data...</td></tr>
              ) : activeTabLogs.length === 0 ? (
                <tr><td colSpan={activeTab === 'present' ? (canEdit ? 7 : 6) : (canEdit ? 4 : 3)} className="px-6 py-12 text-center text-slate-400 italic font-medium">No records found for this category.</td></tr>
              ) : (
                activeTabLogs.map((log) => (
                  <tr key={log._id || log.user?._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                          {log.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{log.user?.name || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{log.user?.designation || "Employee"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(log.date || filterDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {activeTab === "present" && (
                      <>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatTime(log.checkInTime)}</td>
                        <td className="px-6 py-4">
                          {log.checkOutTime ? (
                            <span className="text-sm font-bold text-slate-700">{formatTime(log.checkOutTime)}</span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase tracking-wider">Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {log.checkInTime && log.checkOutTime ? (
                            <span className="text-slate-600">{log.totalHours} hrs</span>
                          ) : (
                            log.checkInTime ? <LiveTimer startTime={log.checkInTime} /> : <span className="text-slate-400 text-xs italic">N/A</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right flex justify-end gap-1">
                        {log._id ? (
                          <>
                            <button onClick={() => handleEditClick(log)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Record">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteRecord(log._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Record">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                           /* For absent/leave virtual records without _id, we can still allow "Add" behavior via edit modal */
                           <button onClick={() => handleEditClick(log)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Add/Update Record">
                             <Edit2 size={16} />
                           </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Edit Attendance</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 ">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check In Time</label>
                <DatePicker
                  selected={editFormData.checkInTime}
                  onChange={(date) => setEditFormData({ ...editFormData, checkInTime: date })}
                  showTimeSelect
                  dateFormat="Pp"
                  wrapperClassName="w-full"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                  popperProps={{ strategy: "fixed" }}
                  portalId="portal-root"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check Out Time</label>
                <DatePicker
                  selected={editFormData.checkOutTime}
                  onChange={(date) => setEditFormData({ ...editFormData, checkOutTime: date })}
                  showTimeSelect
                  dateFormat="Pp"
                  wrapperClassName="w-full"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                  popperProps={{ strategy: "fixed" }}
                  portalId="portal-root"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md shadow-blue-200 flex justify-center items-center gap-2"
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MODALS */}
      {isAddAttendanceOpen && (
          <AdminAddAttendanceModal
              open={isAddAttendanceOpen}
              onClose={() => setIsAddAttendanceOpen(false)}
              onSuccess={() => fetchSummary(filterDate)}
              allUsers={allUsers}
          />
      )}

    </div>
  );
};

export default AdminAttendance;