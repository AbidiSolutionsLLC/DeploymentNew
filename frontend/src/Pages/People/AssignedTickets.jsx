import { useEffect, useState, useRef } from "react";
import { 
  ClipboardDocumentCheckIcon, 
  FunnelIcon, 
  EyeIcon,
  XMarkIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from "@heroicons/react/24/solid";
import api from "../../axios";
import { toast } from "react-toastify";
import { format } from "date-fns";

export default function AssignedTickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal & Dropdown State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get("/auth/me");
      const user = userRes.data.user;
      setCurrentUser(user);

      const ticketRes = await api.get("/tickets");

      // RBAC RULE: Super Admin sees all. Technicians & Tech-Managers see assigned only 
      let myAssignments;
      if (user.role === "Super Admin") {
        myAssignments = ticketRes.data;
      } else {
        myAssignments = ticketRes.data.filter(t => {
          const assignId = t.assignedTo?._id || t.assignedTo;
          const myId = user._id || user.id;
          return assignId && String(assignId) === String(myId);
        });
      }
      
      setTickets(myAssignments);
      setFilteredTickets(myAssignments);
    } catch (err) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Close dropdown on click outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Advanced Filtering Logic
  useEffect(() => {
    let result = tickets;

    // Status Filter
    if (statusFilter !== "All") {
      if (statusFilter === "Open") {
        result = result.filter(t => t.status.toLowerCase() === "open" || t.status.toLowerCase() === "opened");
      } else {
        result = result.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
      }
    }

    // Priority Filter
    if (priorityFilter !== "All") {
      result = result.filter(t => t.priority.toLowerCase().includes(priorityFilter.toLowerCase()));
    }

    // Search Filter
    if (searchTerm) {
      result = result.filter(t => 
        t.ticketID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(result);
  }, [statusFilter, priorityFilter, searchTerm, tickets]);

  // 3. Handlers
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      const updatedList = tickets.map(t => t._id === ticketId ? { ...t, status: newStatus } : t);
      setTickets(updatedList);
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      setOpenDropdownId(null);
      toast.success("Status Updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDownload = (ticketId, attachmentId) => {
    const url = `https://abidipro.abidisolutions.com/api/web/tickets/${ticketId}/attachment/${attachmentId}`;
    window.open(url, "_blank");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSendingComment(true);
      const res = await api.post(`/tickets/${selectedTicket._id}/response`, {
        content: commentText,
        avatar: currentUser.avatar
      });
      setSelectedTicket(res.data);
      setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      setCommentText("");
      toast.success("Reply sent");
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setSendingComment(false);
    }
  };

  // UI Helpers
  const getPriorityColor = (p) => {
    if (p.includes("High")) return "bg-red-100 text-red-700";
    if (p.includes("Medium")) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  const getStatusColor = (s) => {
    const status = s.toLowerCase();
    if (status === "open") return "bg-blue-100 text-blue-700";
    if (status === "in progress") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-6 min-h-screen">
      
      {/* --- CONTAINER 1: HEADER & FILTERS --- */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
               <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Assigned Tickets</h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Manage your tasks efficiently
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search ID or Subject..." 
                className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Priority Filter */}
            <select 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              {["All", "Open", "In Progress", "Closed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                    statusFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTAINER 2: DATA TABLE --- */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-20 text-slate-400 text-xs font-bold">Loading tickets...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-20 text-slate-400 text-xs font-bold">No tickets match your filters.</td></tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        #{ticket.ticketID}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 pl-1 font-bold">
                        {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{ticket.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">{ticket.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.replace(' Priority', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === ticket._id ? null : ticket._id);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${getStatusColor(ticket.status)}`}
                      >
                        {ticket.status}
                        <ChevronDownIcon className="w-3 h-3 opacity-60" />
                      </button>

                      {openDropdownId === ticket._id && (
                        <div ref={dropdownRef} className="absolute left-6 top-10 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1 animate-fadeIn">
                          {["Open", "In Progress", "Closed"].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(ticket._id, s)}
                              className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 uppercase"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- TICKET DETAIL MODAL --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          
          <div className="relative bg-[#F8FAFC] w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                   {selectedTicket.subject}
                   <span className={`text-[10px] px-2 py-1 rounded-md border uppercase tracking-wider ${getPriorityColor(selectedTicket.priority)}`}>
                     {selectedTicket.priority}
                   </span>
                </h2>
                <p className="text-slate-400 text-xs font-mono mt-1 font-bold">Ticket ID: {selectedTicket.ticketID}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <PaperClipIcon className="w-4 h-4" /> Attachments
                    </h3>
                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedTicket.attachments.map((file, idx) => (
                           <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group hover:border-blue-200 transition-colors">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                  {file.name.split('.').pop().toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                              </div>
                              <button 
                                onClick={() => handleDownload(selectedTicket._id, file._id)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                                title="Download"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No files attached.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Discussion</h3>
                     {selectedTicket.responses?.map((res, idx) => (
                       <div key={idx} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex gap-4">
                          <img src={res.avatar || `https://ui-avatars.com/api/?name=${res.author}`} className="w-8 h-8 rounded-full border border-slate-100" />
                          <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-slate-800">{res.author}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{format(new Date(res.time), "MMM dd, hh:mm a")}</span>
                             </div>
                             <p className="text-sm text-slate-600 font-medium">{res.content}</p>
                          </div>
                       </div>
                     ))}
                     <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <textarea 
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type your reply here..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 font-medium"
                        ></textarea>
                        <button 
                          onClick={handleAddComment}
                          disabled={sendingComment}
                          className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {sendingComment ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"/> : <PaperAirplaneIcon className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Requester</h3>
                      <div className="flex items-center gap-3">
                         <img src={selectedTicket.user?.avatar || `https://ui-avatars.com/api/?name=${selectedTicket.emailAddress}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                         <div>
                            <p className="text-sm font-bold text-slate-700">{selectedTicket.user?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400 font-medium">{selectedTicket.emailAddress}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}