import React, { useEffect, useState } from "react";
import api from "../../axios";
import { FaPlus, FaEye } from "react-icons/fa";
import HolidayTable from "../../Components/HolidayTable";
import AddHolidayModal from "../../Components/AddHolidayModal";
import Toast from "../../Components/Toast";
import ViewLeaveModal from "../../Components/ViewLeaveModal"; // Import the new modal

const LeaveTrackerAdmin = () => {
  const [departmentLeaveRecord, setDepartmentLeaveRecord] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for holidays

  const [loading, setLoading] = useState({
    leaves: true,
    holidays: true
  });

  // Helper to show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeaves = async () => {
    try {
      const response = await api.get("/leaves");
      const formatted = response.data.data.map((item) => ({
        id: item._id,
        date: new Date(item.startDate).toLocaleDateString(),
        name: item.employeeName,
        email: item.email,
        leaveType: item.leaveType,
        reason: item.reason || "-",
        duration: `${Math.ceil(
          (new Date(item.endDate) - new Date(item.startDate)) /
          (1000 * 60 * 60 * 24) +
          1
        )} days`,
        status: item.status || "Pending",
      }));
      setDepartmentLeaveRecord(formatted);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      showToast("Failed to load leave records", "error");
    } finally {
      setLoading(prev => ({ ...prev, leaves: false }));
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      setHolidays(response.data);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
      showToast("Failed to load holidays", "error");
    } finally {
      setLoading(prev => ({ ...prev, holidays: false }));
    }
  };

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status: newStatus });
      showToast(`Leave status updated to ${newStatus}`);
      
      // Update local state immediately for better UX
      setDepartmentLeaveRecord(prev => 
        prev.map(leave => 
          leave.id === leaveId 
            ? { ...leave, status: newStatus }
            : leave
        )
      );
      
      await fetchLeaves(); // Refresh from server
    } catch (error) {
      console.error(
        "Failed to update status:",
        error.response?.data || error.message
      );
      showToast("Failed to update status", "error");
    }
  };

  const handleHolidayAdded = () => {
    showToast("Holiday added successfully");
    fetchHolidays(); // Refresh holidays table
    setRefreshKey(prev => prev + 1); // Force refresh HolidayTable component
    setIsOpen(false);
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setViewModalOpen(true);
  };

  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
  }, []);

  // Get status color class
  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-2">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* View Leave Modal */}
      {selectedLeave && (
        <ViewLeaveModal
          isOpen={viewModalOpen}
          setIsOpen={setViewModalOpen}
          leaveData={selectedLeave}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Main content area */}
      <div className="space-y-4">
        
        {/* Applied Leave Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Applied Leave</h2>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Leave requests awaiting approval</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                  {[
                    "Date",
                    "ID",
                    "Name",
                    "Email",
                    "Leave Type",
                    "Reason",
                    "Duration",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading.leaves ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      {[...Array(9)].map((__, colIndex) => (
                        <td key={colIndex} className="p-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : departmentLeaveRecord.length > 0 ? (
                  departmentLeaveRecord.map((task, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-700">{task.date}</td>
                      <td className="p-3 text-slate-700 font-mono text-xs">{task.id.substring(0, 8)}...</td>
                      <td className="p-3 text-slate-700 font-medium">{task.name}</td>
                      <td className="p-3 text-slate-600">{task.email}</td>
                      <td className="p-3 text-slate-700">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {task.leaveType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{task.reason}</td>
                      <td className="p-3 text-slate-700 font-medium">{task.duration}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleViewLeave(task)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                        >
                          <FaEye size={12} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">No leave requests found</p>
                        <p className="text-xs text-slate-400">All leave requests are processed</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Upcoming Holidays & Leaves</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-1">Company holidays and scheduled leaves</p>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#64748b] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:brightness-110 transition-all shadow-sm hover:shadow-md"
            >
              <FaPlus size={14} />
              Add Holidays
            </button>
          </div>

          {loading.holidays ? (
            <div className="text-center p-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
            </div>
          ) : (
            <HolidayTable holidays={holidays} key={refreshKey} />
          )}
        </div>
      </div>

      {/* Holiday Modal */}
      <AddHolidayModal 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        onHolidayAdded={handleHolidayAdded}
      />
    </div>
  );
};

export default LeaveTrackerAdmin;