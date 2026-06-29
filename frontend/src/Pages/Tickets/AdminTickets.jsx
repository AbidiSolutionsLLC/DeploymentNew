import React, { useState, useEffect } from "react";
import { Clock, Plus } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../axios";
import AdminRaiseTicketModal from "../../pages/tickets/RaiseTicketModal";
import ModernSelect from "../../components/ui/ModernSelect";
import PageContainer from "../../components/ui/PageContainer";
import GlassInput from "../../components/ui/GlassInput";
import FilterRow from "../../components/ui/FilterRow";
import TableWithPagination from "../../components/TableWithPagination";
import { STATUS_VARIANTS, resolveStatusVariant } from "../../components/StatusBadge";

const AdminTickets = () => {
 const [entriesPerPage, setEntriesPerPage] = useState(10);
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [priorityFilter, setPriorityFilter] = useState("all");
 const [startDate, setStartDate] = useState(null);
 const [endDate, setEndDate] = useState(null);
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

 // Combined filter logic
 const filteredTickets = tickets.filter((ticket) => {
 const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
 const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
 const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : null;
 const startOk = !startDate || (ticketDate && ticketDate >= startDate);
 const endOk = !endDate || (ticketDate && ticketDate <= new Date(endDate.getTime() + 86399999));
 return matchesSearch && matchesStatus && matchesPriority && startOk && endOk;
 });

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
  ${STATUS_VARIANTS[resolveStatusVariant(ticket.status)]?.badge || STATUS_VARIANTS.neutral.badge}`}>
 {ticket.status}
 </span>
 <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide 
 ${ticket.priority === "High Priority"
 ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400"
 : ticket.priority === "Medium Priority"
 ? "bg-yellow-100 text-yellow-800"
 : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400"
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
 <FilterRow>
 {/* Search */}
 <GlassInput
 placeholder="Search tickets by subject..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="flex-1 min-w-[180px]"
 />

 {/* Status Filter */}
 <div className="min-w-[140px]">
 <ModernSelect
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 options={[
 { value: "all", label: "All Status" },
 { value: "opened", label: "Open" },
 { value: "in progress", label: "In Progress" },
 { value: "closed", label: "Closed" },
 ]}
 placeholder="All Status"
 />
 </div>

 {/* Priority Filter */}
 <div className="min-w-[140px]">
 <ModernSelect
 value={priorityFilter}
 onChange={(e) => setPriorityFilter(e.target.value)}
 options={[
 { value: "all", label: "All Priority" },
 { value: "High Priority", label: "High" },
 { value: "Medium Priority", label: "Medium" },
 { value: "Low Priority", label: "Low" },
 ]}
 placeholder="All Priority"
 />
 </div>

 {/* Date Range */}
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

 {/* Entries per page */}
 <div className="min-w-[120px]">
 <ModernSelect
 value={entriesPerPage}
 onChange={(e) => setEntriesPerPage(Number(e.target.value))}
 options={[
 { value: 10, label: "10 entries" },
 { value: 25, label: "25 entries" },
 { value: 50, label: "50 entries" }
 ]}
 />
 </div>
 </FilterRow>
 }
 >
 <TableWithPagination
 columns={ticketColumns}
 data={filteredTickets}
 loading={loading}
 emptyMessage="No tickets found"
 rowsPerPage={entriesPerPage}
 defaultSort={{ key: "createdAt", direction: "desc" }}
 />
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