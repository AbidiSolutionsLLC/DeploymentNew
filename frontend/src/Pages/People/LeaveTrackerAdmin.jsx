import React, { useEffect, useState } from "react";
import api from "../../axios";
import { FaPlus, FaEye } from "react-icons/fa";
import HolidayTable from "../../Components/HolidayTable";
import AddHolidayModal from "../../Components/AddHolidayModal";
import Toast from "../../Components/Toast";
import ViewLeaveModal from "../../Components/ViewLeaveModal";
import HistoryViewLeaveModal from "../../Components/HistoryViewLeaveModal";
import ModernSelect from "../../Components/ui/ModernSelect";
import { useSelector } from "react-redux";
import TableWithPagination from "../../Components/TableWithPagination";
import { getApiError } from "../../utils/validationUtils";
import { parseISOToLocalDate, formatDisplayDate } from "../../utils/dateUtils";

const LeaveTrackerAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Tab definitions
  const tabs = [
    { title: "Leave Requests" },
    { title: "Holidays & Leaves" },
    { title: "Manage Leaves" },
  ];

  // ==================== LEAVE REQUESTS STATE ====================
  const [departmentLeaveRecord, setDepartmentLeaveRecord] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  // ==================== HOLIDAYS STATE ====================
  const [holidays, setHolidays] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshHolidayKey, setRefreshHolidayKey] = useState(0);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  // ==================== MANAGE LEAVES STATE ====================
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [leaveBalances, setLeaveBalances] = useState({ pto: 0, sick: 0 });
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ==================== LEAVE HISTORY STATE ====================
  const [historyUsers, setHistoryUsers] = useState([]);
  const [historySelectedUser, setHistorySelectedUser] = useState("");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyViewModalOpen, setHistoryViewModalOpen] = useState(false);
  const [selectedHistoryLeave, setSelectedHistoryLeave] = useState(null);

  // ==================== COMMON STATE ====================
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [toast, setToast] = useState(null);

  // Get current user role
  const { user: authUser } = useSelector(state => state.auth);
  const userRole = (authUser?.user?.role || authUser?.role || "").replace(/\s+/g, '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==================== LEAVE REQUESTS FUNCTIONS ====================
  const fetchLeaves = async () => {
    try {
      const response = await api.get("/getAllLeaves");
      const formatted = response.data.data.map((item) => ({
        ...item, // Keep all raw data for the modal
        id: item._id,
        startDate: item.startDate,
        endDate: item.endDate,
        appliedAt: item.appliedAt || item.createdAt,
        date: formatDisplayDate(item.startDate),
        name: item.employeeName,
        email: item.email,
        leaveType: item.leaveType,
        reason: item.reason || "-",
        duration: `${Math.ceil(
          (parseISOToLocalDate(item.endDate) - parseISOToLocalDate(item.startDate)) /
          (1000 * 60 * 60 * 24) +
          1
        )} days`,
        status: item.status || "Pending",
        rawData: item,
      }));
      setDepartmentLeaveRecord(formatted);
    } catch (error) {
      console.error("Failed to load leave records:", error);
      showToast(getApiError(error, "Failed to load leave records"), "error");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
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
      console.error("Failed to update status:", error);
      showToast(getApiError(error, "Failed to update status"), "error");
    }
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setViewModalOpen(true);
  };

  const handleViewHistoryLeave = async (leave) => {
    try {
      // Use leaveId from the history entry, or _id if it's a direct leave request
      const leaveId = leave.leaveId || leave._id || leave.id;
      
      if (!leaveId) {
        showToast("Leave ID not found", "error");
        return;
      }

      // Fetch full leave details from API
      const response = await api.get(`/leaves/${leaveId}`);
      const fullLeaveData = response.data.data;

      setSelectedHistoryLeave({
        id: fullLeaveData._id,
        startDate: fullLeaveData.startDate,
        endDate: fullLeaveData.endDate,
        appliedAt: fullLeaveData.appliedAt || fullLeaveData.createdAt,
        employeeName: fullLeaveData.employeeName,
        name: fullLeaveData.employeeName,
        email: fullLeaveData.email,
        employee: { department: fullLeaveData.department || "Department not specified" },
        leaveType: fullLeaveData.leaveType,
        reason: fullLeaveData.reason || "-",
        duration: `${Math.ceil(
          (parseISOToLocalDate(fullLeaveData.endDate) - parseISOToLocalDate(fullLeaveData.startDate)) / (1000 * 60 * 60 * 24) + 1
        )} days`,
        status: fullLeaveData.status,
      });
      setHistoryViewModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch leave details:", error);
      showToast("Failed to load leave details", "error");
    }
  };

  // ==================== HOLIDAYS FUNCTIONS ====================
  const fetchHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      setHolidays(response.data);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      showToast(getApiError(error, "Failed to load holidays"), "error");
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleHolidayAdded = () => {
    showToast("Holiday added successfully");
    fetchHolidays();
    setRefreshHolidayKey(prev => prev + 1);
    setIsOpen(false);
  };

  // ==================== MANAGE LEAVES FUNCTIONS ====================
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      let filtered = response.data;
      if (!isSuperAdmin) {
        filtered = response.data.filter(u => u.role !== 'Super Admin');
      }
      setUsers(filtered);
      setHistoryUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast(getApiError(error, "Failed to load users"), "error");
    } finally {
      setLoadingUsers(false);
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
      showToast(getApiError(error, "Failed to fetch user leave balance"), "error");
    }
  };

  const handleUpdateLeaves = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser}/leaves`, leaveBalances);
      showToast("User leave balance updated successfully");
    } catch (error) {
      console.error("Failed to update leaves:", error);
      showToast(getApiError(error, "Failed to update leaves"), "error");
    }
  };

  // ==================== LEAVE HISTORY FUNCTIONS ====================
  const handleHistoryUserSelect = async (e) => {
    const userId = e.target.value;
    setHistorySelectedUser(userId);
    if (!userId) {
      setLeaveHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await api.get(`/users/${userId}/leaves/history`);
      setLeaveHistory(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch leave history:", error);
      showToast(getApiError(error, "Failed to fetch leave history"), "error");
      setLeaveHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const leaveColumns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => <span className="text-slate-700">{row.date}</span>
    },
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-mono text-xs">{row.id.substring(0, 8)}...</span>
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{row.name}</span>
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.email}</span>
    },
    {
      key: "leaveType",
      label: "Leave Type",
      sortable: true,
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
          {row.leaveType}
        </span>
      )
    },
    {
      key: "reason",
      label: "Reason",
      sortable: false,
      render: (row) => (
        <div className="max-w-[220px] text-slate-600" title={row.reason}>
          <span
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {row.reason}
          </span>
        </div>
      )
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium whitespace-nowrap">{row.duration}</span>
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    }
  ];

  const leaveActions = [
    {
      icon: <FaEye size={12} />,
      title: "View",
      className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      onClick: (row) => handleViewLeave(row)
    }
  ];

  const historyColumns = [
    {
      key: "leaveType",
      label: "Leave Type",
      sortable: true,
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
          {row.leaveType}
        </span>
      )
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      render: (row) => <span className="text-slate-600 whitespace-nowrap">{formatDisplayDate(row.startDate)}</span>
    },
    {
      key: "endDate",
      label: "End Date",
      sortable: true,
      render: (row) => <span className="text-slate-600 whitespace-nowrap">{formatDisplayDate(row.endDate)}</span>
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (row) => {
        const duration = Math.ceil((parseISOToLocalDate(row.endDate) - parseISOToLocalDate(row.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return <span className="text-slate-700 font-medium">{duration} days</span>;
      }
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      key: "reason",
      label: "Reason",
      sortable: false,
      render: (row) => <div className="max-w-[150px] truncate text-slate-600" title={row.reason}>{row.reason || "-"}</div>
    }
  ];

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
    fetchUsers();
  }, []);

  // Refetch data when tab changes
  useEffect(() => {
    if (activeTab === 0) {
      fetchLeaves();
    }
  }, [activeTab]);

  // ==================== RENDER ====================
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
          fetchLeaveRequests={fetchLeaves}
          isAdminPortal={true}
        />
      )}

      {/* Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="inline-flex flex-row flex-wrap items-center justify-center bg-white/90 backdrop-blur-sm p-1.5 rounded-[1.2rem] shadow-sm border border-white/50">
          {tabs.map((item, index) => (
            <div key={item.title} className="flex items-center">
              <button
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl
                  ${activeTab === index
                    ? "text-slate-800 bg-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/80"
                  }`}
                onClick={() => setActiveTab(index)}
              >
                {item.title}
              </button>
              {index !== tabs.length - 1 && (
                <span className="w-px h-5 bg-slate-200 mx-1.5"></span>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Action Button */}
        {activeTab === 1 && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <FaPlus size={14} />
            Add Holidays
          </button>
        )}
      </div>

      {/* ==================== TAB 0: LEAVE REQUESTS ==================== */}
      {activeTab === 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Applied Leave</h2>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Leave requests awaiting approval</p>
          </div>

          <TableWithPagination
            columns={leaveColumns}
            data={departmentLeaveRecord}
            loading={loadingLeaves}
            emptyMessage="No leave requests found"
            actions={leaveActions}
            rowsPerPage={10}
            onRowClick={handleViewLeave}
          />
        </div>
      )}

      {/* ==================== TAB 1: HOLIDAYS & LEAVES ==================== */}
      {activeTab === 1 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Upcoming Holidays & Leaves</h2>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Company holidays and scheduled leaves</p>
          </div>

          {loadingHolidays ? (
            <div className="text-center p-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
            </div>
          ) : (
            <HolidayTable holidays={holidays} key={refreshHolidayKey} />
          )}
        </div>
      )}

      {/* ==================== TAB 2: MANAGE LEAVES ==================== */}
      {activeTab === 2 && (
        <div className="space-y-4 overflow-visible">
          {/* Update User Leave Balances */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Update User Leave Balances</h2>
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
                  min="0"
                  value={leaveBalances.pto}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setLeaveBalances(prev => ({ ...prev, pto: val }));
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                  disabled={!selectedUser}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sick Leaves</label>
                <input
                  type="number"
                  min="0"
                  value={leaveBalances.sick}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setLeaveBalances(prev => ({ ...prev, sick: val }));
                  }}
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

          {/* Employee Leave History */}
          <div className="z-0 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Employee Leave History</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-1">View complete leave history for any employee</p>
            </div>

            {/* Employee Selector */}
            <div className="mb-6">
              <ModernSelect
                label="Select Employee"
                name="historyEmployee"
                value={historySelectedUser}
                onChange={handleHistoryUserSelect}
                placeholder="Select an employee..."
                options={users.map(user => ({
                  value: user._id,
                  label: `${user.name} (${user.role})`
                }))}
              />
            </div>

            {/* Leave History Table */}
            {loadingHistory ? (
              <div className="text-center p-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading leave history...</p>
              </div>
            ) : leaveHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                      {["Leave Type", "Start Date", "End Date", "Duration", "Status", "Reason", "Actions"].map((heading) => (
                        <th key={heading} className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.map((leave, index) => {
                      const startDate = parseISOToLocalDate(leave.startDate);
                      const endDate = parseISOToLocalDate(leave.endDate);
                      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                      return (
                        <tr key={leave._id || index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-slate-700">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {leave.leaveType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{startDate.toLocaleDateString()}</td>
                          <td className="p-3 text-slate-600">{endDate.toLocaleDateString()}</td>
                          <td className="p-3 text-slate-700 font-medium">{duration} days</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{leave.reason || "-"}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleViewHistoryLeave(leave)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                            >
                              <FaEye size={12} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : historySelectedUser ? (
              <div className="text-center p-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">No leave history found for this employee</p>
              </div>
            ) : (
              <div className="text-center p-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">Select an employee to view their leave history</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AddHolidayModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onHolidayAdded={handleHolidayAdded}
      />

      {/* History Leave View Modal - Read Only */}
      {selectedHistoryLeave && (
        <HistoryViewLeaveModal
          isOpen={historyViewModalOpen}
          setIsOpen={setHistoryViewModalOpen}
          leaveData={selectedHistoryLeave}
        />
      )}
    </div>
  );
};

export default LeaveTrackerAdmin;
