import React, { useCallback, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { FaSyncAlt, FaClipboardList, FaCalendarDay, FaCalendarCheck } from "react-icons/fa";
import { BriefcaseIcon } from "@heroicons/react/20/solid";
import Toast from "../../components/Toast";
import { refreshUserData } from "../../slices/userSlice";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import GlassButton from "../../components/ui/GlassButton";
import MyLeavesTab from "../../components/leave/MyLeavesTab";
import HolidaysTab from "../../components/leave/HolidaysTab";

const EASE = [0.16, 1, 0.3, 1];

const LeaveTracker = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [holidayRefreshKey, setHolidayRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const { user: authUser } = useSelector((state) => state.auth);
  const { userInfo, refreshing } = useSelector((state) => state.user);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const currentUserId =
    authUser?.data?.user?._id || authUser?.user?._id || authUser?._id || authUser?.id;

  const handleRefresh = useCallback(() => {
    if (currentUserId) dispatch(refreshUserData(currentUserId));
    setHolidayRefreshKey((k) => k + 1);
  }, [dispatch, currentUserId]);

  /* ---------------- hero chip stats ---------------- */
  const leaveBalances = useMemo(() => userInfo?.leaves || {}, [userInfo]);
  const leaveHistory = useMemo(() => userInfo?.leaveHistory || [], [userInfo]);

  const availableDays = useMemo(
    () => Object.values(leaveBalances).reduce((sum, balance) => sum + (balance || 0), 0),
    [leaveBalances]
  );

  const pendingCount = useMemo(
    () => leaveHistory.filter((l) => (l.status || "Pending") === "Pending").length,
    [leaveHistory]
  );

  const tabs = [
    {
      key: 0,
      title: "My Leaves",
      icon: FaClipboardList,
      hint: "Your leave requests, balances and approvals",
      badge: pendingCount,
    },
    {
      key: 1,
      title: "Holidays",
      icon: FaCalendarDay,
      hint: "Company holidays and declared leaves",
    },
  ];

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
            label="Leave tracker overview"
          title="Leave Tracker"
          description="Track your leave balance, manage your requests and see upcoming holidays — all from one place."
          emblem={BriefcaseIcon}
          chips={[
            { icon: FaCalendarCheck, value: availableDays, label: " days available" },
            { pulse: true, value: pendingCount, label: " awaiting approval" },
          ]}
        />

        {/* ==================== TAB BAR ==================== */}
        <PortalTabBar
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          idPrefix="leave-tab"
          panelId="leave-tabpanel"
          ariaLabel="Leave tracker sections"
          layoutId="pt-leave-tab-pill"
          right={
            <>
              <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
                {refreshing ? "Refreshing…" : "Up to date"}
              </span>
              <GlassButton
                variant="goldFoil"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh leave data"
                icon={FaSyncAlt}
                className="w-full lg:w-auto"
              >
                Refresh
              </GlassButton>
            </>
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
          {/* ==================== TAB 0: MY LEAVES ==================== */}
          {activeTab === 0 && <MyLeavesTab showToast={showToast} />}

          {/* ==================== TAB 1: HOLIDAYS ==================== */}
          {activeTab === 1 && (
            <HolidaysTab
              showToast={showToast}
              canManage={false}
              title="Holiday Calendar"
              context="company-wide"
              refreshKey={holidayRefreshKey}
            />
          )}
        </Motion.div>
      </div>
    </PageContainer>
  );
};

export default LeaveTracker;
