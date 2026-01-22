"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../axios";
import Toast from "../../Components/Toast"; // Import your custom Toast component
import {
  ArrowLeft, Trash2, ChevronDown, Flag, User,
  Calendar, Clock, Paperclip, Check,
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
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Toast State
  const [toast, setToast] = useState(null);

  // Helper to show custom toast
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

    const fetchAdmins = async () => {
      try {
        const res = await api.get("/users/admins");
        setAdminUsers(res.data);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to fetch admins", "error");
      }
    };

    if (ticketId) {
      fetchTicket();
      fetchAdmins();
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
        avatar: "👤"
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
      setTimeout(() => navigate("/admin/admintickets"), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete ticket", "error");
    }
  };

  const selectedAssignee = adminUsers.find((u) => u._id === selectedAssigneeId);

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
            onClick={() => navigate("/admin/admintickets")}
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
      {/* Render Custom Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/admin/admintickets")}
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

            <div className="relative">
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-50 border border-slate-100 overflow-hidden">
                  <div className="py-1">
                    {adminUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => assignToUser(user._id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition ${
                          selectedAssigneeId === user._id ? "bg-blue-50 text-blue-700" : "text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{user.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
              Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Responses</h3>
            <div className="space-y-3">
              {(ticket.responses || []).map((response, i) => (
                <div key={i} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {response.avatar || "👤"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-800">{response.author}</h4>
                        <span className="text-xs text-slate-500">{new Date(response.time).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{response.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="Type your response here..."
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitResponse}
                disabled={!newResponse.trim()}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  newResponse.trim() ? "bg-[#64748b] text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
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
        </div>
      </div>
    </div>
  );
};

export default AssignTicket;