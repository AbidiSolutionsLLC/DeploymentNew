import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../axios";
import {
  FaCalendarCheck,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileCsv,
  FaEye,
} from "react-icons/fa";
import FilterRow from "../ui/FilterRow";
import GlassInput from "../ui/GlassInput";
import ModernSelect from "../ui/ModernSelect";
import GlassButton from "../ui/GlassButton";
import ViewLeaveModal from "../ViewLeaveModal";
import { getApiError } from "../../utils/validationUtils";
import { formatDisplayDate, parseISOToLocalDate } from "../../utils/dateUtils";
import { STATUS_VARIANTS, resolveStatusVariant } from "../StatusBadge";
import { getInitials, downloadCsv } from "../../utils/tableUtils";
import StatCard from "../ui/StatCard";
import FilterPanel from "../ui/FilterPanel";
import StyledTable from "../ui/StyledTable";

const daysBetween = (start, end) =>
  Math.ceil((parseISOToLocalDate(end) - parseISOToLocalDate(start)) / (1000 * 60 * 60 * 24)) + 1;

const statusBadge = (status) =>
  STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;

/* Leave type pills — uniform green text for every type */
const GREEN_PILL = "lm-success-badge";

const TYPE_PILL = {
  PTO: GREEN_PILL,
  Sick: GREEN_PILL,
  Casual: GREEN_PILL,
  Unpaid: GREEN_PILL,
};

const typePill = (type) => TYPE_PILL[type] || GREEN_PILL;

export default function LeaveRequestsTab({ showToast, onStats }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get("/getAllLeaves");
      const leaveArray = Array.isArray(response.data) ? response.data : response.data.data || [];
      const formatted = leaveArray.map((item) => ({
        ...item,
        id: item._id,
        startDate: item.startDate,
        endDate: item.endDate,
        appliedAt: item.appliedAt || item.createdAt,
        date: formatDisplayDate(item.startDate),
        name: item.employeeName,
        email: item.email,
        leaveType: item.leaveType,
        reason: item.reason || "-",
        daysCount: daysBetween(item.startDate, item.endDate),
        status: item.status || "Pending",
        rawData: item,
      }));
      setLeaves(formatted);
    } catch (err) {
      console.error("Failed to load leave records:", err);
      setError(true);
      showToast?.(getApiError(err, "Failed to load leave records"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* Report live totals upward so the admin hero + tab badge stay in sync */
  useEffect(() => {
    if (!onStats) return;
    const count = (s) => leaves.filter((r) => r.status === s).length;
    onStats({
      total: leaves.length,
      pending: count("Pending"),
      approved: count("Approved"),
      rejected: count("Rejected"),
    });
  }, [leaves, onStats]);

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status: newStatus });
      showToast?.(`Leave status updated to ${newStatus}`);
      await fetchLeaves();
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast?.(getApiError(err, "Failed to update status"), "error");
    }
  };

  /* ---------------- filters ---------------- */
  const filteredLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((r) => {
      const matchesSearch =
        !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || r.leaveType === typeFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaves, search, typeFilter, statusFilter]);

  const typeOptions = useMemo(() => {
    const counts = {};
    leaves.forEach((r) => {
      if (r.leaveType) counts[r.leaveType] = (counts[r.leaveType] || 0) + 1;
    });
    return [
      { value: "all", label: "All Types" },
      ...Object.keys(counts).map((t) => ({ value: t, label: t })),
    ];
  }, [leaves]);

  const statusOptions = useMemo(() => {
    return [
      { value: "all", label: "All Status" },
      { value: "Pending", label: "Pending" },
      { value: "Approved", label: "Approved" },
      { value: "Rejected", label: "Rejected" },
    ];
  }, []);

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  /* ---------------- KPIs (reflect active filters) ---------------- */
  const kpis = useMemo(() => {
    const count = (s) => filteredLeaves.filter((r) => r.status === s).length;
    const days = (s) =>
      filteredLeaves.filter((r) => r.status === s).reduce((sum, r) => sum + r.daysCount, 0);
    return {
      total: filteredLeaves.length,
      totalDays: filteredLeaves.reduce((sum, r) => sum + r.daysCount, 0),
      pending: count("Pending"),
      pendingDays: days("Pending"),
      approved: count("Approved"),
      approvedDays: days("Approved"),
      rejected: count("Rejected"),
    };
  }, [filteredLeaves]);

  /* ---------------- CSV export ---------------- */
  const exportCsv = () => {
    const header = [
      "S.No.",
      "Request ID",
      "Employee Name",
      "Email",
      "Applied On",
      "Start Date",
      "End Date",
      "Days",
      "Leave Type",
      "Reason",
      "Status",
    ];
    const rows = filteredLeaves.map((r, i) => [
      i + 1,
      r.id,
      r.name,
      r.email,
      r.appliedAt ? formatDisplayDate(r.appliedAt) : "",
      r.startDate,
      r.endDate,
      r.daysCount,
      r.leaveType,
      r.reason,
      r.status,
    ]);
    downloadCsv(`leave-requests-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast?.("Leave requests exported");
  };

  /* ---------------- table ---------------- */
  const columns = useMemo(
    () => [
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
        render: (_, row) => (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center text-[11px] font-black flex-shrink-0">
              {getInitials(row.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-heading truncate leading-tight">{row.name}</p>
              <p className="text-[10px] text-muted truncate">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "appliedAt",
        label: "Applied On",
        render: (value) => (
          <span className="text-xs font-medium text-main whitespace-nowrap">
            {value ? formatDisplayDate(value) : "-"}
          </span>
        ),
      },
      {
        key: "id",
        label: "Request ID",
        sortable: false,
        render: (_, row) => (
          <span className="text-main font-mono text-xs" title={row.id}>
            {row.id ? `${row.id.substring(0, 8)}...` : "-"}
          </span>
        ),
      },
      {
        key: "startDate",
        label: "Leave Period",
        render: (_, row) => (
          <div className="min-w-[165px]">
            <p className="text-xs font-bold text-heading whitespace-nowrap">
              {row.date} → {formatDisplayDate(row.endDate)}
            </p>
            <p className="text-[10px] text-muted mt-0.5">
              {row.daysCount} day{row.daysCount === 1 ? "" : "s"}
            </p>
          </div>
        ),
      },
      {
        key: "leaveType",
        label: "Leave Type",
        render: (value) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${typePill(
              value
            )}`}
          >
            {value}
          </span>
        ),
      },
      {
        key: "reason",
        label: "Reason",
        sortable: false,
        render: (_, row) => (
          <div className="max-w-[220px] text-muted text-xs" title={row.reason}>
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
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (value, row) => (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${statusBadge(
              row.status
            )}`}
          >
            {row.status}
          </span>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        icon: <FaEye size={12} />,
        title: "View request",
        onClick: (row) => {
          setSelectedLeave(row);
          setViewModalOpen(true);
        },
      },
    ],
    []
  );

  /* ---------------- render ---------------- */
  if (error) {
    return (
      <div className="glass-card text-center py-14">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
          <FaExclamationTriangle size={22} className="text-danger" />
        </div>
        <p className="text-sm font-bold text-heading">Failed to load leave requests</p>
        <p className="text-xs text-muted mt-1 mb-5">
          We couldn't load the leave requests. Please try again.
        </p>
        <GlassButton variant="primary" onClick={fetchLeaves}>
          RETRY
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ============ KPI CARDS ============ */}
      <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={kpis.total}
          sub={`${kpis.totalDays} leave days`}
          icon={FaCalendarCheck}
          tone="text-main"
          iconBg="bg-app"
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
          title="Approved"
          value={kpis.approved}
          sub={`${kpis.approvedDays} days approved`}
          icon={FaCheckCircle}
          tone="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
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

      {/* ============ FILTERS ============ */}
      <FilterPanel
        title="Leave Requests"
        subtitle={`${filteredLeaves.length} of ${leaves.length} requests · updated just now`}
        hint="Click View on any request to review its details and approve or reject it"
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <div className="min-w-[160px]">
            <ModernSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>
          <div className="min-w-[150px]">
            <ModernSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              placeholder="All Status"
            />
          </div>
        </FilterRow>
      </FilterPanel>

      {/* ============ TABLE ============ */}
      <StyledTable
        columns={columns}
        data={filteredLeaves}
        loading={loading}
        emptyMessage={hasFilters ? "No requests match these filters" : "No leave requests found"}
        onEmptyAction={hasFilters ? resetFilters : undefined}
        emptyActionLabel="Clear all filters"
        actions={actions}
        rowsPerPage={10}
        defaultSort={{ key: "appliedAt", direction: "desc" }}
        countLabel="requests"
      />

      {/* ============ VIEW MODAL ============ */}
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
    </div>
  );
}
