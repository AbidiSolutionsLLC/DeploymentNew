import { useEffect, useState, useMemo } from "react";
import { 
  ClipboardDocumentCheckIcon, 
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/solid";
import api from "../../axios";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { downloadFile } from "../../utils/downloadFile";
import { Paperclip, Eye } from "lucide-react";
import { validateDescription, getApiError } from "../../utils/validationUtils";
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";
import ModernSelect from "../../Components/ui/ModernSelect";

export default function AssignedTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [filterValues, setFilterValues] = useState({
    search: "",
    status: "All",
    priority: "All"
  });
  
  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);

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
    } catch (err) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Filtering Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = !filterValues.search || 
        ticket.ticketID?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(filterValues.search.toLowerCase());
      
      const matchesStatus = filterValues.status === "All" || 
        (filterValues.status === "Open" ? (ticket.status?.toLowerCase() === "open" || ticket.status?.toLowerCase() === "opened") : ticket.status?.toLowerCase() === filterValues.status.toLowerCase());
      
      const matchesPriority = filterValues.priority === "All" || 
        ticket.priority?.toLowerCase().includes(filterValues.priority.toLowerCase());

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, filterValues]);

  // 3. Handlers
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      toast.success("Status Updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDownload = async (blobName, originalName) => {
    if (!blobName) {
      toast.error("File details missing");
      return;
    }
    await downloadFile(blobName, originalName);
  };

  const handleAddComment = async () => {
    const err = validateDescription(commentText, { min: 10, max: 500, required: true });
    if (err) { setCommentError(err); return; }
    setCommentError(null);
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
      toast.error(getApiError(err, "Failed to send reply"));
    } finally {
      setSendingComment(false);
    }
  };

  const filterConfig = [
    { name: "search", type: "search", placeholder: "Search ID, Subject..." },
    { 
      name: "status", 
      type: "select", 
      options: [
        { value: "All", label: "ALL STATUS" },
        { value: "Open", label: "OPEN" },
        { value: "In Progress", label: "IN PROGRESS" },
        { value: "Closed", label: "CLOSED" }
      ] 
    },
    {
      name: "priority",
      type: "select",
      options: [
        { value: "All", label: "ALL PRIORITY" },
        { value: "High", label: "HIGH" },
        { value: "Medium", label: "MEDIUM" },
        { value: "Low", label: "LOW" }
      ]
    }
  ];

  const columns = [
    {
      key: "ticketID",
      label: "Ticket ID",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
            #{row.ticketID}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-bold">
            {format(new Date(row.createdAt), "MMM dd, yyyy")}
          </span>
        </div>
      )
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{row.subject}</span>
          <span className="text-xs text-slate-400 line-clamp-1 font-medium">{row.description}</span>
        </div>
      )
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
          row.priority.toLowerCase().includes("high") ? "bg-rose-50 text-rose-600 border-rose-100" :
          row.priority.toLowerCase().includes("medium") ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-emerald-50 text-emerald-600 border-emerald-100"
        }`}>
          {row.priority.replace(' Priority', '')}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <div className="w-32">
          <ModernSelect
            value={row.status}
            onChange={(e) => handleStatusChange(row._id, e.target.value)}
            options={[
              { value: "Open", label: "OPEN" },
              { value: "In Progress", label: "IN PROGRESS" },
              { value: "Closed", label: "CLOSED" }
            ]}
            className="text-[10px] font-bold uppercase"
          />
        </div>
      )
    }
  ];

  const rowActions = [
    {
      label: "View",
      icon: "eye",
      onClick: (row) => setSelectedTicket(row)
    }
  ];

  return (
    <div className="p-6 min-h-screen">
      
      {/* Header */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
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
        </div>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filterValues}
        onChange={(name, value) => setFilterValues(prev => ({ ...prev, [name]: value }))}
        onReset={() => setFilterValues({ search: "", status: "All", priority: "All" })}
        totalResults={filteredTickets.length}
      />

      {/* Data Table */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden mb-6">
        <DataTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          rowActions={rowActions}
          onRowClick={(row) => setSelectedTicket(row)}
          emptyMessage="No tickets assigned to you."
        />
      </div>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          
          <div className="relative bg-[#F8FAFC] w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                   {selectedTicket.subject}
                   <span className={`text-[10px] px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                     selectedTicket.priority.toLowerCase().includes("high") ? "bg-rose-50 text-rose-600 border-rose-100" :
                     selectedTicket.priority.toLowerCase().includes("medium") ? "bg-amber-50 text-amber-600 border-amber-100" :
                     "bg-emerald-50 text-emerald-600 border-emerald-100"
                   }`}>
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
                           <button 
                             key={idx}
                             onClick={() => handleDownload(file.blobName, file.name)}
                             className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all group text-left"
                           >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                  {file.name.split('.').pop().toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                              </div>
                              <div className="text-slate-400 group-hover:text-blue-600">
                                <Paperclip size={16}/>
                              </div>
                           </button>
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
                          onChange={(e) => {
                            setCommentText(e.target.value);
                            setCommentError(validateDescription(e.target.value, { min: 10, max: 500, required: true }));
                          }}
                          onBlur={() => setCommentError(validateDescription(commentText, { min: 10, max: 500, required: true }))}
                          placeholder="Type your reply (min 10 chars, at least 3 words)..."
                          className={`flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 font-medium ${commentError ? "placeholder:text-red-300" : ""}`}
                        ></textarea>
                        <button 
                          onClick={() => {
                            if (!commentError) handleAddComment();
                          }}
                          disabled={sendingComment || !!commentError}
                          className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {sendingComment ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"/> : <PaperAirplaneIcon className="w-5 h-5" />}
                        </button>
                     </div>
                      {commentError && (
                        <p className="text-xs text-red-500 mt-1 pl-2">{commentError}</p>
                     )}
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