"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../axios";
import Toast from "../../Components/Toast";
import ModernSelect from "../../Components/ui/ModernSelect"; 
import {
  ArrowLeft, Trash2, ChevronDown, Flag, User,
  Clock, Check, UserPlus, Paperclip, Send
} from "lucide-react";

const AssignTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  const ticketId = ticketData?._id;

  const [ticket, setTicket] = useState(null);
  const [newResponse, setNewResponse] = useState("");
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
  
  const [technician, setTechnician] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [addTechnicianModal, setAddTechnicianModal] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState(null);
  const [promoting, setPromoting] = useState(false);
  
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        setTicket(res.data);
        setSelectedAssigneeId(res.data.assignedTo?._id || null);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch ticket", "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsersData = async () => {
      try {
        const res = await api.get("/users?status=Active");
        
        const safeUsers = res.data.filter(u => u.role !== "SuperAdmin");

        // 1. Identify Technicians
        const techList = safeUsers.filter(user => 
          user.role === 'Technician' || 
          user.isTechnician === true ||
          (user.designation && user.designation.toLowerCase() === 'technician')
        );
        setTechnician(techList);

        // 2. Identify Promotable Users
        const promotableList = safeUsers.filter(user => 
          user.role !== 'Technician' && 
          user.isTechnician !== true &&
          (user.designation && user.designation.toLowerCase() !== 'technician')
        );
        setAllUsers(promotableList);

      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch users", "error");
      }
    };

    if (ticketId) {
      fetchTicket();
      fetchUsersData();
    }
  }, [ticketId]);

  const assignToUser = async (userId) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/assign`, { assignedTo: userId });
      setTicket(res.data);
      setSelectedAssigneeId(userId);
      showToast("Ticket assigned successfully");
    } catch (error) {
      showToast("Failed to assign ticket", "error");
    } finally {
      setAssignDropdownOpen(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (newResponse.trim() === "") return;
    try {
      const res = await api.post(`/tickets/${ticketId}/response`, {
        content: newResponse,
        avatar: "👤" // Backend can use user's real avatar
      });
      setTicket(res.data);
      setNewResponse("");
      showToast("Response submitted");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to submit response", "error");
    }
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticketId}`);
      showToast("Ticket deleted");
      setTimeout(() => navigate("/admin/assign-ticket"), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete ticket", "error");
    }
  };

  const handlePromoteToTechnician = async () => {
    if (!selectedUserToPromote) {
      showToast("Please select a user to promote", "error");
      return;
    }

    setPromoting(true);
    try {
      const response = await api.put(`/users/${selectedUserToPromote._id}`, {
        isTechnician: true 
      });
      
      const updatedUser = response.data;

      setTechnician(prev => {
        if (!prev.find(u => u._id === updatedUser._id)) {
          return [...prev, updatedUser];
        }
        return prev;
      });
      
      setAllUsers(prev => prev.filter(u => u._id !== updatedUser._id));
      
      showToast(`${updatedUser.name} added to Technician list`);
      setAddTechnicianModal(false);
      setSelectedUserToPromote(null);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update user", "error");
    } finally {
      setPromoting(false);
    }
  };

  const selectedAssignee = technician.find((u) => u._id === selectedAssigneeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
        <div className="text-center">
          <p className="mt-3 text-sm font-medium text-slate-500">Ticket not found</p>
          <button
            onClick={() => navigate("/admin/assign-ticket")}
            className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-2">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Add Technician Modal */}
      {addTechnicianModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !promoting) {
              setAddTechnicianModal(false);
              setSelectedUserToPromote(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden">
            <button 
              onClick={() => {
                setAddTechnicianModal(false);
                setSelectedUserToPromote(null);
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
              disabled={promoting}
            >
              &times;
            </button>

            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
                ADD TECHNICIAN
              </h2>
              <p className="text-[9px] text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Grant Technician Privileges</p>
            </div>

            <div className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar min-h-[400px]">
              <ModernSelect
                label="SELECT USER"
                name="userSelect"
                value={selectedUserToPromote?._id || ""}
                onChange={(e) => {
                  const user = allUsers.find(u => u._id === e.target.value);
                  setSelectedUserToPromote(user);
                }}
                options={allUsers.map(user => ({
                  value: user._id,
                  label: `${user.name.toUpperCase()} (${user.designation || user.role})`
                }))}
                placeholder="Choose a user..."
                disabled={promoting}
              />

              {selectedUserToPromote && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NAME</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{selectedUserToPromote.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CURRENT DESIGNATION</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-600`}>
                        {selectedUserToPromote.designation || selectedUserToPromote.role}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ACTION</p>
                      <p className="text-xs text-slate-600">
                        This user will be added to the <strong>Technician List</strong>. <br/>
                        Their existing Role ({selectedUserToPromote.role}) and Designation will remain unchanged.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setAddTechnicianModal(false);
                  setSelectedUserToPromote(null);
                }}
                disabled={promoting}
                className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
              <button 
                type="button"
                onClick={handlePromoteToTechnician}
                disabled={!selectedUserToPromote || promoting}
                className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    UPDATING...
                  </span>
                ) : (
                  "GRANT PERMISSION"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Interface */}
      <div className="relative z-[99]">
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/admin/assign-ticket")}
                className="p-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
                title="Back to Tickets"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="truncate">
                <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight truncate">
                  Ticket #{ticket.ticketID || ticket._id?.slice(0, 6)}: {ticket.subject || ticket.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    Created {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteTicket}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
                title="Delete Ticket"
              >
                <Trash2 size={18} />
              </button>

              <button
                onClick={() => setAddTechnicianModal(true)}
                className="px-4 py-2 rounded-xl flex items-center gap-2 bg-purple-100 text-purple-800 border border-purple-200 hover:brightness-95 transition-all shadow-sm hover:shadow-md"
                title="Add New Technician"
              >
                <UserPlus size={16} />
                <span className="text-sm font-medium">Add Technician</span>
              </button>

              {/* Assign Dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                    selectedAssignee 
                      ? "bg-green-100 text-green-800 border border-green-200" 
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  } hover:brightness-95`}
                >
                  <User size={16} />
                  <span className="text-sm font-medium">
                    {selectedAssignee ? selectedAssignee.name : "Assign Ticket"}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {assignDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-[9999] border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                    <div className="py-1">
                      {technician.length > 0 ? (
                        <>
                          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Available Technicians
                          </div>
                          {technician.map((user) => (
                            <button
                              key={user._id}
                              onClick={() => assignToUser(user._id)}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition ${
                                selectedAssigneeId === user._id ? "bg-blue-50 text-blue-700" : "text-slate-700"
                              }`}
                            >
                              <User className="w-4 h-4 text-slate-500" />
                              <div className="flex flex-col truncate">
                                <span className="font-medium truncate">{user.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {user.designation || user.role}
                                </span>
                              </div>
                              {selectedAssigneeId === user._id && (
                                <Check className="w-4 h-4 text-green-500 ml-auto" />
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-3 text-center">
                          <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500 font-medium">No technicians found</p>
                          <p className="text-xs text-slate-400 mt-1">Use "Add Technician" to update privileges</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-0">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
              Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
          </div>

          {/* DISCUSSION / CHAT SECTION */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Discussion</h3>
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {ticket.responses?.map((res, i) => (
                    <div key={i} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-bold shrink-0">
                                {res.avatar && res.avatar !== "👤" && !res.avatar.includes("Unknown") ? 
                                  <img src={res.avatar} alt="av" className="w-full h-full rounded-full object-cover"/> : 
                                  res.author?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <h4 className="text-sm font-bold text-slate-800">{res.author}</h4>
                                    <span className="text-xs text-slate-500">{new Date(res.time).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{res.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {(!ticket.responses || ticket.responses.length === 0) && <p className="text-center text-xs text-slate-400 italic">No messages yet.</p>}
            </div>
            
            <div className="relative">
                <textarea 
                  value={newResponse} 
                  onChange={e => setNewResponse(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl p-3 pr-12 text-sm focus:ring-2 focus:ring-blue-100 min-h-[60px] resize-none" 
                  placeholder="Type a reply..." 
                />
                <button 
                  onClick={handleSubmitResponse} 
                  disabled={!newResponse.trim()} 
                  className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <Send size={16}/>
                </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-3 border-b pb-2">Ticket Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-800"><Flag size={16} /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Priority</p>
                  <p className="text-sm font-bold text-slate-800">{ticket.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800"><User size={16} /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Assignee</p>
                  <p className="text-sm font-bold text-slate-800">{selectedAssignee?.name || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
              Attachments
            </h3>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="space-y-2">
                {ticket.attachments.map((file, idx) => (
                  <a 
                    key={idx}
                    href={`http://localhost:4000/api/web/tickets/${ticket._id}/attachment/${file._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                        {file.name.split('.').pop().toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-600">
                      <Paperclip size={16}/>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No attachments found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTicket;