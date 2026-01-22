import React, { useState, useEffect } from "react";
import TableWithPagination from "../../Components/TableWithPagination"; // Add this import
import { FiTrash2, FiPlus } from "react-icons/fi";
import { FaEye, FaDownload } from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../../axios";
import RaiseTicketModal from "../../Pages/Tickets/RaiseTicketModal";
import ViewTicketDetailsModal from "../../Pages/Tickets/ViewTicketDetailsModal";
import { toast } from "react-toastify";
import { Spin } from "antd";
import AdminTickets from "./AdminTickets";

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!user?.user?.email) return;
        const res = await api.get(`/tickets`);
        setTickets(res.data || []);
        setFilteredTickets(res.data || []);
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
      opened: { color: "bg-green-100 text-green-800", label: "Open" },
      closed: { color: "bg-red-100 text-red-800", label: "Closed" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      "in progress": { color: "bg-blue-100 text-blue-800", label: "In Progress" }
    };

    const config = statusConfig[status?.toLowerCase()] || { color: "bg-slate-100 text-slate-800", label: status || "Unknown" };

    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Define columns for the table
  const ticketColumns = [
    {
      key: "ticketID",
      label: "Ticket ID",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-blue-600" title={row.ticketID || row._id}>
          #{row.ticketID || row._id.slice(0, 8).toUpperCase()}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-slate-600 whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (row) => (
        <div className="font-medium text-slate-700 truncate max-w-[200px]" title={row.subject}>
          {row.subject}
        </div>
      )
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => (
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
          row.priority === 'High Priority' || row.priority === 'high' ? 'bg-red-100 text-red-800' :
          row.priority === 'Medium Priority' || row.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {row.priority || 'Normal'}
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

  // Define actions for the table
  const ticketActions = [
    {
      icon: <FaEye size={16} />,
      title: "View Details",
      className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
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
    <div className="min-h-screen bg-transparent p-2">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">My Tickets</h2>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-slate-800">{filteredTickets.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg shadow-sm text-sm bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FiPlus className="h-4 w-4" />
              Raise Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
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

      {/* Modals */}
      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={(newTicket) => {
            setTickets((prev) => [...prev, newTicket]);
            setShowModal(false);
            // Refresh tickets
            const fetchTickets = async () => {
              try {
                const res = await api.get(`/tickets`);
                setTickets(res.data || []);
                setFilteredTickets(res.data || []);
              } catch (error) {
                console.error("Error refreshing tickets:", error);
              }
            };
            fetchTickets();
          }}
        />
      )}
      {selectedTicket && (
        <ViewTicketDetailsModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};

export default Ticket;