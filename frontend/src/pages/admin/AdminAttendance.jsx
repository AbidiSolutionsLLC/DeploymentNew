import React, { useState, useEffect, useMemo } from "react";
import api from "../../axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaAdjust,
  FaCalendarDay,
  FaFileCsv,
  FaPlus,
  FaSave,
  FaUsers,
} from "react-icons/fa";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import AdminAddAttendanceModal from "../../components/AdminAddAttendanceModal";
import GlassButton from "../../components/ui/GlassButton";
import GlassInput from "../../components/ui/GlassInput";
import ModernSelect from "../../components/ui/ModernSelect";
import FilterRow from "../../components/ui/FilterRow";
import GlassModal from "../../components/ui/GlassModal";
import DateRangePicker from "../../components/ui/DateRangePicker";
import Toast from "../../components/Toast";
import StatCard from "../../components/ui/StatCard";
import FilterPanel from "../../components/ui/FilterPanel";
import StatusBadge from "../../components/StatusBadge";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TablePerson,
  TableDate,
  TableText,
  TableStatus,
} from "../../components/ui/TableCells";
import { downloadCsv } from "../../utils/tableUtils";

import { dispatchReadOnlyModal } from '../../utils/readOnlyEvent';
import { formatDateForAPI, formatDisplayDate } from "../../utils/dateUtils";
import { useConfirm } from "../../context/ConfirmContext";

// Tab definitions (Leave Management style tab bar)
const TABS = [
  { key: "present", title: "Present", icon: FaCheckCircle, hint: "Employees with a check-in in the selected range" },
  { key: "half-day", title: "Half Day", icon: FaAdjust, hint: "Part-day attendance records" },
  { key: "absent", title: "Absent", icon: FaTimesCircle, hint: "Employees with no check-in recorded" },
  { key: "leave", title: "On Leave", icon: FaCalendarDay, hint: "Employees on an approved leave" },
];

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

  return (
    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold tracking-wider">
      {duration}
    </span>
  );
};

// --- MAIN COMPONENT ---
const AdminAttendance = () => {
  const confirm = useConfirm();
  const [summaryData, setSummaryData] = useState({
    present: [],
    absent: [],
    halfDay: [],
    onLeave: [],
    counts: { present: 0, absent: 0, halfDay: 0, onLeave: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState(() => {
    return localStorage.getItem('admin_attendance_filter_type') || "Today";
  });
  const [customDateRange, setCustomDateRange] = useState(() => {
    const savedStart = localStorage.getItem('admin_attendance_start');
    const savedEnd = localStorage.getItem('admin_attendance_end');
    if (savedStart && savedEnd) {
      const parsedStart = new Date(savedStart);
      const parsedEnd = new Date(savedEnd);
      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) return [parsedStart, parsedEnd];
    }
    const today = new Date();
    return [today, today];
  });

  const { derivedStart, derivedEnd } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilterType) {
      case "Today":
        return { derivedStart: today, derivedEnd: today };
      case "Yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { derivedStart: yesterday, derivedEnd: yesterday };
      }
      case "Last 7 Days": {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        return { derivedStart: last7, derivedEnd: today };
      }
      case "This Month": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { derivedStart: firstDay, derivedEnd: today };
      }
      case "Custom": {
        const customStart = customDateRange?.[0];
        const customEnd = customDateRange?.[1];
        if (!customStart && !customEnd) {
          return { derivedStart: today, derivedEnd: today };
        }
        return { derivedStart: customStart || customEnd, derivedEnd: customEnd || customStart };
      }
      default:
        return { derivedStart: today, derivedEnd: today };
    }
  }, [dateFilterType, customDateRange]);

  const startDate = derivedStart;
  const endDate = derivedEnd;

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('admin_attendance_tab');
    const validTabs = TABS.map(t => t.key);
    return (savedTab && validTabs.includes(savedTab)) ? savedTab : "present";
  });
  const [allUsers, setAllUsers] = useState([]);
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({ checkInTime: null, checkOutTime: null, status: "" });

  // Permission State
  const [currentUserRole, setCurrentUserRole] = useState("");
  const canEdit = currentUserRole === 'superadmin' || currentUserRole === 'globalreader';

  // Toast (same pattern as Leave Management)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSummary = async (start, end) => {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }
    setLoading(true);
    try {
      const startStr = formatDateForAPI(start);
      const endStr = formatDateForAPI(end);
      const res = await api.get(`/timetrackers/admin-summary?startDate=${startStr}&endDate=${endStr}`);
      const data = res.data.data || res.data;

      const safeData = {
        present: data?.present || [],
        absent: data?.absent || [],
        halfDay: data?.halfDay || [],
        onLeave: data?.onLeave || [],
        counts: data?.counts || { present: 0, absent: 0, halfDay: 0, onLeave: 0, total: 0 }
      };

      setSummaryData(safeData);
    } catch (error) {
      console.error("Fetch Summary Error:", error);
      showToast("Failed to load attendance summary", "error");
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
          setAllUsers(Array.isArray(allUsersRes.data) ? allUsersRes.data : allUsersRes.data.data || []);
        }
      } catch (error) {
        console.error("User Init Error:", error);
      }
    };
    fetchUserInfo();
  }, []);

  // --- FETCH SUMMARY ON DATE CHANGE ---
  useEffect(() => {
    if (startDate && endDate) {
      fetchSummary(startDate, endDate);
    }
  }, [startDate, endDate]);

  // --- DERIVE UNIQUE DEPARTMENTS ---
  const departmentOptions = useMemo(() => {
    const depts = new Set();
    allUsers.forEach(u => {
      const deptName = u.department?.name || u.department;
      if (deptName) depts.add(deptName);
    });
    return [
      { value: "all", label: "All Departments" },
      ...[...depts].sort().map(d => ({ value: d, label: d })),
    ];
  }, [allUsers]);

  // --- HELPERS ---
  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const selectTab = (key) => {
    setActiveTab(key);
    localStorage.setItem('admin_attendance_tab', key);
  };

  const getActiveTabData = () => {
    switch (activeTab) {
      case "present": return (summaryData.present || []).filter(log => log.status !== 'Absent' && log.status !== 'On Leave' && log.status !== 'Leave');
      case "half-day": return summaryData.halfDay || [];
      case "absent": return summaryData.absent || [];
      case "leave": return summaryData.onLeave || [];
      default: return [];
    }
  };

  const hasFilters = Boolean(searchTerm) || deptFilter !== "all" || dateFilterType !== "Today";

  const resetFilters = () => {
    setSearchTerm("");
    setDeptFilter("all");
    setDateFilterType("Today");
    localStorage.setItem('admin_attendance_filter_type', 'Today');
  };

  const activeTabLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return getActiveTabData()
      .filter((log) => {
        const employeeName = log.user?.name || "Unknown";
        const employeeEmail = log.user?.email || "";
        const matchesSearch =
          !q ||
          String(employeeName).toLowerCase().includes(q) ||
          String(employeeEmail).toLowerCase().includes(q);
        const userDeptName = log.user?.department?.name || log.user?.department || "";
        const matchesDept = deptFilter === "all" || userDeptName === deptFilter;
        return matchesSearch && matchesDept;
      })
      .map((log) => ({
        ...log,
        name: log.user?.name || "Unknown",
        date: log.date || formatDateForAPI(startDate),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryData, activeTab, searchTerm, deptFilter, startDate]);

  // --- EXPORT CSV ---
  const exportCsv = () => {
    const dataToExport = activeTabLogs;
    if (dataToExport.length === 0) {
      showToast("No data to download", "error");
      return;
    }

    const isPresentTab = activeTab === "present";
    const header = isPresentTab
      ? ["Employee Name", "Email", "Date", "Check In", "Check Out", "Total Hours", "Status"]
      : ["Employee Name", "Email", "Date", "Status"];

    const rows = dataToExport.map((log) => {
      const base = [
        log.user?.name || "Unknown",
        log.user?.email || "N/A",
        formatDisplayDate(log.date || startDate),
        log.status,
      ];
      if (isPresentTab) {
        return [
          base[0],
          base[1],
          base[2],
          log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "--",
          log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "Active",
          log.totalHours ?? "--",
          base[3],
        ];
      }
      return base;
    });

    downloadCsv(
      `attendance_${activeTab}_report_${formatDateForAPI(startDate)}.csv`,
      header,
      rows
    );
    showToast("Attendance report exported");
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
        if (updates.checkInTime && new Date(updates.checkInTime) > new Date()) {
          return showToast("Check-in time cannot be in the future", "error");
        }
        if (updates.checkOutTime && new Date(updates.checkOutTime) > new Date()) {
          return showToast("Check-out time cannot be in the future", "error");
        }

        if (updates.checkInTime && updates.checkOutTime) {
          if (new Date(updates.checkOutTime) <= new Date(updates.checkInTime)) {
            return showToast("Check-out cannot be before check-in", "error");
          }
        }
        if (!updates.checkInTime && updates.checkOutTime) {
          return showToast("Check-in is required if check-out is provided", "error");
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

      if (editingLog._id) {
        await api.put(`/timetrackers/${editingLog._id}`, updates);
        showToast("Attendance updated successfully");
      } else {
        await api.post("/timetrackers", {
          user: editingLog.user?._id,
          checkInTime: updates.checkInTime,
          checkOutTime: updates.checkOutTime,
          status: updates.status,
          totalHours: updates.totalHours,
          date: editingLog.date || startDate
        });
        showToast("Attendance record created successfully");
      }
      setIsEditModalOpen(false);
      await fetchSummary(startDate, endDate);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update record", "error");
    }
  };

  const handleDeleteRecord = async (logId) => {
    if (currentUserRole === 'globalreader') {
      dispatchReadOnlyModal();
      return;
    }
    await confirm({
      title: "Delete Record",
      message: "Delete this attendance record permanently?",
      onConfirmAction: async () => {
        try {
          await api.delete(`/timetrackers/${logId}`);
          showToast("Record deleted");
          await fetchSummary(startDate, endDate);
        } catch (error) {
          showToast(error.response?.data?.message || "Failed to delete record", "error");
          throw error;
        }
      }
    });
  };

  /* ---------------- table columns (Leave Management style) ---------------- */
  const columns = useMemo(() => {
    const base = [
      {
        key: "__index",
        label: "S.No.",
        sortable: false,
        type: "index",
        className: "text-muted text-xs font-bold",
      },
      {
        key: "name",
        label: "Employee",
        render: (value, row) => (
          <TablePerson
            name={value}
            subtitle={row.user?.designation || row.user?.email || "Employee"}
            className="min-w-[180px]"
          />
        ),
      },
      {
        key: "date",
        label: "Date",
        render: (value) => <TableDate value={value} />,
      },
    ];

    const timeCols =
      activeTab === "present"
        ? [
            {
              key: "checkInTime",
              label: "Check In",
              render: (value) => <TableText value={formatTime(value)} />,
            },
            {
              key: "checkOutTime",
              label: "Check Out",
              render: (value, row) =>
                value ? (
                  <TableText value={formatTime(value)} />
                ) : row.checkInTime ? (
                  <StatusBadge status="Active" />
                ) : (
                  <TableText value="--:--" muted />
                ),
            },
            {
              key: "totalHours",
              label: "Duration",
              render: (value, row) =>
                row.checkInTime && row.checkOutTime ? (
                  <TableText
                    value={`${Math.floor(value || 0)}h ${Math.round(((value || 0) % 1) * 60)}m`}
                    muted
                  />
                ) : row.checkInTime ? (
                  <LiveTimer startTime={row.checkInTime} />
                ) : (
                  <TableText value="N/A" muted className="italic" />
                ),
            },
          ]
        : [];

    const statusCol = {
      key: "status",
      label: "Status",
      render: (value) => <TableStatus value={value} />,
    };

    return [...base, ...timeCols, statusCol];
  }, [activeTab]);

  /* ---------------- row actions ---------------- */
  const tableActions = [];
  if (canEdit) {
    tableActions.push(
      {
        icon: <PencilIcon className="w-4 h-4" />,
        title: "Edit record",
        onClick: (row) => {
          if (row.checkInTime && !row.checkOutTime) return;
          handleEditClick(row);
        },
        className: (row) =>
          row.checkInTime && !row.checkOutTime
            ? "p-2 rounded-lg text-slate-300 dark:text-slate-600 bg-surface border border-border-subtle cursor-not-allowed"
            : "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-brand-text hover:border-border-accent hover:shadow-sm",
      },
      {
        icon: <TrashIcon className="w-4 h-4" />,
        title: "Delete record",
        onClick: (row) => {
          if (row._id) handleDeleteRecord(row._id);
        },
        className: (row) =>
          row._id
            ? "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-danger hover:border-danger hover:shadow-sm"
            : "p-2 rounded-lg text-slate-300 dark:text-slate-600 bg-surface border border-border-subtle cursor-not-allowed",
      }
    );
  }

  const counts = summaryData.counts;
  const presentPct = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;
  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];
  const rangeLabel = `${startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} → ${endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  // Tab bar model — live per-status counts ride along as badges
  const tabItems = TABS.map((t) => ({
    ...t,
    badge:
      t.key === "present"
        ? counts.present
        : t.key === "half-day"
        ? counts.halfDay
        : t.key === "absent"
        ? counts.absent
        : counts.onLeave,
  }));

  return (
    <>
      <PageContainer isCard={false}>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <div className="flex flex-col gap-4 w-full">
          {/* ============ HERO (Leave Management style) ============ */}
          <PortalHero
                label="Attendance overview"
              title="Employee Attendance"
            description="Monitor daily check-ins, check-outs and working hours — with live status across every team member."
            chips={[
              { icon: FaUsers, value: counts.total, label: " Employees in range" },
              { pulse: true, value: `${presentPct}%`, label: " attendance" },
            ]}
          />

          {/* ============ TAB BAR (Leave Management style) ============ */}
          <PortalTabBar
            tabs={tabItems}
            activeKey={activeTab}
            onChange={selectTab}
            idPrefix="attendance-tab"
            panelId="attendance-tabpanel"
            ariaLabel="Attendance categories"
            layoutId="attendance-tab-pill"
            right={
              <>
                <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
                  {rangeLabel}
                </span>
                {canEdit && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    icon={FaPlus}
                    onClick={() => setIsAddAttendanceOpen(true)}
                  >
                    Check In/Out
                  </GlassButton>
                )}
              </>
            }
          />

          <div
            key={activeTab}
            id="attendance-tabpanel"
            role="tabpanel"
            aria-labelledby={`attendance-tab-${TABS.findIndex((t) => t.key === activeTab)}`}
            className="animate-fadeIn flex flex-col gap-4"
          >
            {/* ============ KPI CARDS ============ */}
            <div className="lm-stagger grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Total"
                value={counts.total}
                sub="Employees in range"
                icon={FaCalendarDay}
                tone="text-main"
                iconBg="bg-app"
              />
              <StatCard
                title="Present"
                value={counts.present}
                sub={`${presentPct}% attendance`}
                icon={FaCheckCircle}
                tone="text-emerald-600 dark:text-emerald-400"
                iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              />
              <StatCard
                title="Half Day"
                value={counts.halfDay}
                sub="Part-day records"
                icon={FaAdjust}
                tone="text-amber-600 dark:text-amber-400"
                iconBg="bg-amber-100 dark:bg-amber-900/40"
              />
              <StatCard
                title="Absent"
                value={counts.absent}
                sub="Missed check-in"
                icon={FaTimesCircle}
                tone="text-rose-600 dark:text-rose-400"
                iconBg="bg-rose-100 dark:bg-rose-900/40"
              />
              <StatCard
                title="On Leave"
                value={counts.onLeave}
                sub="On approved leave"
                icon={FaCalendarDay}
                tone="text-sky-600 dark:text-sky-400"
                iconBg="bg-sky-100 dark:bg-sky-900/40"
              />
            </div>

            {/* ============ FILTERS ============ */}
            <FilterPanel
              title="Attendance Records"
              subtitle={`${activeTabLogs.length} of ${getActiveTabData().length} ${currentTab.title.toLowerCase()} records · ${rangeLabel}`}
              hint="Switch categories from the tabs above, then filter by date range, department or employee"
              actions={
                <>
                  {hasFilters && (
                    <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                      RESET
                    </GlassButton>
                  )}
                  <GlassButton variant="secondary" size="sm" icon={FaFileCsv} onClick={exportCsv}>
                    EXPORT CSV
                  </GlassButton>
                </>
              }
            >
              <FilterRow>
                <GlassInput
                  placeholder="Search by employee name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[220px]"
                />

                <div className="flex gap-2">
                  <div className="min-w-[150px]">
                    <ModernSelect
                      value={dateFilterType}
                      onChange={(e) => {
                        setDateFilterType(e.target.value);
                        localStorage.setItem('admin_attendance_filter_type', e.target.value);
                      }}
                      options={[
                        { value: "Today", label: "Today" },
                        { value: "Yesterday", label: "Yesterday" },
                        { value: "Last 7 Days", label: "Last 7 Days" },
                        { value: "This Month", label: "This Month" },
                        { value: "Custom", label: "Custom Range" },
                      ]}
                      placeholder="Select Date"
                    />
                  </div>

                  {dateFilterType === "Custom" && (
                    <DateRangePicker
                      startDate={customDateRange[0]}
                      endDate={customDateRange[1]}
                      onChange={(update) => {
                        setCustomDateRange(update);
                        if (update[0]) localStorage.setItem('admin_attendance_start', update[0].toISOString());
                        else localStorage.removeItem('admin_attendance_start');

                        if (update[1]) localStorage.setItem('admin_attendance_end', update[1].toISOString());
                        else localStorage.removeItem('admin_attendance_end');
                      }}
                      className="w-56"
                    />
                  )}
                </div>

                <div className="min-w-[160px]">
                  <ModernSelect
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    options={departmentOptions}
                    placeholder="All Departments"
                  />
                </div>
              </FilterRow>
            </FilterPanel>

            {/* ============ TABLE ============ */}
            <GlobalTable
              columns={columns}
              data={activeTabLogs}
              loading={loading}
              emptyMessage={
                hasFilters ? "No records match these filters" : "No attendance records found"
              }
              onEmptyAction={hasFilters ? resetFilters : undefined}
              emptyActionLabel="Clear all filters"
              actions={tableActions}
              rowsPerPage={10}
              defaultSort={{ key: "date", direction: "desc" }}
              countLabel="records"
            />
          </div>
        </div>
      </PageContainer>

      {/* ============ EDIT MODAL ============ */}
      {isEditModalOpen && (
        <GlassModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          maxWidth="max-w-md"
          title="Edit Attendance"
          footer={
            <>
              <GlassButton variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" icon={FaSave} onClick={handleSaveChanges}>
                Save Changes
              </GlassButton>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                Check In Time
              </label>
              <DatePicker
                selected={editFormData.checkInTime}
                onChange={(date) => setEditFormData({ ...editFormData, checkInTime: date })}
                showTimeSelect
                dateFormat="Pp"
                wrapperClassName="w-full"
                className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-100 outline-none"
                popperProps={{ strategy: "fixed" }}
                portalId="portal-root"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                Check Out Time
              </label>
              <DatePicker
                selected={editFormData.checkOutTime}
                onChange={(date) => setEditFormData({ ...editFormData, checkOutTime: date })}
                showTimeSelect
                dateFormat="Pp"
                wrapperClassName="w-full"
                className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-100 outline-none"
                popperProps={{ strategy: "fixed" }}
                portalId="portal-root"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                className="w-full border border-border-subtle rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-100 outline-none bg-surface"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ============ ADD ATTENDANCE MODAL ============ */}
      {isAddAttendanceOpen && (
        <AdminAddAttendanceModal
          open={isAddAttendanceOpen}
          onClose={() => setIsAddAttendanceOpen(false)}
          onSuccess={() => fetchSummary(startDate, endDate)}
          allUsers={allUsers}
        />
      )}
    </>
  );
};

export default AdminAttendance;
