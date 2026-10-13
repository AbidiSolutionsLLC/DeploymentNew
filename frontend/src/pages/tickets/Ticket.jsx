import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTicketAlt, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaEye, FaFileCsv, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { TicketIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import api from "../../axios";
import RaiseTicketModal from "../../pages/tickets/RaiseTicketModal";
import ViewTicketDetailsModal from "../../pages/tickets/ViewTicketDetailsModal";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import StatCard from "../../components/ui/StatCard";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import ModernSelect from "../../components/ui/ModernSelect";
import GlassButton from "../../components/ui/GlassButton";
import StyledTable from "../../components/ui/StyledTable";
import Toast from "../../components/Toast";
import {
  resolvePriorityPill,
  priorityLabel,
  statusBadgeClass,
} from "../../components/StatusBadge";
import { formatDisplayDate } from "../../utils/dateUtils";
import { downloadCsv } from "../../utils/tableUtils";
import { getApiError } from "../../utils/validationUtils";

const statusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "open" || s === "opened") return "Open";
  if (s === "closed") return "Closed";
  if (s === "in progress") return "In Progress";
  return status || "Unknown";
};

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState(null);

  const user = useSelector((state) => state.auth.user);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      if (!user?.email) return;
      setLoading(true);
      setError(false);
      const res = await api.get(`/tickets`);

      const currentUserId = user.id || user._id;
      const allTickets = res.data || [];

      const myCreatedTickets = allTickets.filter((ticket) => {
        const creatorId = ticket.closedBy?._id || ticket.closedBy || ticket.user?._id || ticket.user;
        return creatorId === currentUserId;
      });

      setTickets(myCreatedTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(true);
      showToast(getApiError(err, "Failed to load tickets"), "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tickets/${id}`);
      setTickets((prev) => prev.filter((ticket) => ticket._id !== id));
      showToast("Ticket deleted successfully");
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      showToast(getApiError(err, "Failed to delete ticket"), "error");
    }
  };

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch =
        !q ||
        String(ticket.ticketID || "").toLowerCase().includes(q) ||
        String(ticket.subject || "").toLowerCase().includes(q) ||
        String(ticket.description || "").toLowerCase().includes(q);
      const status = String(ticket.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && (status === "open" || status === "opened")) ||
        status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" ||
        String(ticket.priority || "").toLowerCase().includes(priorityFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const kpis = useMemo(() => {
    const count = (s) =>
      filteredTickets.filter((t) => String(t.status || "").toLowerCase() === s).length;
    return {
      total: filteredTickets.length,
      open: filteredTickets.filter((t) => {
        const s = String(t.status || "").toLowerCase();
        return s === "open" || s === "opened";
      }).length,
      inProgress: count("in progress"),
      closed: count("closed"),
    };
  }, [filteredTickets]);

  const hasFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const exportCsv = () => {
    const header = ["S.No.", "Ticket ID", "Subject", "Description", "Priority", "Status", "Raised On"];
    const rows = filteredTickets.map((t, i) => [
      i + 1,
      t.ticketID || t._id?.slice(0, 8) || "-",
      t.subject || "-",
      t.description || "-",
      priorityLabel(t.priority),
      statusLabel(t.status),
      t.createdAt ? formatDisplayDate(t.createdAt) : "-",
    ]);
    downloadCsv(`my-tickets-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast("My tickets exported");
  };

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
        key: "ticketID",
        label: "Ticket ID",
        render: (_, row) => (
          <span
            className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400"
            title={row.ticketID || row._id}
          >
            #{row.ticketID || row._id?.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        key: "subject",
        label: "Subject",
        render: (_, row) => (
          <div className="min-w-[180px] max-w-[240px]">
            <p className="text-sm font-bold text-heading truncate leading-tight">{row.subject}</p>
            <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{row.description}</p>
          </div>
        ),
      },
      {
        key: "priority",
        label: "Priority",
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${resolvePriorityPill(
              row.priority
            )}`}
          >
            {priorityLabel(row.priority)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${statusBadgeClass(
              row.status
            )}`}
          >
            {statusLabel(row.status)}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Raised On",
        render: (value) => (
          <span className="text-xs font-medium text-main whitespace-nowrap">
            {value ? formatDisplayDate(value) : "-"}
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
        title: "View ticket",
        onClick: (row) => setSelectedTicket(row),
      },
      {
        icon: <FaTimesCircle size={12} />,
        title: "Delete ticket",
        onClick: (row) => handleDelete(row._id),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const heroChips = [
    { icon: FaTicketAlt, value: kpis.total, label: " Tickets" },
    { icon: FaHourglassHalf, value: kpis.open, label: " Open" },
    { pulse: true, value: kpis.inProgress, label: " In progress" },
    { icon: FaCheckCircle, value: kpis.closed, label: " Closed" },
  ];

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Status" },
      { value: "open", label: "Open" },
      { value: "in progress", label: "In Progress" },
      { value: "closed", label: "Closed" },
    ],
    []
  );

  const priorityOptions = useMemo(
    () => [
      { value: "all", label: "All Priority" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" },
      { value: "Critical", label: "Critical" },
    ],
    []
  );

  if (error) {
    return (
      <PageContainer isCard={false}>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
        <div className="glass-card text-center py-14">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
            <FaExclamationTriangle size={22} className="text-danger" />
          </div>
          <p className="text-sm font-bold text-heading">Failed to load tickets</p>
          <p className="text-xs text-muted mt-1 mb-5">
            We couldn't load your tickets. Please try again.
          </p>
          <GlassButton variant="primary" onClick={fetchTickets}>
            RETRY
          </GlassButton>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer isCard={false} loading={loading}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col gap-4 w-full">
        <PortalHero
            label="Support center"
          title="My Tickets"
          description="Raise requests and track progress across your support tickets — all from one place."
          emblem={TicketIcon}
          chips={heroChips}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <GlassButton variant="primary" icon={FaPlus} onClick={() => setShowModal(true)}>
              Raise Ticket
            </GlassButton>
          </div>
        </div>

        <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Tickets"
            value={kpis.total}
            sub="Tickets you've raised"
            icon={FaTicketAlt}
            tone="text-main"
            iconBg="bg-app"
          />
          <StatCard
            title="Open"
            value={kpis.open}
            sub="Awaiting resolution"
            icon={FaHourglassHalf}
            tone="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-100 dark:bg-amber-900/40"
          />
          <StatCard
            title="In Progress"
            value={kpis.inProgress}
            sub="Being worked on"
            icon={FaSpinner}
            tone="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-100 dark:bg-indigo-900/40"
          />
          <StatCard
            title="Closed"
            value={kpis.closed}
            sub="Resolved tickets"
            icon={FaCheckCircle}
            tone="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          />
        </div>

        <FilterPanel
          title="Ticket filters"
          subtitle={`${filteredTickets.length} of ${tickets.length} tickets · updated just now`}
          hint="Click View on any ticket to open its full details and discussion thread"
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
              placeholder="Search ticket ID, subject or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            <div className="min-w-[160px]">
              <ModernSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                placeholder="All Status"
              />
            </div>
            <div className="min-w-[150px]">
              <ModernSelect
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={priorityOptions}
                placeholder="All Priority"
              />
            </div>
          </FilterRow>
        </FilterPanel>

        <StyledTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          emptyMessage={
            hasFilters
              ? "No tickets match these filters"
              : "You haven't raised any tickets yet. Click Raise Ticket to get started."
          }
          onEmptyAction={hasFilters ? resetFilters : undefined}
          emptyActionLabel="Clear all filters"
          actions={actions}
          rowsPerPage={10}
          defaultSort={{ key: "createdAt", direction: "desc" }}
          countLabel="tickets"
        />
      </div>

      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={(newTicket) => {
            setTickets((prev) => [...prev, newTicket]);
            setShowModal(false);
            showToast("Ticket submitted successfully");
          }}
          showToast={showToast}
        />
      )}
      {selectedTicket && (
        <ViewTicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          showToast={showToast}
        />
      )}
    </PageContainer>
  );
};

export default Ticket;
