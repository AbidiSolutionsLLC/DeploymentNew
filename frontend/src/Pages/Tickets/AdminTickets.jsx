import React, { useState, useEffect } from "react";
import { Search, Clock, Filter, SortDesc, Plus, AlertCircle, TrendingUp, CheckCircle } from "lucide-react";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
import AdminRaiseTicketModal from "../../pages/tickets/RaiseTicketModal";
import ModernSelect from "../../components/ui/ModernSelect";
import PageContainer from "../../components/ui/PageContainer";
import GlassInput from "../../components/ui/GlassInput";
import TableWithPagination from "../../components/TableWithPagination";

const AdminTickets = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await api.get("/tickets/all");
        const ticketsData = res.data?.data || res.data;
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleNewTicketSubmit = (newTicket) => {
    setTickets((prev) => [...prev, newTicket]);
    setShowModal(false);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status: res.data.status } : ticket
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await api.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, priority: newPriority } : ticket
        )
      );
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ticketColumns = [
    {
      key: "details",
      label: "Ticket Details",
      render: (_, ticket) => (
        <div className="flex flex-col">
          <div className="font-medium text-heading text-sm">{ticket.subject}</div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-muted font-mono">
              #{ticket.ticketID || ticket._id?.slice(0, 6)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide 
                ${ticket.status === "opened"
                ? "bg-green-100 text-green-800"
                : ticket.status === "in progress"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
              {ticket.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide 
                ${ticket.priority === "High Priority"
                ? "bg-red-100 text-red-800"
                : ticket.priority === "Medium Priority"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
              {ticket.priority}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3 h-3" />
              {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "raisedBy",
      label: "Raised By",
      render: (_, ticket) => (
        <div className="flex items-center gap-2">
          {ticket.closedBy?.avatar ? (
            <img src={ticket.closedBy.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <FaUserCircle className="text-muted w-6 h-6" />
          )}
          <div className="flex flex-col">
            <span className="text-xs text-main font-medium whitespace-nowrap">
              {ticket.closedBy?.name || "Unknown User"}
            </span>
            <span className="text-[10px] text-muted truncate max-w-[120px]" title={ticket.emailAddress}>
              {ticket.emailAddress}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (_, ticket) => (
        ticket.assignedTo ? (
          <div className="flex items-center gap-2">
            {ticket.assignedTo.avatar ? (
              <img src={ticket.assignedTo.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <FaUserCircle className="text-muted w-6 h-6" />
            )}
            <div className="flex flex-col">
              <span className="text-xs text-main font-medium whitespace-nowrap">
                {ticket.assignedTo.name || "Unknown Name"}
              </span>
              {ticket.assignedTo.email && (
                <span className="text-[10px] text-muted truncate max-w-[120px]" title={ticket.assignedTo.email}>
                  {ticket.assignedTo.email}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center border border-border-subtle">
              <FaUserCircle className="text-slate-300 w-4 h-4" />
            </div>
            <span className="text-xs text-muted italic">Unassigned</span>
          </div>
        )
      )
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, ticket) => (
        <div className="flex justify-end items-center gap-2">
          <div className="w-32">
            <ModernSelect
              value={ticket.status}
              onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
              options={[
                { value: "opened", label: "Opened" },
                { value: "in progress", label: "In Progress" },
                { value: "closed", label: "Closed" }
              ]}
              className="text-xs"
            />
          </div>
          <div className="w-32">
            <ModernSelect
              value={ticket.priority || "Medium Priority"}
              onChange={(e) => handlePriorityChange(ticket._id, e.target.value)}
              options={[
                { value: "High Priority", label: "High" },
                { value: "Medium Priority", label: "Medium" },
                { value: "Low Priority", label: "Low" }
              ]}
              className="text-xs"
            />
          </div>
          <button
            onClick={() => navigate(`/admin/assign-ticket/${ticket._id}`, { state: { ticket } })}
            className="border border-border-subtle px-3 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface/50 transition shadow-sm hover:shadow-md"
          >
            Assign
          </button>
        </div>
      )
    }
  ];

  return (
    <>
    <PageContainer
      title="Tickets Management"
      subtitle="Manage and assign support tickets"
      loading={loading}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Ticket
          </button>
        </div>
      }
      filters={
        <>
          <GlassInput
            placeholder="Search tickets by subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ModernSelect
            label="Show"
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            options={[
              { value: 10, label: "10 entries" },
              { value: 25, label: "25 entries" },
              { value: 50, label: "50 entries" }
            ]}
          />
        </>
      }
    >
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
        <TableWithPagination
          columns={ticketColumns}
          data={filteredTickets.slice(0, entriesPerPage)}
          loading={loading}
          emptyMessage="No tickets found"
        />
      </div>
    </PageContainer>
      {showModal && (
        <AdminRaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewTicketSubmit}
        />
      )}
    </>
  );
};

export default AdminTickets;