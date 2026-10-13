import { useEffect, useState } from "react";
import { EyeIcon } from "@heroicons/react/24/solid";
import api from "../../axios";
import { downloadFile } from "../../utils/downloadFile";
import { validateDescription, getApiError } from "../../utils/validationUtils";
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
import AssignedTicketDetailsModal from "./AssignedTicketDetailsModal";
import {
  FaClipboardCheck,
  FaHourglassHalf,
  FaSpinner,
  FaCheckCircle,
  FaTicketAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/20/solid";
import {
  resolvePriorityPill,
  priorityLabel,
  statusBadgeClass,
} from "../../components/StatusBadge";
import { formatDisplayDate } from "../../utils/dateUtils";
import { getInitials } from "../../utils/tableUtils";

const statusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "open" || s === "opened") return "Open";
  if (s === "closed") return "Closed";
  if (s === "in progress") return "In Progress";
  return status || "Unknown";
};

export default function AssignedTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch Data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const userRes = await api.get("/auth/me");
        const user = userRes.data.user;
        if (cancelled) return;
        setCurrentUser(user);

        const ticketRes = await api.get("/tickets");
        if (cancelled) return;

        // RBAC RULE: Super Admin sees all. Technicians & Tech-Managers see assigned only
        let myAssignments;
        if (user.role === "Super Admin") {
          myAssignments = ticketRes.data;
        } else {
          myAssignments = ticketRes.data.filter((t) => {
            const assignId = t.assignedTo?._id || t.assignedTo;
            const myId = user._id || user.id;
            return assignId && String(assignId) === String(myId);
          });
        }

        setTickets(myAssignments);
      } catch {
        if (!cancelled) {
          setError(true);
          showToast("Failed to load tickets", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Filtering
  const filteredTickets = (() => {
    let result = tickets;

    if (statusFilter !== "all") {
      if (statusFilter === "open") {
        result = result.filter(
          (t) =>
            String(t.status).toLowerCase() === "open" ||
            String(t.status).toLowerCase() === "opened"
        );
      } else {
        result = result.filter(
          (t) => String(t.status).toLowerCase() === statusFilter.toLowerCase()
        );
      }
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) =>
        String(t.priority || "").toLowerCase().includes(priorityFilter.toLowerCase())
      );
    }

    if (searchTerm) {
      result = result.filter(
        (t) =>
          String(t.ticketID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(t.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  })();

  const kpis = {
    total: filteredTickets.length,
    open: filteredTickets.filter((t) => {
      const s = String(t.status || "").toLowerCase();
      return s === "open" || s === "opened";
    }).length,
    inProgress: filteredTickets.filter(
      (t) => String(t.status || "").toLowerCase() === "in progress"
    ).length,
    closed: filteredTickets.filter((t) => String(t.status || "").toLowerCase() === "closed")
      .length,
  };

  const hasFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // 3. Handlers
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
      );
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
      showToast("Status Updated");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleDownload = async (blobName, originalName) => {
    if (!blobName) {
      showToast("File details missing", "error");
      return;
    }
    await downloadFile(blobName, originalName);
  };

  const handleAddComment = async (ticketId, commentText) => {
    const err = validateDescription(commentText, { min: 10, max: 500, required: true });
    if (err) return { error: err };
    try {
      const res = await api.post(`/tickets/${ticketId}/response`, {
        content: commentText,
        avatar: currentUser?.avatar,
      });
      setTickets((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(res.data);
      }
      showToast("Reply sent");
      return { ticket: res.data };
    } catch (err) {
      return { error: getApiError(err, "Failed to send reply") };
    }
  };

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const columns = [
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
      render: (_, ticket) => (
        <span
          className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400"
          title={ticket.ticketID}
        >
          #{ticket.ticketID}
        </span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (_, ticket) => (
        <div className="min-w-[180px] max-w-[240px]">
          <p className="text-sm font-bold text-heading truncate leading-tight">{ticket.subject}</p>
          <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{ticket.description}</p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (_, ticket) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${resolvePriorityPill(
            ticket.priority
          )}`}
        >
          {priorityLabel(ticket.priority)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, ticket) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${statusBadgeClass(
            ticket.status
          )}`}
        >
          {statusLabel(ticket.status)}
        </span>
      ),
    },
    {
      key: "assignedTo",
      label: "Requester",
      render: (_, ticket) => {
        const name = ticket.user?.name || ticket.emailAddress || "Unknown";
        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center text-[11px] font-black flex-shrink-0 overflow-hidden">
              {ticket.user?.avatar ? (
                <img
                  src={ticket.user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-heading truncate leading-tight">
                {ticket.user?.name || "Unknown"}
              </p>
              <p className="text-[10px] text-muted truncate">{ticket.emailAddress}</p>
            </div>
          </div>
        );
      },
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
  ];

  const actions = [
    {
      icon: <EyeIcon className="w-4 h-4" />,
      title: "View ticket",
      onClick: (ticket) => openTicketDetail(ticket),
    },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "in progress", label: "In Progress" },
    { value: "closed", label: "Closed" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
    { value: "Critical", label: "Critical" },
  ];

  const heroChips = [
    { icon: FaTicketAlt, value: kpis.total, label: " Assigned" },
    { icon: FaHourglassHalf, value: kpis.open, label: " Open" },
    { pulse: true, value: kpis.inProgress, label: " In progress" },
    { icon: FaCheckCircle, value: kpis.closed, label: " Closed" },
  ];

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
          <p className="text-sm font-bold text-heading">Failed to load assigned tickets</p>
          <p className="text-xs text-muted mt-1 mb-5">
            We couldn't load your assigned tickets. Please try again.
          </p>
          <GlassButton variant="primary" onClick={() => window.location.reload()}>
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
             label="Technician workspace"
           title="Assigned Tickets"
           description="Track tickets assigned to you, update statuses and reply to requesters — all from one place."
           emblem={ClipboardDocumentCheckIcon}
           chips={heroChips}
         />

        <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Assigned"
            value={kpis.total}
            sub="Tickets assigned to you"
            icon={FaClipboardCheck}
            tone="text-main"
            iconBg="bg-app"
          />
          <StatCard
            title="Open"
            value={kpis.open}
            sub="Awaiting action"
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
          title="Assigned ticket filters"
          subtitle={`${filteredTickets.length} of ${tickets.length} tickets · updated just now`}
          hint="Click View on any ticket to update its status, download attachments or reply in the discussion thread"
        >
          <FilterRow>
            <GlassInput
              placeholder="Search ticket ID or subject..."
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
            {hasFilters && (
              <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                RESET
              </GlassButton>
            )}
          </FilterRow>
        </FilterPanel>

        <StyledTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          emptyMessage={
            hasFilters ? "No tickets match your filters" : "No tickets assigned to you yet."
          }
          onEmptyAction={hasFilters ? resetFilters : undefined}
          emptyActionLabel="Clear all filters"
          actions={actions}
          rowsPerPage={10}
          defaultSort={{ key: "createdAt", direction: "desc" }}
          countLabel="tickets"
        />
      </div>

      {selectedTicket && showDetailModal && (
        <AssignedTicketDetailsModal
          ticket={selectedTicket}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicket(null);
          }}
          onStatusChange={handleStatusChange}
          onAddComment={handleAddComment}
          onDownload={handleDownload}
          showToast={showToast}
        />
      )}
    </PageContainer>
  );
}
