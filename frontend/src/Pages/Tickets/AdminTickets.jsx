import React, { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
import AdminRaiseTicketModal from "../../Pages/Tickets/RaiseTicketModal";
import ModernSelect from "../../Components/ui/ModernSelect";
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";
import { toast } from "react-toastify";

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState({
    search: "",
    status: "all",
    priority: "all"
  });
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await api.get("/tickets/all");
        setTickets(res.data || []);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast.error("Failed to load tickets");
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
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
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
      toast.success("Priority updated");
    } catch (err) {
      console.error("Failed to update priority:", err);
      toast.error("Failed to update priority");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = !filterValues.search || 
        ticket.ticketID?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(filterValues.search.toLowerCase());
      
      const matchesStatus = filterValues.status === "all" || 
        ticket.status?.toLowerCase() === filterValues.status.toLowerCase();
      
      const matchesPriority = filterValues.priority === "all" || 
        ticket.priority?.toLowerCase().includes(filterValues.priority.toLowerCase());

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, filterValues]);

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
      key: "ticketDetails",
      label: "Ticket Details",
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-800 text-sm">{row.subject}</span>
          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
            #{row.ticketID || row._id?.slice(0, 6)}
          </span>
        </div>
      )
    },
    {
      key: "closedBy",
      label: "Raised By",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.closedBy?.avatar ? (
            <img src={row.closedBy.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <FaUserCircle className="text-slate-400 w-6 h-6" />
          )}
          <div className="flex flex-col">
            <span className="text-xs text-slate-700 font-bold whitespace-nowrap">
              {row.closedBy?.name || "Unknown User"}
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {row.emailAddress}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "assignedTo",
      label: "Assignee",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.assignedTo ? (
            <>
              {row.assignedTo.avatar ? (
                <img src={row.assignedTo.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <FaUserCircle className="text-slate-400 w-6 h-6" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 font-bold whitespace-nowrap">
                  {row.assignedTo.name || "Unknown Name"}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {row.assignedTo.email}
                </span>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_, row) => (
        <div className="w-28">
          <ModernSelect
            value={row.status}
            onChange={(e) => handleStatusChange(row._id, e.target.value)}
            options={[
              { value: "opened", label: "OPENED" },
              { value: "in progress", label: "IN PROGRESS" },
              { value: "closed", label: "CLOSED" }
            ]}
            className="text-[10px] font-bold uppercase"
          />
        </div>
      )
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (_, row) => (
        <div className="w-28">
          <ModernSelect
            value={row.priority || "Medium Priority"}
            onChange={(e) => handlePriorityChange(row._id, e.target.value)}
            options={[
              { value: "High Priority", label: "HIGH" },
              { value: "Medium Priority", label: "MEDIUM" },
              { value: "Low Priority", label: "LOW" }
            ]}
            className="text-[10px] font-bold uppercase"
          />
        </div>
      )
    }
  ];

  const rowActions = [
    {
      label: "Assign",
      icon: "user-plus",
      onClick: (row) => navigate(`/admin/assign-ticket/${row._id}`, { state: { ticket: row } })
    }
  ];

  return (
    <div className="min-h-screen bg-transparent p-4">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Tickets Management
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Manage and assign support tickets
            </p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary gap-2 shadow-lg shadow-blue-100"
          >
            <Plus size={14} /> CREATE TICKET
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
          onRowClick={(row) => navigate(`/admin/assign-ticket/${row._id}`, { state: { ticket: row } })}
          emptyMessage="No support tickets found."
        />
      </div>

      {showModal && (
        <AdminRaiseTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewTicketSubmit}
        />
      )}
    </div>
  );
};

export default AdminTickets;