import React, { useCallback, useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import api from "../../axios";
import { FaSyncAlt, FaClipboardList, FaCalendarDay, FaWallet, FaHistory, FaUsers } from "react-icons/fa";
import { BriefcaseIcon } from "@heroicons/react/20/solid";
import Toast from "../../components/Toast";
import { useSelector } from "react-redux";
import { getApiError } from "../../utils/validationUtils";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import LeaveRequestsTab from "../../components/leave/LeaveRequestsTab";
import HolidaysTab from "../../components/leave/HolidaysTab";
import ManageLeavesTab from "../../components/leave/ManageLeavesTab";
import EmployeeLeaveHistoryTab from "../../components/leave/EmployeeLeaveHistoryTab";

const EASE = [0.16, 1, 0.3, 1];

const LeaveTrackerAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Tab definitions
  const tabs = [
    { key: 0, title: "Leave Requests", icon: FaClipboardList, hint: "Review and approve leave requests" },
    { key: 1, title: "Holidays & Leaves", icon: FaCalendarDay, hint: "Company holidays and declared leaves" },
    { key: 2, title: "Manage Leaves", icon: FaWallet, hint: "View and adjust employee leave balances" },
    { key: 3, title: "Employee Leave History", icon: FaHistory, hint: "Per-employee leave records over time" },
  ];

  // ==================== USERS STATE (Manage Leaves + History tabs) ====================
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cross-tab handoff: Manage Leaves → Employee Leave History
  const [historyUserSelection, setHistoryUserSelection] = useState({ id: "", nonce: 0 });

  // ==================== COMMON STATE ====================
  const [toast, setToast] = useState(null);

  // Live request stats reported up by the Leave Requests tab (drives hero chips + tab badge)
  const [requestStats, setRequestStats] = useState(null);
  const handleRequestStats = useCallback((stats) => setRequestStats(stats), []);

  // Get current user role
  const { user: authUser } = useSelector(state => state.auth);
  const userRole = (authUser?.user?.role || authUser?.role || "").replace(/\s+/g, '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ==================== USERS FUNCTIONS ====================
  const fetchUsers = useCallback(async () => {
    setUsersError(false);
    try {
      const response = await api.get("/users");
      const usersArray = Array.isArray(response.data) ? response.data : response.data.data || [];
      let filtered = usersArray;
      if (!isSuperAdmin) {
        filtered = usersArray.filter(u => u.role !== 'Super Admin');
      }
      setUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsersError(true);
      showToast(getApiError(error, "Failed to load users"), "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [isSuperAdmin, showToast]);

  // Manual refresh (shows the button spinner + table loading state)
  const handleRefreshUsers = useCallback(async () => {
    setRefreshing(true);
    setLoadingUsers(true);
    try {
      await fetchUsers();
    } finally {
      setRefreshing(false);
    }
  }, [fetchUsers]);

  // Jump from Manage Leaves into the history tab for a specific employee
  const handleOpenEmployeeHistory = (userId) => {
    setHistoryUserSelection(prev => ({ id: userId, nonce: prev.nonce + 1 }));
    setActiveTab(3);
  };

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Keep the employee list fresh when switching to the user-driven tabs
  useEffect(() => {
    if (activeTab === 2 || activeTab === 3) {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);


  const pendingCount = requestStats?.pending ?? 0;

  // ==================== RENDER ====================
  return (
    <PageContainer isCard={false}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-4 w-full">
        {/* ==================== HERO ==================== */}
        <PortalHero
              label="Leave management overview"
            title="Leave Management"
          description="Approve requests, run holidays and keep every leave balance in sync — all from one place."
          chips={[
            { icon: FaUsers, value: users.length, label: " Employees" },
            { pulse: true, value: pendingCount, label: " Awaiting approval" },
          ]}
        />

        {/* ==================== TAB BAR ==================== */}
        <PortalTabBar
          tabs={tabs.map((t) => (t.key === 0 ? { ...t, badge: pendingCount } : t))}
          activeKey={activeTab}
          onChange={setActiveTab}
          idPrefix="leave-tab"
          panelId="leave-tabpanel"
          ariaLabel="Leave management sections"
          layoutId="lm-tab-pill"
          right={
            (activeTab === 2 || activeTab === 3) && (
              <>
                <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
                  {refreshing ? "Refreshing…" : "Employee directory"}
                </span>
                <button
                  onClick={handleRefreshUsers}
                  disabled={refreshing}
                  className="btn btn-primary w-full lg:w-auto flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
                  title="Refresh employee data"
                >
                  <FaSyncAlt size={13} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </>
            )
          }
        />

        {/* Tab content — remount on change so it fades in fresh */}
        <Motion.div
          key={activeTab}
          id="leave-tabpanel"
          role="tabpanel"
          aria-labelledby={`leave-tab-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
        >
          {/* ==================== TAB 0: LEAVE REQUESTS ==================== */}
          {activeTab === 0 && <LeaveRequestsTab showToast={showToast} onStats={handleRequestStats} />}

          {/* ==================== TAB 1: HOLIDAYS & LEAVES ==================== */}
          {activeTab === 1 && <HolidaysTab showToast={showToast} />}

          {/* ==================== TAB 2: MANAGE LEAVES ==================== */}
          {activeTab === 2 && (
            <ManageLeavesTab
              users={users}
              loading={loadingUsers}
              error={usersError}
              onRetry={fetchUsers}
              showToast={showToast}
              onViewHistory={handleOpenEmployeeHistory}
            />
          )}

          {/* ==================== TAB 3: EMPLOYEE LEAVE HISTORY ==================== */}
          {activeTab === 3 && (
            <EmployeeLeaveHistoryTab
              users={users}
              loadingUsers={loadingUsers}
              usersError={usersError}
              showToast={showToast}
              selectedUserRef={historyUserSelection}
            />
          )}
        </Motion.div>
      </div>
    </PageContainer>
  );
};

export default LeaveTrackerAdmin;
