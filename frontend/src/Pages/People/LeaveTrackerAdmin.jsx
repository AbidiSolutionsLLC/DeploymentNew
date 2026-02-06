import React, { useEffect, useState } from "react";
import api from "../../axios";
import { FaPlus, FaEye } from "react-icons/fa";
import HolidayTable from "../../Components/HolidayTable";
import AddHolidayModal from "../../Components/AddHolidayModal";
import Toast from "../../Components/Toast";
import ViewLeaveModal from "../../Components/ViewLeaveModal";
import ModernSelect from "../../Components/ui/ModernSelect";
import { useSelector } from "react-redux";
 
const LeaveTrackerAdmin = () => {
  const [departmentLeaveRecord, setDepartmentLeaveRecord] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
 
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [leaveBalances, setLeaveBalances] = useState({ pto: 0, sick: 0 });
 
  const [loading, setLoading] = useState({
    leaves: true,
    holidays: true,
    users: true
  });
 
  // Get current user role to determine if they can see Super Admins
  const { user: authUser } = useSelector(state => state.auth);
  const userRole = (authUser?.user?.role || authUser?.role || "").replace(/\s+/g, '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';
 
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
 
  const fetchLeaves = async () => {
    try {
      // FIX: Use /getAllLeaves as defined in allRoutes.js
      const response = await api.get("/getAllLeaves");
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
 
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      // FIX: Super Admin should see everyone. Normal Admin should not see Super Admins.
      let filtered = response.data;
      if (!isSuperAdmin) {
         filtered = response.data.filter(u => u.role !== 'Super Admin');
      }
      setUsers(filtered);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };
 
  const handleUserSelect = async (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    if (!userId) {
      setLeaveBalances({ pto: 0, sick: 0 });
      return;
    }
 
    try {
      const response = await api.get(`/users/${userId}/leaves`);
      setLeaveBalances({
        pto: response.data.pto || 0,
        sick: response.data.sick || 0
      });
    } catch (error) {
      console.error("Failed to fetch user leaves:", error);
      showToast("Failed to fetch user leave balance", "error");
    }
  };
 
  const handleUpdateLeaves = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser}/leaves`, leaveBalances);
      showToast("User leave balance updated successfully");
    } catch (error) {
      console.error("Failed to update leaves:", error);
      showToast("Failed to update leaves", "error");
    }
  };
 
  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      // FIX: Use the update status endpoint
      await api.put(`/leaves/${leaveId}/status`, { status: newStatus });
      showToast(`Leave status updated to ${newStatus}`);
 
      setDepartmentLeaveRecord(prev =>
        prev.map(leave =>
          leave.id === leaveId
            ? { ...leave, status: newStatus }
            : leave
        )
      );
 
      await fetchLeaves();
    } catch (error) {
      console.error("Failed to update status:", error.response?.data || error.message);
      // showToast("Failed to update status", "error");
    }
  };
 
  const handleHolidayAdded = () => {
    showToast("Holiday added successfully");
    fetchHolidays();
    setRefreshKey(prev => prev + 1);
    setIsOpen(false);
  };
 
  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setViewModalOpen(true);
  };
 
  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
    fetchUsers();
  }, []);
 
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };
 
  return (
    <div className="min-h-screen bg-transparent p-2">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
 
      {selectedLeave && (
        <ViewLeaveModal
          isOpen={viewModalOpen}
          setIsOpen={setViewModalOpen}
          leaveData={selectedLeave}
          onStatusChange={handleStatusChange}
        />
      )}
 
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
                  {["Date", "ID", "Name", "Email", "Leave Type", "Reason", "Duration", "Status", "Actions"].map((heading) => (
                    <th key={heading} className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left">
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
                      <p className="text-sm font-medium text-slate-500">No leave requests found</p>
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
 
      {/* Manage User Leaves Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mt-4">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Manage User Leaves</h2>
          <p className="text-[10px] font-medium text-slate-500 mt-1">Adjust leave balances for employees</p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 md:col-span-2">
            <ModernSelect
              label="Select Employee"
              name="employee"
              value={selectedUser}
              onChange={handleUserSelect}
              placeholder="Select an employee..."
              options={users.map(user => ({
                value: user._id,
                label: `${user.name} (${user.role})`
              }))}
            />
          </div>
 
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">PTO Balance</label>
            <input
              type="number"
              value={leaveBalances.pto}
              onChange={(e) => setLeaveBalances(prev => ({ ...prev, pto: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
              disabled={!selectedUser}
            />
          </div>
 
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sick Leaves</label>
            <input
              type="number"
              value={leaveBalances.sick}
              onChange={(e) => setLeaveBalances(prev => ({ ...prev, sick: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
              disabled={!selectedUser}
            />
          </div>
        </div>
 
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpdateLeaves}
            disabled={!selectedUser}
            className="px-6 py-3 bg-[#64748b] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100"
          >
            Update Balances
          </button>
        </div>
      </div>
 
      <AddHolidayModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onHolidayAdded={handleHolidayAdded}
      />
    </div>
  );
};
 
export default LeaveTrackerAdmin;
