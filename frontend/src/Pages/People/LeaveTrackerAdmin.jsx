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
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";
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
  // ==================== RENDER ====================
  return (
    <div className="flex-1 min-w-0 overflow-hidden w-full bg-transparent min-h-screen p-4 flex flex-col">
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

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Leave Management
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Track, approve, and manage employee leaves
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === 1 && (
              <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary gap-2 shadow-lg shadow-blue-100"
              >
                <FaPlus size={14} /> Add Holiday
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/50 backdrop-blur-sm rounded-xl w-fit mb-4 flex-shrink-0 border border-slate-200/50">
        {tabs.map((item, index) => (
          <button
            key={item.title}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === index
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* ==================== TAB 0: LEAVE REQUESTS ==================== */}
        {activeTab === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 h-full flex flex-col overflow-hidden p-4">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Applied Leaves</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">Leave requests awaiting approval</p>
            </div>

            <div className="flex-1 overflow-hidden">
              <DataTable
                columns={leaveColumns}
                data={departmentLeaveRecord}
                loading={loadingLeaves}
                emptyMessage="No leave requests found"
                rowActions={leaveActions}
                onRowClick={handleViewLeave}
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 1: HOLIDAYS & LEAVES ==================== */}
        {activeTab === 1 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 h-full flex flex-col overflow-hidden p-4">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Upcoming Holidays</h2>
              <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">Company holidays and scheduled events</p>
            </div>

            <div className="flex-1 overflow-hidden">
              {loadingHolidays ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading holidays...</p>
                </div>
              ) : (
                <HolidayTable holidays={holidays} key={refreshHolidayKey} />
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MANAGE LEAVES ==================== */}
        {activeTab === 2 && (
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pb-8">
            {/* Update User Leave Balances */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-6">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Update Leave Balances</h2>
                <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">Adjust employee time-off allocations</p>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all text-sm font-medium text-slate-700"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all text-sm font-medium text-slate-700"
                    disabled={!selectedUser}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpdateLeaves}
                  disabled={!selectedUser}
                  className="btn btn-primary px-8 py-3 shadow-lg shadow-blue-100"
                >
                  Update Balances
                </button>
              </div>
            </div>

            {/* Employee Leave History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-6">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Leave History</h2>
                  <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">View historical leave records</p>
                </div>
                
                <div className="w-full max-w-xs">
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
              </div>

              {/* Leave History Table */}
              {!historySelectedUser ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                    <FaEye size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an employee to view history</p>
                </div>
              ) : (
                <div className="mt-4">
                  <DataTable
                    columns={historyColumns}
                    data={leaveHistory}
                    loading={loadingHistory}
                    emptyMessage={leaveHistory.length === 0 ? "No records found" : undefined}
                    rowActions={[
                      {
                        icon: <FaEye size={12} />,
                        label: "View",
                        onClick: (row) => handleViewHistoryLeave(row)
                      }
                    ]}
                    onRowClick={handleViewHistoryLeave}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
