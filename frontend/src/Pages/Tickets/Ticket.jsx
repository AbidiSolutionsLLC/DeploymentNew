import React, { useState, useEffect } from "react";
import TableWithPagination from "../../components/TableWithPagination"; 
import { FiTrash2, FiPlus } from "react-icons/fi";
import { FaEye } from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../../axios";
import RaiseTicketModal from "../../pages/tickets/RaiseTicketModal";
import ViewTicketDetailsModal from "../../pages/tickets/ViewTicketDetailsModal";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user from Redux
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!user?.user?.email) return;
        const res = await api.get(`/tickets`);
        
        // --- VISIBILITY FIX: Filter ONLY tickets created by ME ---
        // Even if backend sends assigned tickets (for Technicians), we filter here.
        const currentUserId = user.user.id || user.user._id;
        const allTickets = res.data || [];
        
        const myCreatedTickets = allTickets.filter(ticket => 
          ticket.closedBy && (ticket.closedBy._id === currentUserId || ticket.closedBy === currentUserId)
        );
        // --------------------------------------------------------

        setTickets(myCreatedTickets);
        setFilteredTickets(myCreatedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  useEffect(() => {
    const results = tickets.filter(
      (ticket) =>
        ticket.ticketID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTickets(results);
  }, [searchTerm, tickets]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tickets/${id}`);
      const updated = tickets.filter((ticket) => ticket._id !== id);
      setTickets(updated);
      setFilteredTickets(prev => prev.filter(t => t._id !== id));
      toast.success("Ticket deleted successfully!");
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      open: { color: "bg-green-100 text-green-800", label: "Open" },
      opened: { color: "bg-green-100 text-green-800", label: "Open" },
      closed: { color: "bg-red-100 text-red-800", label: "Closed" },
      "in progress": { color: "bg-amber-100 text-amber-800", label: "In Progress" }
    };

    const config = statusConfig[status?.toLowerCase()] || { color: "bg-surface text-heading", label: status || "Unknown" };

    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const ticketColumns = [
    {
      key: "ticketID",
      label: "Ticket ID",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-amber-600" title={row.ticketID || row._id}>
          #{row.ticketID || row._id.slice(0, 8).toUpperCase()}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-muted whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (row) => (
        <div className="font-bold text-main truncate max-w-[180px]" title={row.subject}>
          {row.subject}
        </div>
      )
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (row) => (
        <div className="text-muted truncate max-w-[200px]" title={row.description}>
          {row.description}
        </div>
      )
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => (
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
          row.priority?.toLowerCase().includes('high') ? 'bg-red-100 text-red-800' :
          row.priority?.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {row.priority?.replace(' Priority', '') || 'Normal'}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
  ];

  const ticketActions = [
    {
      icon: <FaEye size={16} />,
      title: "View Details",
      className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
      onClick: (row) => setSelectedTicket(row)
    },
    {
      icon: <FiTrash2 size={16} />,
      title: "Delete",
      className: "bg-red-50 text-red-600 hover:bg-red-100",
      onClick: (row) => handleDelete(row._id)
    }
  ];

  return (
    <PageContainer
      title="My Tickets"
      subtitle={
        <div className="flex items-center gap-1 mt-1">
          <span className="font-medium text-muted">Total Tickets:</span>
          <span className="font-bold text-heading">{filteredTickets.length}</span>
        </div>
      }
      loading={loading}
      isCard={true}
      headerActions={
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <FiPlus className="h-4 w-4" />
          Raise Ticket
        </button>
      }
      filters={
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg shadow-sm text-sm bg-white/80 backdrop-blur-sm text-main border border-border-subtle focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-muted transition-colors"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      }
    >
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
        <TableWithPagination
        columns={ticketColumns}
        data={filteredTickets}
        loading={loading}
        error={null}
        emptyMessage={
          searchTerm 
            ? `No tickets found matching "${searchTerm}"`
            : "You haven't raised any tickets yet. Click 'Raise Ticket' to get started."
        }
        onRowClick={(row) => setSelectedTicket(row)}
        actions={ticketActions}
        rowsPerPage={10}
      />

      </div>

      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={(newTicket) => {
            // Optimistic update
            setTickets((prev) => [...prev, newTicket]);
            setFilteredTickets((prev) => [...prev, newTicket]);
            setShowModal(false);
          }}
        />
      )}
      {selectedTicket && (
        <ViewTicketDetailsModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </PageContainer>
  );
};

export default Ticket;