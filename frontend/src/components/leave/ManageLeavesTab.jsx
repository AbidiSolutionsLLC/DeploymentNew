import React, { useMemo, useState } from "react";
import {
  FaUsers,
  FaCalendarCheck,
  FaWallet,
  FaExclamationTriangle,
  FaFileCsv,
  FaHistory,
} from "react-icons/fa";
import { PencilIcon } from "@heroicons/react/24/outline";
import FilterRow from "../ui/FilterRow";
import GlassInput from "../ui/GlassInput";
import ModernSelect from "../ui/ModernSelect";
import GlassButton from "../ui/GlassButton";
import Loader from "../ui/Loader";
import EditLeaveBalanceModal from "./EditLeaveBalanceModal";
import StatCard from "../ui/StatCard";
import FilterPanel from "../ui/FilterPanel";
import GlobalTable from "../ui/GlobalTable";
import {
  TablePerson,
  TableText,
  TableTitle,
  TableNumber,
  TableProgress,
  TablePill,
  TableStatus,
} from "../ui/TableCells";
import {
  computeLeaveStats,
  getBalanceRemark,
  BALANCE_TEXT,
  BALANCE_BAR,
  BALANCE_LABEL,
  LOW_BALANCE_THRESHOLD,
  downloadCsv,
} from "./leaveStats";

/* ------------------------------------------------------------------ */
/* Column definition (two level grouped header)                       */
/* ------------------------------------------------------------------ */
const remainingTone = (status) =>
  ({ healthy: "success", low: "warning", exhausted: "danger" }[status] || "default");

const COLUMNS = [
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
      <TablePerson name={row.name} subtitle={row.empID || row.email} className="min-w-[180px]" />
    ),
  },
  {
    key: "designation",
    label: "Designation",
    render: (_, row) => <TableText value={row.designation} truncate maxWidth="max-w-[150px]" />,
  },
  {
    key: "allowanceTotal",
    label: "Total Leave Allowance",
    render: (_, row) => (
      <TableTitle
        title={row.allowanceTotal}
        subtitle={`${row.allowancePto} PTO · ${row.allowanceSick} Sick`}
        maxWidth="max-w-[180px]"
      />
    ),
  },
  {
    key: "usedPto",
    label: "PTO",
    group: "Leaves Used",
    render: (_, row) => <TableNumber value={row.usedPto} />,
  },
  {
    key: "usedSick",
    label: "Sick",
    group: "Leaves Used",
    render: (_, row) => <TableNumber value={row.usedSick} />,
  },
  {
    key: "usedTotal",
    label: "Total",
    group: "Leaves Used",
    render: (_, row) => (
      <TableTitle
        title={row.usedTotal}
        subtitle={row.pendingRequests > 0 ? `${row.pendingRequests} pending` : undefined}
        maxWidth="max-w-[120px]"
      />
    ),
  },
  {
    key: "remainingPto",
    label: "PTO",
    group: "Remaining Balance",
    render: (_, row) => <TableNumber value={row.remainingPto} tone={remainingTone(row.balanceStatus)} />,
  },
  {
    key: "remainingSick",
    label: "Sick",
    group: "Remaining Balance",
    render: (_, row) => <TableNumber value={row.remainingSick} tone={remainingTone(row.balanceStatus)} />,
  },
  {
    key: "remainingTotal",
    label: "Total",
    group: "Remaining Balance",
    render: (_, row) => <TableNumber value={row.remainingTotal} tone={remainingTone(row.balanceStatus)} />,
  },
  {
    key: "remainingPercent",
    label: "Total Balance Remaining",
    render: (_, row) => (
      <div className="min-w-[150px]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-bold text-heading">
            {row.remainingTotal}
            <span className="text-muted font-medium">/{row.allowanceTotal}</span>
          </span>
          <span className={`text-[10px] font-bold ${BALANCE_TEXT[row.balanceStatus]}`}>
            {row.remainingPercent}%
          </span>
        </div>
        <TableProgress
          value={row.remainingPercent}
          showLabel={false}
          width="w-full"
          barClass={BALANCE_BAR[row.balanceStatus]}
        />
      </div>
    ),
  },
  {
    key: "empType",
    label: "Employment Type / Remarks",
    align: "right",
    render: (_, row) => (
      <div className="flex flex-col items-end gap-1.5 min-w-[150px]">
        <TablePill tone="success">{row.empType}</TablePill>
        <TableStatus value={BALANCE_LABEL[row.balanceStatus]} />
        <span className="text-[10px] font-medium text-muted text-right leading-tight">
          {row.empStatus === "Inactive" ? "Inactive employee" : getBalanceRemark(row)}
        </span>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Main tab                                                            */
/* ------------------------------------------------------------------ */
export default function ManageLeavesTab({
  users = [],
  loading = false,
  error = false,
  onRetry,
  showToast,
  onViewHistory,
}) {
  const [search, setSearch] = useState("");
  const [empTypeFilter, setEmpTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const [editingUser, setEditingUser] = useState(null);

  /* ---------------- rows derived from users ---------------- */
  const rows = useMemo(
    () =>
      users.map((u) => {
        const stats = computeLeaveStats(u);
        return {
          ...u,
          id: u._id,
          name: u.name || "-",
          email: u.email || "-",
          empID: u.empID || "",
          designation: u.designation || "-",
          role: u.role || "-",
          empType: u.empType || "Permanent",
          departmentName: u.department?.name || "Unassigned",
          ...stats,
        };
      }),
    [users]
  );

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "All Roles" },
      ...[...new Set(users.map((u) => u.role).filter(Boolean))].map((r) => ({
        value: r,
        label: r,
      })),
    ],
    [users]
  );

  const departmentOptions = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      ...[...new Set(users.map((u) => u.department?.name).filter(Boolean))].map((d) => ({
        value: d,
        label: d,
      })),
    ],
    [users]
  );

  const balanceCounts = useMemo(() => {
    const counts = { all: rows.length, healthy: 0, low: 0, exhausted: 0 };
    rows.forEach((r) => {
      if (counts[r.balanceStatus] !== undefined) counts[r.balanceStatus] += 1;
    });
    return counts;
  }, [rows]);

  const balanceOptions = [
    { value: "all", label: `All Balances (${balanceCounts.all})` },
    { value: "healthy", label: `Healthy (${balanceCounts.healthy})` },
    { value: "low", label: `Low Balance (${balanceCounts.low})` },
    { value: "exhausted", label: `Exhausted (${balanceCounts.exhausted})` },
  ];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.empID.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q);
      const matchesEmpType = empTypeFilter === "all" || r.empType === empTypeFilter;
      const matchesRole = roleFilter === "all" || r.role === roleFilter;
      const matchesDept = departmentFilter === "all" || r.departmentName === departmentFilter;
      const matchesBalance = balanceFilter === "all" || r.balanceStatus === balanceFilter;
      return matchesSearch && matchesEmpType && matchesRole && matchesDept && matchesBalance;
    });
  }, [rows, search, empTypeFilter, roleFilter, departmentFilter, balanceFilter]);

  const resetFilters = () => {
    setSearch("");
    setEmpTypeFilter("all");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setBalanceFilter("all");
  };

  const hasFilters =
    search ||
    empTypeFilter !== "all" ||
    roleFilter !== "all" ||
    departmentFilter !== "all" ||
    balanceFilter !== "all";

  /* ---------------- KPIs (reflect active filters) ---------------- */
  const kpis = useMemo(() => {
    const total = filteredRows.length;
    const active = filteredRows.filter((r) => r.empStatus !== "Inactive").length;
    const allowance = filteredRows.reduce((s, r) => s + r.allowanceTotal, 0);
    const used = filteredRows.reduce((s, r) => s + r.usedTotal, 0);
    const remaining = filteredRows.reduce((s, r) => s + r.remainingTotal, 0);
    const low = filteredRows.filter((r) => r.balanceStatus === "low").length;
    const exhausted = filteredRows.filter((r) => r.balanceStatus === "exhausted").length;
    const usedPct = allowance > 0 ? Math.round((used / allowance) * 100) : 0;
    return { total, active, allowance, used, remaining, low, exhausted, usedPct };
  }, [filteredRows]);

  /* ---------------- CSV export ---------------- */
  const exportCsv = () => {
    const header = [
      "S.No.",
      "Employee Name",
      "Email",
      "Employee ID",
      "Designation",
      "Role",
      "Employment Type",
      "Allowance PTO",
      "Allowance Sick",
      "Allowance Total",
      "Used PTO",
      "Used Sick",
      "Used Total",
      "Remaining PTO",
      "Remaining Sick",
      "Remaining Total",
      "Total Balance Remaining %",
      "Remarks",
    ];
    const rowsCsv = filteredRows.map((r, i) => [
      i + 1,
      r.name,
      r.email,
      r.empID,
      r.designation,
      r.role,
      r.empType,
      r.allowancePto,
      r.allowanceSick,
      r.allowanceTotal,
      r.usedPto,
      r.usedSick,
      r.usedTotal,
      r.remainingPto,
      r.remainingSick,
      r.remainingTotal,
      r.remainingPercent,
      `${BALANCE_LABEL[r.balanceStatus]} · ${getBalanceRemark(r)}`,
    ]);
    downloadCsv(
      `leave-balances-${new Date().toISOString().slice(0, 10)}.csv`,
      header,
      rowsCsv
    );
    showToast?.("Leave balance report exported");
  };

  /* ---------------- helpers ---------------- */
  const handleSaved = (err) => {
    if (err) {
      showToast?.(err, "error");
    } else {
      showToast?.("Leave balance updated successfully");
      setEditingUser(null);
      onRetry?.();
    }
  };

  const actions = [
    {
      icon: <PencilIcon className="w-4 h-4" />,
      title: "Update leave balance",
      onClick: (row) => setEditingUser(row),
    },
    {
      icon: <FaHistory size={12} />,
      title: "View leave history",
      onClick: (row) => onViewHistory?.(row.id),
    },
  ];

  /* ---------------- render ---------------- */
  if (loading) {
    return (
      <div className="glass-card">
        <Loader text="Loading employee leave balances..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center py-14">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
          <FaExclamationTriangle size={22} className="text-danger" />
        </div>
        <p className="text-sm font-bold text-heading">Failed to load employees</p>
        <p className="text-xs text-muted mt-1 mb-5">
          We couldn't load the employee leave data. Please try again.
        </p>
        <GlassButton variant="primary" onClick={onRetry}>
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
          title="Employees"
          value={kpis.total}
          sub={`${kpis.active} active in this view`}
          icon={FaUsers}
          tone="text-main"
          iconBg="bg-app"
        />
        <StatCard
          title="Leave Days Used"
          value={kpis.used}
          sub={`${kpis.usedPct}% of ${kpis.allowance} day allowance`}
          icon={FaCalendarCheck}
          tone="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-100 dark:bg-amber-900/40"
        />
        <StatCard
          title="Balance Remaining"
          value={kpis.remaining}
          sub="Days still available"
          icon={FaWallet}
          tone="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
        />
        <StatCard
          title="Balance Alerts"
          value={kpis.low + kpis.exhausted}
          sub={`${kpis.low} low · ${kpis.exhausted} exhausted`}
          icon={FaExclamationTriangle}
          tone="text-rose-600 dark:text-rose-400"
          iconBg="bg-rose-100 dark:bg-rose-900/40"
        />
      </div>

      {/* ============ FILTERS ============ */}
      <FilterPanel
        title="Leave Balance Register"
        subtitle={`${filteredRows.length} of ${rows.length} employees · allowance = used + remaining`}
        hint={`Low = ${LOW_BALANCE_THRESHOLD} days or fewer remaining · Exhausted = 0 days remaining`}
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
            placeholder="Search name, email, ID or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <div className="min-w-[150px]">
            <ModernSelect
              value={empTypeFilter}
              onChange={(e) => setEmpTypeFilter(e.target.value)}
              options={[
                { value: "all", label: "All Employment Types" },
                { value: "Permanent", label: "Permanent" },
                { value: "Contractor", label: "Contractor" },
                { value: "Intern", label: "Intern" },
                { value: "Part Time", label: "Part Time" },
              ]}
              placeholder="Employment Type"
            />
          </div>
          <div className="min-w-[140px]">
            <ModernSelect
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
              placeholder="Role"
            />
          </div>
          <div className="min-w-[160px]">
            <ModernSelect
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={departmentOptions}
              placeholder="Department"
            />
          </div>
          <div className="min-w-[170px]">
            <ModernSelect
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              options={balanceOptions}
              placeholder="Balance Status"
            />
          </div>
        </FilterRow>
      </FilterPanel>

      {/* ============ GROUPED TABLE ============ */}
      <GlobalTable
        columns={COLUMNS}
        data={filteredRows}
        emptyMessage={hasFilters ? "No employees match these filters" : "No employees found"}
        emptyIcon={<FaUsers className="w-7 h-7 text-muted" />}
        onEmptyAction={hasFilters ? resetFilters : undefined}
        emptyActionLabel="Clear all filters"
        actions={actions}
        rowsPerPage={10}
        defaultSort={{ key: "name", direction: "asc" }}
        countLabel="employees"
      />

      {/* ============ EDIT BALANCE MODAL ============ */}
      <EditLeaveBalanceModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
