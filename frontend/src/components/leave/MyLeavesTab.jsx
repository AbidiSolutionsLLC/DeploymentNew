import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshUserData } from "../../slices/userSlice";
import {
  FaWallet,
  FaCalendarCheck,
  FaHourglassHalf,
  FaCheckCircle,
  FaFileCsv,
  FaPlus,
} from "react-icons/fa";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import FilterRow from "../ui/FilterRow";
import GlassInput from "../ui/GlassInput";
import ModernSelect from "../ui/ModernSelect";
import GlassButton from "../ui/GlassButton";
import StatCard from "../ui/StatCard";
import FilterPanel from "../ui/FilterPanel";
import GlobalTable from "../ui/GlobalTable";
import {
  TableDate,
  TablePill,
  TableStatus,
  TableText,
  TableTitle,
} from "../ui/TableCells";
import ApplyLeaveModal from "../LeaveModal";
import EditLeaveModal from "../EditLeaveModal";
import ViewLeaveModal from "../ViewLeaveModal";
import { getApiError } from "../../utils/validationUtils";
import {
  formatDisplayDate,
  parseISOToLocalDate,
  calculateWorkingDays,
} from "../../utils/dateUtils";
import { downloadCsv } from "../../utils/tableUtils";
import api from "../../axios";

/* Backend may return the duration as a number or "2 days" string */
const formatDuration = (leave) => {
  let durationVal = leave.daysTaken ?? leave.duration;
  if (durationVal === undefined || durationVal === null) {
    durationVal = calculateWorkingDays(
      parseISOToLocalDate(leave.startDate),
      parseISOToLocalDate(leave.endDate)
    );
  }

  let durationStr = durationVal;
  if (typeof durationVal === "number" || !isNaN(Number(durationVal))) {
    const num = Number(durationVal);
    durationStr = `${num} day${num === 1 ? "" : "s"}`;
  } else if (typeof durationVal === "string") {
    const match = durationVal.match(/^([\d.]+)\s*days?$/i);
    if (match) {
      const num = Number(match[1]);
      durationStr = `${num} day${num === 1 ? "" : "s"}`;
    }
  }
  return durationStr;
};

const parseDays = (durationStr) => {
  const match = String(durationStr).match(/^([\d.]+)/);
  return match ? Number(match[1]) : 0;
};

/**
 * People-portal "My Leaves" tab — the employee-facing mirror of the admin
 * Leave Requests tab (KPI cards + filter panel + GlobalTable + modals).
 */
export default function MyLeavesTab({ showToast }) {
  const dispatch = useDispatch();
  const [applyOpen, setApplyOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { user } = useSelector((state) => state.auth);
  const { userInfo, refreshing } = useSelector((state) => state.user);

  useEffect(() => {
    const userId = user?.data?.user?._id || user?.user?._id || user?._id || user?.id;
    if (userId) dispatch(refreshUserData(userId));
  }, [dispatch, user]);

  const leaveBalances = useMemo(() => userInfo?.leaves || {}, [userInfo]);
  const bookedLeaves = userInfo?.bookedLeaves || 0;
  const leaveHistory = useMemo(() => userInfo?.leaveHistory || [], [userInfo]);

  const availableBalance = Object.values(leaveBalances).reduce(
    (sum, balance) => sum + (balance || 0),
    0
  );

  /* ---------------- rows ---------------- */
  const rows = useMemo(() => {
    const sorted = [...leaveHistory].sort((a, b) => {
      const dateA = new Date(a.appliedAt || a.createdAt || a.startDate || 0);
      const dateB = new Date(b.appliedAt || b.createdAt || b.startDate || 0);
      return dateB - dateA;
    });

    return sorted.map((leave) => ({
      id: leave.leaveId?._id || leave.leaveId || leave._id,
      isEditable: !!leave.leaveId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      appliedAt: leave.appliedAt || leave.createdAt || leave.startDate,
      leaveType: leave.leaveType || leave.type || "-",
      reason: leave.reason || "-",
      duration: formatDuration(leave),
      daysNum: parseDays(formatDuration(leave)),
      status: leave.status || "Pending",
    }));
  }, [leaveHistory]);

  /* ---------------- filters ---------------- */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.leaveType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        formatDisplayDate(r.startDate).toLowerCase().includes(q) ||
        formatDisplayDate(r.endDate).toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || r.leaveType === typeFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rows, search, typeFilter, statusFilter]);

  const typeOptions = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      counts[r.leaveType] = (counts[r.leaveType] || 0) + 1;
    });
    return [
      { value: "all", label: "All Types" },
      ...Object.keys(counts).map((t) => ({ value: t, label: t })),
    ];
  }, [rows]);

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
    const count = (s) => filteredRows.filter((r) => r.status === s).length;
    const days = (s) =>
      filteredRows.filter((r) => r.status === s).reduce((sum, r) => sum + r.daysNum, 0);
    return {
      pending: count("Pending"),
      pendingDays: days("Pending"),
      approved: count("Approved"),
      approvedDays: days("Approved"),
      rejected: count("Rejected"),
    };
  }, [filteredRows]);

  /* ---------------- CSV export ---------------- */
  const exportCsv = () => {
    const header = [
      "S.No.",
      "Start Date",
      "End Date",
      "Leave Type",
      "Duration",
      "Reason",
      "Status",
      "Applied On",
    ];
    const rowsCsv = filteredRows.map((r, i) => [
      i + 1,
      r.startDate,
      r.endDate,
      r.leaveType,
      r.duration,
      r.reason,
      r.status,
      r.appliedAt ? formatDisplayDate(r.appliedAt) : "",
    ]);
    downloadCsv(`my-leaves-${new Date().toISOString().slice(0, 10)}.csv`, header, rowsCsv);
    showToast?.("Leave records exported");
  };

  /* ---------------- view / edit ---------------- */
  const handleViewLeave = async (leave) => {
    try {
      const response = await api.get(`/leaves/${leave.id}`);
      const fullLeaveData = response.data;
      setSelectedLeave({
        id: fullLeaveData._id,
        startDate: fullLeaveData.startDate,
        endDate: fullLeaveData.endDate,
        appliedAt: fullLeaveData.appliedAt || fullLeaveData.createdAt,
        name: fullLeaveData.employeeName,
        email: fullLeaveData.email,
        leaveType: fullLeaveData.leaveType,
        reason: fullLeaveData.reason || "-",
        duration: leave.duration,
        status: fullLeaveData.status,
      });
    } catch (error) {
      console.error("Failed to fetch leave details:", error);
      setSelectedLeave({
        ...leave,
        name: user?.user?.name || user?.name,
        email: user?.user?.email || user?.email,
      });
    }
    setViewModalOpen(true);
  };

  const handleEditLeave = async (leave) => {
    try {
      if (!leave.id) {
        showToast?.("Failed to load leave for editing", "error");
        return;
      }
      const response = await api.get(`/leaves/${leave.id}`);
      setEditingLeave(response.data);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch leave details for editing:", error);
      showToast?.(getApiError(error, "Failed to load leave for editing"), "error");
    }
  };

  const handleLeaveEdited = () => {
    if (userInfo?._id) dispatch(refreshUserData(userInfo._id));
    setEditModalOpen(false);
    setEditingLeave(null);
    showToast?.("Leave request updated");
  };

  const handleLeaveAdded = () => {
    if (userInfo?._id) dispatch(refreshUserData(userInfo._id));
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
        key: "startDate",
        label: "Leave Period",
        render: (_, row) => (
          <TableTitle
            title={`${formatDisplayDate(row.startDate)} → ${formatDisplayDate(row.endDate)}`}
            subtitle={row.duration}
            maxWidth="min-w-[165px]"
          />
        ),
      },
      {
        key: "leaveType",
        label: "Leave Type",
        render: (value) => <TablePill>{value}</TablePill>,
      },
      {
        key: "reason",
        label: "Reason",
        sortable: false,
        render: (_, row) => (
          <TableText value={row.reason} muted title={row.reason} clamp={2} maxWidth="max-w-[220px]" />
        ),
      },
      {
        key: "duration",
        label: "Duration",
        render: (value) => <TableText value={value} className="font-bold text-heading" />,
      },
      {
        key: "status",
        label: "Status",
        render: (_, row) => <TableStatus value={row.status} />,
      },
      {
        key: "appliedAt",
        label: "Applied On",
        render: (value) => <TableDate value={value} />,
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        icon: <EyeIcon className="w-4 h-4" />,
        title: "View request",
        onClick: (row) => handleViewLeave(row),
      },
      {
        icon: <PencilIcon className="w-4 h-4" />,
        title: "Edit request",
        className: (row) =>
          row.status === "Pending" && row.isEditable ? "" : "hidden",
        onClick: (row) => {
          if (row.status === "Pending" && row.isEditable) handleEditLeave(row);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userInfo]
  );

  return (
    <div className="space-y-4">
      {/* ============ KPI CARDS ============ */}
      <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Available Balance"
          value={availableBalance}
          sub={`${leaveBalances.pto || 0} PTO · ${leaveBalances.sick || 0} Sick days`}
          icon={FaWallet}
          tone="text-main"
          iconBg="bg-app"
        />
        <StatCard
          title="Booked Days"
          value={bookedLeaves}
          sub="Leave days availed so far"
          icon={FaCalendarCheck}
          tone="text-teal-600 dark:text-teal-400"
          iconBg="bg-teal-100 dark:bg-teal-900/40"
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
      </div>

      {/* ============ FILTERS ============ */}
      <FilterPanel
        title="Applied Leaves"
        subtitle={`${filteredRows.length} of ${rows.length} requests · updated just now`}
        hint="Click View on any request to see its details — pending requests can also be edited"
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
            <GlassButton variant="primary" size="sm" icon={FaPlus} onClick={() => setApplyOpen(true)}>
              APPLY LEAVE
            </GlassButton>
          </>
        }
      >
        <FilterRow>
          <GlassInput
            placeholder="Search by leave type, reason or date..."
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
      <GlobalTable
        columns={columns}
        data={filteredRows}
        loading={refreshing}
        emptyMessage={hasFilters ? "No requests match these filters" : "No leave requests found"}
        emptyActionLabel="Clear all filters"
        onEmptyAction={hasFilters ? resetFilters : undefined}
        actions={actions}
        rowsPerPage={10}
        defaultSort={{ key: "appliedAt", direction: "desc" }}
        countLabel="requests"
      />

      {/* ============ MODALS ============ */}
      <ApplyLeaveModal
        isOpen={applyOpen}
        setIsOpen={setApplyOpen}
        onLeaveAdded={handleLeaveAdded}
      />

      {selectedLeave && (
        <ViewLeaveModal
          isOpen={viewModalOpen}
          setIsOpen={setViewModalOpen}
          leaveData={selectedLeave}
          isAdminPortal={false}
        />
      )}

      {editingLeave && (
        <EditLeaveModal
          isOpen={editModalOpen}
          setIsOpen={setEditModalOpen}
          leaveData={editingLeave}
          onLeaveEdited={handleLeaveEdited}
        />
      )}
    </div>
  );
}
