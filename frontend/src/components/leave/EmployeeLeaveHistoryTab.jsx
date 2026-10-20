import React, { useEffect, useMemo, useState } from "react";
import api from "../../axios";
import { FaUsers, FaInbox } from "react-icons/fa";
import { EyeIcon } from "@heroicons/react/24/outline";
import {
  FaCalendarCheck,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import FilterRow from "../ui/FilterRow";
import GlassInput from "../ui/GlassInput";
import ModernSelect from "../ui/ModernSelect";
import GlassButton from "../ui/GlassButton";
import HistoryViewLeaveModal from "../HistoryViewLeaveModal";
import StatCard from "../ui/StatCard";
import FilterPanel from "../ui/FilterPanel";
import GlobalTable from "../ui/GlobalTable";
import {
  TablePill,
  TableStatus,
  TableText,
  TableTitle,
} from "../ui/TableCells";
import { getApiError } from "../../utils/validationUtils";
import { formatDisplayDate, parseISOToLocalDate } from "../../utils/dateUtils";
import {
  computeLeaveStats,
  getInitials,
  EMP_TYPE_BADGE,
  EMP_TYPE_VARIANTS,
  BALANCE_TEXT,
  BALANCE_BAR,
} from "./leaveStats";

const fmtDate = (value) => {
  if (!value) return "-";
  if (typeof value === "string") return formatDisplayDate(value);
  return new Date(value).toLocaleDateString("en-US");
};

const getDurationDays = (row) => {
  if (row.daysTaken) return Number(row.daysTaken);
  return (
    Math.ceil(
      (parseISOToLocalDate(row.endDate) - parseISOToLocalDate(row.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
};


export default function EmployeeLeaveHistoryTab({
  users = [],
  loadingUsers = false,
  usersError = false,
  showToast,
  selectedUserRef = null,
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  /* Sync external selection (from the Manage Leaves tab) */
  useEffect(() => {
    if (selectedUserRef?.id) setSelectedUser(selectedUserRef.id);
  }, [selectedUserRef]);

  /* Fetch history whenever the employee changes */
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedUser) {
        setLeaveHistory([]);
        return;
      }
      setLoadingHistory(true);
      try {
        const response = await api.get(`/users/${selectedUser}/leaves/history`);
        setLeaveHistory(
          Array.isArray(response.data) ? response.data : response.data.data || []
        );
      } catch (error) {
        console.error("Failed to fetch leave history:", error);
        showToast?.(getApiError(error, "Failed to fetch leave history"), "error");
        setLeaveHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedUser, showToast]);

  const employee = useMemo(
    () => users.find((u) => u._id === selectedUser) || null,
    [users, selectedUser]
  );
  const stats = employee ? computeLeaveStats(employee) : null;

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u._id,
        label: `${u.name} (${u.role}${u.designation ? ` · ${u.designation}` : ""})`,
      })),
    [users]
  );

  /* ---------------- filters ---------------- */
  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaveHistory.filter((row) => {
      const matchesSearch =
        !q ||
        (row.reason || "").toLowerCase().includes(q) ||
        (row.leaveType || "").toLowerCase().includes(q) ||
        String(row.startDate || "").includes(q) ||
        String(row.endDate || "").includes(q);
      const matchesType = typeFilter === "all" || row.leaveType === typeFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaveHistory, search, typeFilter, statusFilter]);

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  /* ---------------- KPIs ---------------- */
  const kpis = useMemo(() => {
    const total = leaveHistory.length;
    const count = (s) => leaveHistory.filter((r) => r.status === s).length;
    const days = (s) =>
      leaveHistory
        .filter((r) => r.status === s)
        .reduce((sum, r) => sum + getDurationDays(r), 0);
    return {
      total,
      approved: count("Approved"),
      pending: count("Pending"),
      rejected: count("Rejected"),
      approvedDays: days("Approved"),
      pendingDays: days("Pending"),
      takenDays: days("Approved") + days("Pending"),
    };
  }, [leaveHistory]);

  /* ---------------- view modal ---------------- */
  const handleViewLeave = async (leave) => {
    try {
      const leaveId = leave.leaveId || leave._id || leave.id;
      if (!leaveId) {
        showToast?.("Leave ID not found", "error");
        return;
      }
      const response = await api.get(`/leaves/${leaveId}`);
      const full = response.data.data || response.data;
      setSelectedLeave({
        id: full._id,
        startDate: full.startDate,
        endDate: full.endDate,
        appliedAt: full.appliedAt || full.createdAt,
        employeeName: full.employeeName,
        name: full.employeeName,
        email: full.email,
        employee: { department: full.department || "Department not specified" },
        leaveType: full.leaveType,
        reason: full.reason || "-",
        duration: (() => {
          const days = Math.ceil(
            (parseISOToLocalDate(full.endDate) - parseISOToLocalDate(full.startDate)) /
              (1000 * 60 * 60 * 24)
          ) + 1;
          return `${days} day${days === 1 ? "" : "s"}`;
        })(),
        status: full.status,
      });
      setViewModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch leave details:", error);
      showToast?.("Failed to load leave details", "error");
    }
  };

  /* ---------------- table ---------------- */
  const columns = [
    {
      key: "__index",
      label: "S.No.",
      sortable: false,
      type: "index",
      className: "text-muted text-xs font-bold",
    },
    {
      key: "startDate",
      label: "Leave Period",
      sortable: true,
      render: (_, row) => (
        <TableTitle
          title={`${fmtDate(row.startDate)} → ${fmtDate(row.endDate)}`}
          subtitle={`Applied ${fmtDate(row.appliedAt || row.createdAt)}`}
          maxWidth="min-w-[170px]"
        />
      ),
    },
    {
      key: "leaveType",
      label: "Leave Type",
      sortable: true,
      render: (_, row) => <TablePill>{row.leaveType}</TablePill>,
    },
    {
      key: "daysTaken",
      label: "Days",
      sortable: true,
      render: (_, row) => (
        <TableText value={getDurationDays(row)} className="font-bold text-heading" />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_, row) => <TableStatus value={row.status} />,
    },
    {
      key: "reason",
      label: "Reason",
      sortable: false,
      render: (_, row) => (
        <TableText
          value={row.reason}
          muted
          title={row.reason || ""}
          clamp={2}
          maxWidth="max-w-[220px]"
        />
      ),
    },
  ];

  const actions = [
    {
      icon: <EyeIcon className="w-4 h-4" />,
      title: "View request",
      onClick: (row) => handleViewLeave(row),
    },
  ];

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4">
      {/* ============ EMPLOYEE SELECTOR ============ */}
      <div className="glass-card">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-[260px]">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FaUsers size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-heading tracking-tight">
                Employee Leave History
              </h2>
              <p className="text-xs font-medium text-muted mt-0.5">
                Complete leave trail, balances and request outcomes for any employee
              </p>
              <div className="mt-3">
                <ModernSelect
                  label="Select Employee"
                  name="historyEmployee"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  placeholder={
                    loadingUsers
                      ? "Loading employees..."
                      : usersError
                      ? "Failed to load employees"
                      : "Search & select an employee..."
                  }
                  options={userOptions}
                />
              </div>
            </div>
          </div>

          {employee && (
            <div className="flex flex-wrap items-center gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser("")}
                icon={FaUsers}
              >
                CLEAR
              </GlassButton>
            </div>
          )}
        </div>
      </div>

      {/* ============ EMPTY: no employee selected ============ */}
      {!selectedUser && (
        <div className="glass-card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-app border border-dashed border-border-accent flex items-center justify-center">
            <FaInbox size={26} className="text-brand-text" />
          </div>
          <p className="text-sm font-bold text-heading tracking-tight">Select an employee</p>
          <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
            Choose an employee above to view their complete leave history, balances and request
            outcomes.
          </p>
        </div>
      )}

      {/* ============ SELECTED EMPLOYEE ============ */}
      {selectedUser && (
        <>
          {/* Profile + balances */}
          {employee ? (
            <div className="glass-card p-4">
              <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                {/* Identity */}
                <div className="flex items-center gap-3 min-w-0 xl:min-w-[280px]">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm">
                    {getInitials(employee.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-bold text-heading truncate">{employee.name}</p>
                      <span
                        className={`${EMP_TYPE_BADGE} ${
                          EMP_TYPE_VARIANTS[employee.empType] || EMP_TYPE_VARIANTS.Permanent
                        }`}
                      >
                        {employee.empType || "Permanent"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted truncate">
                      {employee.designation || "No designation"} · {employee.role}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {employee.empID || "No ID"} · {employee.email}
                    </p>
                  </div>
                </div>

                {/* Balance chips */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    {[
                      {
                        label: "Total Allowance",
                        value: stats.allowanceTotal,
                        sub: `${stats.allowancePto} PTO · ${stats.allowanceSick} Sick`,
                        cls: "text-main",
                      },
                      {
                        label: "Used",
                        value: stats.usedTotal,
                        sub: `${stats.usedPto} PTO · ${stats.usedSick} Sick`,
                        cls: "text-amber-600 dark:text-amber-400",
                      },
                      {
                        label: "Remaining",
                        value: stats.remainingTotal,
                        sub: `${stats.remainingPto} PTO · ${stats.remainingSick} Sick`,
                        cls: BALANCE_TEXT[stats.balanceStatus],
                      },
                      {
                        label: "Awaiting Approval",
                        value: stats.pendingDays,
                        sub: `${stats.pendingRequests} request${
                          stats.pendingRequests === 1 ? "" : "s"
                        }`,
                        cls: "text-info",
                      },
                    ].map((chip) => (
                      <div
                        key={chip.label}
                        className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 transition-all duration-200 hover:border-border-accent hover:shadow-sm"
                      >
                        <p
                          className={`text-xl leading-none font-black tracking-tight tabular-nums ${chip.cls}`}
                        >
                          {chip.value}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted mt-1.5">
                          {chip.label}
                        </p>
                        <p className="text-[10px] text-muted font-medium mt-0.5">{chip.sub}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Utilization bar */}
              {stats && stats.allowanceTotal > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
                    <span>Allowance Utilization</span>
                    <span className={BALANCE_TEXT[stats.balanceStatus]}>
                      {stats.usedPercent}% used · {stats.remainingPercent}% remaining
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${stats.usedPercent}%` }}
                    />
                    <div
                      className={`h-full transition-all duration-500 ${
                        BALANCE_BAR[stats.balanceStatus]
                      }`}
                      style={{ width: `${stats.remainingPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-4 text-xs text-muted font-medium">
              Loading employee details...
            </div>
          )}

          {/* KPIs */}
          <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Requests"
              value={kpis.total}
              sub={`${kpis.takenDays} days booked`}
              icon={FaCalendarCheck}
              tone="text-main"
              iconBg="bg-app"
            />
            <StatCard
              title="Approved"
              value={kpis.approved}
              sub={`${kpis.approvedDays} days taken`}
              icon={FaCheckCircle}
              tone="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            />
            <StatCard
              title="Pending"
              value={kpis.pending}
              sub={`${kpis.pendingDays} days awaiting`}
              icon={FaHourglassHalf}
              tone="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-100 dark:bg-amber-900/40"
            />
            <StatCard
              title="Rejected"
              value={kpis.rejected}
              sub="Requests declined"
              icon={FaTimesCircle}
              tone="text-rose-600 dark:text-rose-400"
              iconBg="bg-rose-100 dark:bg-rose-900/40"
            />
          </div>

          {/* Filters */}
          <FilterPanel
            title="Leave Records"
            subtitle={`${filteredHistory.length} of ${leaveHistory.length} records`}
            hint="Days = calendar days between the start and end date"
            actions={
              hasFilters ? (
                <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                  RESET
                </GlassButton>
              ) : null
            }
          >
            <FilterRow>
              <GlassInput
                placeholder="Search reason, type or date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[220px]"
              />
              <div className="min-w-[150px]">
                <ModernSelect
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All Leave Types" },
                    { value: "PTO", label: "PTO" },
                    { value: "Sick", label: "Sick" },
                  ]}
                  placeholder="Leave Type"
                />
              </div>
              <div className="min-w-[140px]">
                <ModernSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "Pending", label: "Pending" },
                    { value: "Approved", label: "Approved" },
                    { value: "Rejected", label: "Rejected" },
                  ]}
                  placeholder="Status"
                />
              </div>
            </FilterRow>
          </FilterPanel>

          {/* History table */}
          <GlobalTable
            columns={columns}
            data={filteredHistory.map((leave, index) => ({
              ...leave,
              _id: leave._id || `${leave.leaveId || "leave"}-${index}`,
            }))}
            loading={loadingHistory}
            emptyMessage={
              hasFilters ? "No records match these filters" : "No leave history yet"
            }
            onEmptyAction={hasFilters ? resetFilters : undefined}
            emptyActionLabel="Clear all filters"
            actions={actions}
            rowsPerPage={10}
            defaultSort={{ key: "startDate", direction: "desc" }}
            countLabel="records"
          />
        </>
      )}

      {/* Read-only leave view modal */}
      {selectedLeave && (
        <HistoryViewLeaveModal
          isOpen={viewModalOpen}
          setIsOpen={setViewModalOpen}
          leaveData={selectedLeave}
        />
      )}
    </div>
  );
}
