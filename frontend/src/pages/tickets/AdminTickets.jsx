import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Search, UserPlus, Check } from "lucide-react";
import { UserPlusIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../axios";
import ModernSelect from "../../components/ui/ModernSelect";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
import GlassModal from "../../components/ui/GlassModal";
import Loader from "../../components/ui/Loader";
import FilterRow from "../../components/ui/FilterRow";
import FilterPanel from "../../components/ui/FilterPanel";
import StatCard from "../../components/ui/StatCard";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TableDate,
  TablePerson,
  TablePriority,
  TableStatus,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import Toast from "../../components/Toast";
import {
  FaTicketAlt,
  FaUserSlash,
  FaHourglassHalf,
  FaSpinner,
  FaCheckCircle,
  FaClipboardList,
  FaFileCsv,
  FaUserCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { downloadCsv } from "../../utils/tableUtils";
import { getApiError } from "../../utils/validationUtils";

const EASE = [0.16, 1, 0.3, 1];

const normalizeStatus = (status) => {
  if (!status) return "Open";
  const s = status.toLowerCase();
  if (s === "open" || s === "opened") return "Open";
  if (s === "in progress") return "In Progress";
  if (s === "closed") return "Closed";
  return status;
};

const normalizePriority = (priority) => {
  if (!priority) return "Medium Priority";
  const p = priority.toLowerCase();
  if (p === "high" || p === "high priority") return "High Priority";
  if (p === "medium" || p === "medium priority") return "Medium Priority";
  if (p === "low" || p === "low priority") return "Low Priority";
  return priority;
};

function AdminTickets() {
  const entriesPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [assignTicket, setAssignTicket] = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ==================== FETCH FUNCTIONS ====================
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/tickets/all");
      const ticketsData = res.data?.data || res.data;
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    setLoadingTechnicians(true);
    try {
      const res = await api.get("/users?status=Active");
      const usersArray = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const safeUsers = usersArray.filter((u) => u.role !== "SuperAdmin");
      const techList = safeUsers.filter(
        (user) =>
          user.role === "Technician" ||
          user.isTechnician === true ||
          (user.designation && user.designation.toLowerCase() === "technician")
      );
      setTechnicians(techList);
    } catch (err) {
      console.error("Failed to fetch technicians:", err);
    } finally {
      setLoadingTechnicians(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, [fetchTickets, fetchTechnicians]);

  const handleStatusChange = useCallback(async (ticketId, newStatus) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      const updatedStatus = res.data?.data?.status || res.data?.status || newStatus;
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status: updatedStatus } : ticket
        )
      );
      showToast(`Ticket ${newStatus} status updated`);
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast(getApiError(err, "Failed to update status"), "error");
    }
  }, [showToast]);

  const handlePriorityChange = useCallback(async (ticketId, newPriority) => {
    try {
      await api.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, priority: newPriority } : ticket
        )
      );
      showToast(`Ticket priority updated to ${newPriority}`);
    } catch (err) {
      console.error("Failed to update priority:", err);
      showToast(getApiError(err, "Failed to update priority"), "error");
    }
  }, [showToast]);

  const openTicketDetail = useCallback((ticket) => {
    navigate(`/admin/assign-ticket/${ticket._id}`, { state: { ticket } });
  }, [navigate]);

  const handleAssignTicket = async (ticketId, userId) => {
    setAssigningUserId(userId);
    try {
      const res = await api.patch(`/tickets/${ticketId}/assign`, { assignedTo: userId });
      const updatedTicket = res.data?.data || res.data;
      const assignedObj =
        updatedTicket?.assignedTo && typeof updatedTicket.assignedTo === "object"
          ? updatedTicket.assignedTo
          : technicians.find((u) => u._id === userId) || updatedTicket?.assignedTo;

      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, assignedTo: assignedObj } : t))
      );
      setAssignTicket((prev) =>
        prev && prev._id === ticketId ? { ...prev, assignedTo: assignedObj } : prev
      );
      showToast("Ticket assigned successfully");
    } catch (err) {
      showToast(getApiError(err, "Failed to assign ticket"), "error");
    } finally {
      setAssigningUserId(null);
    }
  };

  const filteredTechnicians = useMemo(() => {
    const query = assignSearch.trim().toLowerCase();
    if (!query) return technicians;
    return technicians.filter(
      (user) =>
        String(user.name || "").toLowerCase().includes(query) ||
        String(user.designation || user.role || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query)
    );
  }, [technicians, assignSearch]);

  // ------------ Tab scope + combined client-side filter ------------
  const getStatusInTab = useCallback((t) => {
    const st = (t.status || "").toLowerCase();
    switch (activeTab) {
      case 1: // Unassigned
        return !t.assignedTo;
      case 2: // Open
        return st === "open" || st === "opened";
      case 3: // In Progress
        return st === "in progress";
      case 4: // Closed
        return st === "closed";
      default:
        return true;
    }
  }, [activeTab]);

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tickets.filter((t) => {
      const inTab = getStatusInTab(t);
      const matchesSearch =
        !q ||
        String(t.subject || "").toLowerCase().includes(q) ||
        String(t.ticketID || "").toLowerCase().includes(q) ||
        String(t.closedBy?.name || "").toLowerCase().includes(q) ||
        String(t.assignedTo?.name || "").toLowerCase().includes(q) ||
        (t.emailAddress && String(t.emailAddress).toLowerCase().includes(q));

      const tPriority = normalizePriority(t.priority);
      const matchesPriority =
        priorityFilter === "all" || tPriority === priorityFilter;

      const ticketDate = t.createdAt ? new Date(t.createdAt) : null;
      const startOk = !startDate || (ticketDate && ticketDate >= startDate);
      const endOk = !endDate || (ticketDate && ticketDate <= new Date(endDate.getTime() + 86399999));
      return inTab && matchesSearch && matchesPriority && startOk && endOk;
    });
  }, [tickets, searchTerm, priorityFilter, startDate, endDate, getStatusInTab]);

  // ------------ helpers & counts ------------
  const unassignedCount = useMemo(() => tickets.filter((t) => !t.assignedTo).length, [tickets]);
  const inProgressCount = useMemo(
    () => tickets.filter((t) => (t.status || "").toLowerCase() === "in progress").length,
    [tickets]
  );
  const openCount = useMemo(
    () =>
      tickets.filter((t) => {
        const st = (t.status || "").toLowerCase();
        return st === "open" || st === "opened";
      }).length,
    [tickets]
  );
  const closedCount = useMemo(
    () => tickets.filter((t) => (t.status || "").toLowerCase() === "closed").length,
    [tickets]
  );
  const totalTickets = tickets.length;

  // ------------ priority options with live counts ------------
  const priorityOptions = useMemo(() => {
    return [
      { value: "all", label: "All Priority" },
      { value: "High Priority", label: "High" },
      { value: "Medium Priority", label: "Medium" },
      { value: "Low Priority", label: "Low" },
    ];
  }, []);

  // ------------ KPIs from filtered set ------------
  const filteredKpis = useMemo(() => {
    const isStatus = (t, s) => {
      const st = (t.status || "").toLowerCase();
      if (s === "Open") return st === "open" || st === "opened";
      if (s === "In Progress") return st === "in progress";
      if (s === "Closed") return st === "closed";
      return st === s.toLowerCase();
    };
    const count = (s) => filteredTickets.filter((r) => isStatus(r, s)).length;
    const days = (s) =>
      filteredTickets.filter((r) => isStatus(r, s)).reduce((sum, r) => sum + (r.daysCount || 0), 0);
    // Priority breakdown
    const priCounts = {};
    filteredTickets.forEach((t) => {
      const p = normalizePriority(t.priority);
      priCounts[p] = (priCounts[p] || 0) + 1;
    });
    return {
      total: filteredTickets.length,
      unassigned: unassignedCount,
      inProgress: inProgressCount,
      open: openCount,
      closed: closedCount,
      pending: count("Open"),
      approved: count("Closed"),
      pendingDays: days("Open"),
      approvedDays: days("Closed"),
      pendingPriority: priCounts["High Priority"] || 0,
      inProgressPriority: priCounts["Medium Priority"] || 0,
      lowPriority: priCounts["Low Priority"] || 0,
    };
  }, [filteredTickets, unassignedCount, inProgressCount, openCount, closedCount]);

  // ------------ Table columns (declared before any early returns) ------------
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
        key: "subject",
        label: "Ticket",
        sortable: false,
        render: (_, t) => (
          <div className="min-w-[230px] group/cell" title="Click to view ticket details">
            <TableTitle title={t.subject} maxWidth="max-w-[260px]" />
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <TableText
                value={`#${t.ticketID || t._id?.slice(0, 6) || "-"}`}
                className="font-mono"
                muted
              />
              <TableStatus value={t.status} />
              <TablePriority value={t.priority} />
              <TableDate value={t.createdAt} />
            </div>
          </div>
        ),
      },
      {
        key: "raisedBy",
        label: "Requester",
        render: (_, t) => {
          const rawName = t.user?.name || t.closedBy?.name;
          const name = (rawName && !/unknown/i.test(rawName))
            ? rawName
            : t.emailAddress
            ? t.emailAddress.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : "—";
          const avatarUrl = t.user?.avatar || t.closedBy?.avatar;
          return (
            <TablePerson
              name={name}
              subtitle={t.emailAddress || t.closedBy?.email || t.user?.email}
              avatar={avatarUrl}
            />
          );
        },
      },
      {
        key: "assignedTo",
        label: "Assignee",
        render: (_, t) => {
          if (t.assignedTo) {
            return (
              <TablePerson
                name={t.assignedTo.name || "Unknown Name"}
                subtitle={t.assignedTo.email}
                avatar={t.assignedTo.avatar}
              />
            );
          }
          return <TableText value="Unassigned" muted className="italic" />;
        },
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        render: (_, t) => (
          <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="w-28">
              <ModernSelect
                value={normalizeStatus(t.status)}
                onChange={(e) => handleStatusChange(t._id, e.target.value)}
                options={[
                  { value: "Open", label: "Open" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Closed", label: "Closed" },
                ]}
                placeholder="All Status"
              />
            </div>
            <div className="w-28">
              <ModernSelect
                value={normalizePriority(t.priority)}
                onChange={(e) => handlePriorityChange(t._id, e.target.value)}
                options={[
                  { value: "High Priority", label: "High" },
                  { value: "Medium Priority", label: "Medium" },
                  { value: "Low Priority", label: "Low" },
                ]}
                placeholder="All Priority"
              />
            </div>
            <button
              onClick={() => setAssignTicket(t)}
              className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-3 py-2 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm hover:shadow-md cursor-pointer"
              title="Assign this ticket to a technician"
            >
              <UserPlus size={14} />
              Assign
            </button>
          </div>
        ),
      },
    ],
    [handlePriorityChange, handleStatusChange]
  );

  // ------------ CSV export ------------
  const exportCsv = () => {
    const header = [
      "S.No.",
      "Ticket ID",
      "Subject",
      "Requester",
      "Email",
      "Assignee",
      "Priority",
      "Status",
      "Created On",
    ];
    const rows = filteredTickets.map((t, i) => {
      const rawName = t.user?.name || t.closedBy?.name;
      const name = (rawName && !/unknown/i.test(rawName))
        ? rawName
        : t.emailAddress
        ? t.emailAddress.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "—";
      return [
        i + 1,
        t.ticketID || t._id?.slice(0, 6) || "-",
        t.subject || "-",
        name,
        t.emailAddress || t.closedBy?.email || t.user?.email || "-",
        t.assignedTo?.name || "Unassigned",
        normalizePriority(t.priority),
        normalizeStatus(t.status),
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-",
      ];
    });
    downloadCsv(`tickets-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast("Ticket queue exported");
  };

  // ------------ Tabs ------------
  const tabs = [
    { key: 0, title: "All Tickets", icon: FaClipboardList, hint: "Every ticket in the queue" },
    {
      key: 1,
      title: "Unassigned",
      icon: FaUserSlash,
      hint: "Tickets waiting for an assignee",
      badge: unassignedCount,
    },
    { key: 2, title: "Open", icon: FaHourglassHalf, hint: "Newly raised, not yet started" },
    { key: 3, title: "In Progress", icon: FaSpinner, hint: "Actively being worked on" },
    { key: 4, title: "Closed", icon: FaCheckCircle, hint: "Resolved and closed tickets" },
  ];

  // ------------ Portal Hero ------------
  const heroChips = [
    { icon: FaTicketAlt, value: totalTickets, label: " Tickets" },
    { pulse: true, value: unassignedCount, label: " Awaiting assignment" },
    { icon: FaSpinner, value: inProgressCount, label: " In progress" },
  ];

  // ------------ Portal TabBar right ------------
  const rightTabActions = (
    <>
      <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
        Support queue
      </span>
    </>
  );

  // ------------ error render ------------
  if (error) {
    return (
      <PageContainer isCard={false}>
        <div className="glass-card text-center py-14">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
            <FaExclamationTriangle size={22} className="text-danger" />
          </div>
          <p className="text-sm font-bold text-heading">Failed to load tickets</p>
          <p className="text-xs text-muted mt-1 mb-5">
            We couldn't load the ticket queue. Please try again.
          </p>
          <GlassButton variant="primary" onClick={fetchTickets}>
            RETRY
          </GlassButton>
        </div>
      </PageContainer>
    );
  }

  // ------------ Render ------------
  return (
    <>
      {/* Toast (page-level messages) */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageContainer isCard={false}>
        <div className="flex flex-col gap-4 w-full">
          {/* ==================== HERO ==================== */}
          <PortalHero
            label="Ticket assignment overview"
            title="Ticket Assignment"
            description="Triage, assign and track every support ticket — from the moment it's raised to closure."
            chips={heroChips}
          />

          {/* ==================== TAB BAR ==================== */}
          <PortalTabBar
            tabs={tabs.map((t) => (t.key === 0 ? { ...t, badge: totalTickets } : t))}
            activeKey={activeTab}
            onChange={setActiveTab}
            idPrefix="ticket-tab"
            panelId="ticket-tabpanel"
            ariaLabel="Ticket sections"
            layoutId="tk-tab-pill"
            right={rightTabActions}
          />

          {/* Tab content — remount on change so it fades in fresh */}
          <Motion.div
            key={activeTab}
            id="ticket-tabpanel"
            role="tabpanel"
            aria-labelledby={`ticket-tab-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
            className="space-y-4"
          >
            {/* ==================== KPI CARDS ==================== */}
            <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total"
                value={filteredKpis.total}
                sub="Tickets in current view"
                icon={FaTicketAlt}
                tone="text-main"
                iconBg="bg-app"
              />
              <StatCard
                title="Unassigned"
                value={filteredKpis.unassigned}
                sub="Awaiting assignment"
                icon={FaUserSlash}
                tone="text-amber-600 dark:text-amber-400"
                iconBg="bg-amber-100 dark:bg-amber-900/40"
              />
              <StatCard
                title="In Progress"
                value={filteredKpis.inProgress}
                sub="Being worked on"
                icon={FaSpinner}
                tone="text-sky-600 dark:text-sky-400"
                iconBg="bg-sky-100 dark:bg-sky-900/40"
              />
              <StatCard
                title="Closed"
                value={filteredKpis.closed}
                sub="Resolved & closed"
                icon={FaCheckCircle}
                tone="text-emerald-600 dark:text-emerald-400"
                iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              />
            </div>

            {/* ==================== FILTERS ==================== */}
            <FilterPanel
              title="Ticket Queue"
              subtitle={`${filteredTickets.length} of ${totalTickets} tickets · updated just now`}
              hint="Click a row to open a ticket, or use Assign to send it to a technician."
              actions={
                <>
                  {(searchTerm ||
                    priorityFilter !== "all" ||
                    startDate ||
                    endDate ||
                    activeTab !== 0) && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setPriorityFilter("all");
                        setStartDate(null);
                        setEndDate(null);
                        setActiveTab(0);
                      }}
                    >
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
                  placeholder="Search tickets by subject, ticket ID or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[220px]"
                />
                <div className="min-w-[140px]">
                  <ModernSelect
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    options={priorityOptions}
                    placeholder="All Priority"
                  />
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 h-[42px]">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From date"
                    isClearable
                    className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0 !rounded-none !shadow-none"
                  />
                  <span className="text-muted text-xs">→</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="To date"
                    isClearable
                    className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0 !rounded-none !shadow-none"
                  />
                </div>
              </FilterRow>
            </FilterPanel>

            {/* ==================== TABLE ==================== */}
            <GlobalTable
              columns={columns}
              data={filteredTickets}
              loading={loading}
              emptyMessage={
                searchTerm || priorityFilter !== "all" || startDate || endDate || activeTab !== 0
                  ? "No tickets match these filters"
                  : "No tickets found"
              }
              onEmptyAction={() => {
                setSearchTerm("");
                setPriorityFilter("all");
                setStartDate(null);
                setEndDate(null);
                setActiveTab(0);
              }}
              emptyActionLabel="Clear all filters"
              actions={[]}
              rowsPerPage={entriesPerPage}
              defaultSort={{ key: "createdAt", direction: "desc" }}
              countLabel="tickets"
              onRowClick={openTicketDetail}
            />
          </Motion.div>
        </div>
      </PageContainer>

      {/* Assign Ticket Modal */}
      {assignTicket && (
        <GlassModal
          isOpen={!!assignTicket}
          onClose={() => {
            setAssignTicket(null);
            setAssignSearch("");
            setAssigningUserId(null);
          }}
          maxWidth="max-w-lg"
          title={
            <div>
              <h2 className="text-base sm:text-lg font-black text-heading tracking-widest uppercase">
                Assign Ticket
              </h2>
              <p className="text-muted text-xs font-mono mt-1 font-bold">
                #{assignTicket.ticketID || assignTicket._id?.slice(0, 6)} · {assignTicket.subject}
              </p>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Current assignee summary */}
            <div className="flex items-center gap-3 p-3 bg-surface border border-border-subtle rounded-xl">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                <FaUserCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  Current Assignee
                </p>
                <p className="text-sm font-bold text-heading truncate">
                  {assignTicket.assignedTo?.name || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search technicians by name, role or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-500/30 transition-all"
              />
            </div>

            {/* Technician list */}
            <div className="max-h-72 overflow-y-auto custom-scrollbar rounded-xl border border-border-subtle divide-y divide-border-subtle">
              {loadingTechnicians ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader text="Loading technicians..." size="md" />
                </div>
              ) : filteredTechnicians.length > 0 ? (
                filteredTechnicians.map((user) => {
                  const isAssigned =
                    (assignTicket.assignedTo?._id || assignTicket.assignedTo) === user._id;
                  const isAssigning = assigningUserId === user._id;
                  return (
                    <button
                      key={user._id}
                      onClick={() => handleAssignTicket(assignTicket._id, user._id)}
                      disabled={!!assigningUserId}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        isAssigned
                          ? "bg-amber-50 dark:bg-amber-900/30"
                          : "hover:bg-surface/70"
                      } ${assigningUserId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-border-subtle text-muted shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-main truncate">{user.name}</p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wide truncate">
                          {user.designation || user.role || "Employee"}
                        </p>
                      </div>
                      {isAssigning ? (
                        <Loader variant="spinner" size="sm" className="text-amber-500" />
                      ) : isAssigned ? (
                        <span className="lm-success-text inline-flex items-center gap-1">
                          <Check className="w-4 h-4" /> Assigned
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UserPlus className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-muted uppercase tracking-wider">
                      {technicians.length === 0
                        ? "No technicians available"
                        : "No matching technicians"}
                    </p>
                    <p className="text-xs text-muted">
                      {technicians.length === 0
                        ? "Add a technician from the ticket details page to enable assignment."
                        : "Try a different search term."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassModal>
      )}
    </>
  );
}

export default AdminTickets;