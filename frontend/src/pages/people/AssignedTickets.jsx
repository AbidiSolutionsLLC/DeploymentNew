import { useEffect, useState } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
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

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await api.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, priority: newPriority } : t))
      );
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, priority: newPriority }));
      }
      showToast(`Priority updated to ${newPriority.replace(" Priority", "")}`);
    } catch (err) {
      showToast(getApiError(err, "Failed to update priority"), "error");
    }
  };

  const handleAddComment = async (ticketId, commentText, files = []) => {
    const hasFiles = files.length > 0;
    const err = validateDescription(commentText, {
      min: 10,
      max: 500,
      required: !hasFiles,
    });
    if (err) return { error: err };
    try {
      let payload;
      if (hasFiles) {
        payload = new FormData();
        payload.append("content", commentText);
        if (currentUser?.avatar) payload.append("avatar", currentUser.avatar);
        files.forEach((file) => payload.append("attachments", file));
      } else {
        payload = { content: commentText, avatar: currentUser?.avatar };
      }
      const res = await api.post(`/tickets/${ticketId}/response`, payload);
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
        <TableText
          value={`#${ticket.ticketID}`}
          title={ticket.ticketID}
          className="font-mono font-bold text-brand-text"
        />
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (_, ticket) => (
        <TableTitle
          title={ticket.subject}
          subtitle={ticket.description}
          maxWidth="max-w-[240px]"
        />
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (_, ticket) => <TablePriority value={ticket.priority} />,
    },
    {
      key: "status",
      label: "Status",
      render: (_, ticket) => <TableStatus value={ticket.status} />,
    },
    {
      key: "assignedTo",
      label: "Requester",
      render: (_, ticket) => {
        const rawName = ticket.user?.name || ticket.closedBy?.name;
        const name = (rawName && !/unknown/i.test(rawName))
          ? rawName
          : ticket.emailAddress
          ? ticket.emailAddress.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "—";
        const avatarUrl = ticket.user?.avatar || ticket.closedBy?.avatar;
        return (
          <TablePerson
            name={name}
            subtitle={ticket.emailAddress}
            avatar={avatarUrl}
            className="min-w-[140px]"
          />
        );
      },
    },
    {
      key: "createdAt",
      label: "Raised On",
      render: (value) => <TableDate value={value} />,
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

        <GlobalTable
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
          onPriorityChange={handlePriorityChange}
          onAddComment={handleAddComment}
          onDownload={handleDownload}
          showToast={showToast}
        />
      )}
    </PageContainer>
  );
}
