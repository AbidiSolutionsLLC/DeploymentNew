import React, { useState, useEffect, useMemo } from "react";
import { FiPlus } from "react-icons/fi";
import { useSelector } from "react-redux";
import api from "../../axios";
import RaiseTicketModal from "../../Pages/Tickets/RaiseTicketModal";
import ViewTicketDetailsModal from "../../Pages/Tickets/ViewTicketDetailsModal";
import { toast } from "react-toastify";
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [filterValues, setFilterValues] = useState({
    search: "",
    status: "all",
    priority: "all"
  });
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
        
        const currentUserId = user.user.id || user.user._id;
        const allTickets = res.data || [];
        
        // Filter ONLY tickets created by ME
        const myCreatedTickets = allTickets.filter(ticket => 
          ticket.closedBy && (ticket.closedBy._id === currentUserId || ticket.closedBy === currentUserId)
        );

        setTickets(myCreatedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = !filterValues.search || 
        ticket.ticketID?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(filterValues.search.toLowerCase());
      
      const matchesStatus = filterValues.status === "all" || 
        ticket.status?.toLowerCase() === filterValues.status.toLowerCase();
      
      const matchesPriority = filterValues.priority === "all" || 
        ticket.priority?.toLowerCase().includes(filterValues.priority.toLowerCase());

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, filterValues]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/tickets/${id}`);
      setTickets(prev => prev.filter((ticket) => ticket._id !== id));
      toast.success("Ticket deleted successfully!");
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    }
  };

  const filterConfig = [
    { name: "search", type: "search", placeholder: "Search ID, Subject..." },
    { 
      name: "status", 
      type: "select", 
      options: [
        { value: "all", label: "ALL STATUS" },
        { value: "opened", label: "OPEN" },
        { value: "in progress", label: "IN PROGRESS" },
        { value: "closed", label: "CLOSED" }
      ] 
    },
    {
      name: "priority",
      type: "select",
      options: [
        { value: "all", label: "ALL PRIORITY" },
        { value: "High Priority", label: "HIGH" },
        { value: "Medium Priority", label: "MEDIUM" },
        { value: "Low Priority", label: "LOW" }
      ]
    }
  ];

  const columns = [
    {
      key: "ticketID",
      label: "Ticket ID",
      sortable: true,
      render: (_, row) => (
        <span className="font-bold text-blue-600">
          #{row.ticketID || row._id?.slice(0, 8).toUpperCase() || 'N/A'}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (_, row) => (
        <span className="text-slate-600 whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (_, row) => (
        <div className="font-bold text-slate-700 truncate max-w-[200px]" title={row.subject}>
          {row.subject}
        </div>
      )
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (_, row) => (
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border ${
          row.priority === "High Priority" ? "bg-rose-50 text-rose-600 border-rose-100" :
          row.priority === "Medium Priority" ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-blue-50 text-blue-600 border-blue-100"
        }`}>
          {row.priority?.split(' ')[0]}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_, row) => (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border ${
          row.status === "closed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          row.status === "in progress" ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-blue-50 text-blue-600 border-blue-100"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            row.status === "closed" ? "bg-emerald-500" :
            row.status === "in progress" ? "bg-amber-500" :
            "bg-blue-500"
          }`} />
          {row.status}
        </div>
      )
    }
  ];

  const rowActions = [
    {
      label: "View",
      icon: "eye",
      onClick: (row) => setSelectedTicket(row)
    },
    {
      label: "Delete",
      icon: "trash",
      variant: "danger",
      onClick: (row) => handleDelete(row._id)
    }
  ];

  return (
    <div className="min-h-screen bg-transparent p-4">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">My Tickets</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Track your support requests
            </p>
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

      <FilterBar
        filters={filterConfig}
        values={filterValues}
        onChange={(name, value) => setFilterValues(prev => ({ ...prev, [name]: value }))}
        onReset={() => setFilterValues({ search: "", status: "all", priority: "all" })}
        totalResults={filteredTickets.length}
      />

      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <DataTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          rowActions={rowActions}
          onRowClick={(row) => setSelectedTicket(row)}
          emptyMessage="You haven't raised any tickets yet."
        />
      </div>

      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={(newTicket) => {
            setTickets((prev) => [...prev, newTicket]);
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
    </div>
  );
};

export default Ticket;