"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../axios";
import Toast from "../../components/Toast";
import ModernSelect from "../../components/ui/ModernSelect";
import { downloadFile } from "../../utils/downloadFile";
import { validateDescription, getApiError } from "../../utils/validationUtils";
import {
  ArrowLeft, Trash2, ChevronDown, Flag, User,
  Clock, Check, UserPlus, Paperclip, Send
} from "lucide-react";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";

const AssignTicket = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const ticketData = location.state?.ticket;
 const ticketId = ticketData?._id;

 const [ticket, setTicket] = useState(null);
 const [newResponse, setNewResponse] = useState("");
 const [responseError, setResponseError] = useState(null);
 const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
 const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
 const [assigningUserId, setAssigningUserId] = useState(null);

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
 showToast(getApiError(error, "Failed to fetch ticket"), "error");
 } finally {
 setLoading(false);
 }
 };

 const fetchUsersData = async () => {
 try {
 const res = await api.get("/users?status=Active");

 const usersArray = Array.isArray(res.data) ? res.data : res.data.data || [];
 const safeUsers = usersArray.filter(u => u.role !== "SuperAdmin");

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
 showToast(getApiError(error, "Failed to fetch users"), "error");
 }
 };

 if (ticketId) {
 fetchTicket();
 fetchUsersData();
 }
 }, [ticketId]);

 const assignToUser = async (userId) => {
 setAssigningUserId(userId);
 try {
 const res = await api.patch(`/tickets/${ticketId}/assign`, { assignedTo: userId });
 setTicket(res.data);
 setSelectedAssigneeId(userId);
 showToast("Ticket assigned successfully");
 } catch (error) {
 showToast(getApiError(error, "Failed to assign ticket"), "error");
 } finally {
 setAssignDropdownOpen(false);
 setAssigningUserId(null);
 }
 };

 const handleSubmitResponse = async () => {
 const err = validateDescription(newResponse, { min: 10, max: 500, required: true });
 if (err) {
 setResponseError(err);
 return;
 }
 setResponseError(null);
 try {
 const res = await api.post(`/tickets/${ticketId}/response`, {
 content: newResponse,
 avatar: "👤" // Backend can use user's real avatar
 });
 setTicket(res.data);
 setNewResponse("");
 showToast("Response submitted");
 } catch (error) {
 showToast(getApiError(error, "Failed to submit response"), "error");
 }
 };

 const handleDeleteTicket = async () => {
 try {
 await api.delete(`/tickets/${ticketId}`);
 showToast("Ticket deleted");
 setTimeout(() => navigate("/admin/assign-ticket"), 1000);
 } catch (error) {
 showToast(getApiError(error, "Failed to delete ticket"), "error");
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
 showToast(getApiError(error, "Failed to update user"), "error");
 } finally {
 setPromoting(false);
 }
 };

 const selectedAssignee = technician.find((u) => u._id === selectedAssigneeId);

 if (loading) {
 return (
 <PageContainer title="Loading Ticket..." loading={true} isCard={false}>
 <div className="min-h-screen bg-transparent p-2 flex items-center justify-center"></div>
 </PageContainer>
 );
 }

 if (!ticket) {
 return (
 <PageContainer title="Ticket Not Found" isCard={false}>
 <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
 <div className="text-center">
 <p className="mt-3 text-sm font-medium text-muted">Ticket not found</p>
 <button
 onClick={() => navigate("/admin/assign-ticket")}
 className="mt-4 px-4 py-2 bg-surface text-main rounded-lg text-sm font-medium hover:bg-slate-200 transition"
 >
 Back to Tickets
 </button>
 </div>
 </div>
 </PageContainer>
 );
 }

 return (
 <PageContainer
 title={`Ticket #${ticket.ticketID || ticket._id?.slice(0, 6)}: ${ticket.subject || ticket.title}`}
 subtitle={`Created ${new Date(ticket.createdAt).toLocaleString()}`}
 isCard={false}
 headerActions={
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigate("/admin/assign-ticket")}
 className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 hover:bg-amber-200 dark:bg-amber-900/50 transition shadow-sm"
 title="Back to Tickets"
 >
 <ArrowLeft size={18} />
 </button>
 <button
 onClick={handleDeleteTicket}
 className="btn-ghost p-2 rounded-lg"
 title="Delete Ticket"
 >
 <Trash2 size={18} />
 </button>

 <button
 onClick={() => setAddTechnicianModal(true)}
 className="px-4 py-2 rounded-xl flex items-center gap-2 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 hover:brightness-95 transition-all shadow-sm hover:shadow-md"
 title="Add New Technician"
 >
 <UserPlus size={16} />
 <span className="text-sm font-medium hidden sm:inline">Add Technician</span>
 </button>

 {/* Assign Dropdown */}
 <div className="relative z-30">
 <button
 onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
 className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${selectedAssignee
 ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50"
 : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
 } hover:brightness-95`}
 >
 <User size={16} />
 <span className="text-sm font-medium hidden sm:inline">
 {selectedAssignee ? selectedAssignee.name : "Assign"}
 </span>
 <ChevronDown size={16} />
 </button>

 {assignDropdownOpen && (
 <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg z-[9999] border border-border-subtle overflow-hidden max-h-60 overflow-y-auto">
 <div className="py-1">
 {technician.length > 0 ? (
 <>
 <div className="px-3 py-2 text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle">
 Available Technicians
 </div>
 {technician.map((user) => {
  const isAssigning = assigningUserId === user._id;
  return (
  <button
  key={user._id}
  onClick={() => assignToUser(user._id)}
  disabled={!!assigningUserId}
  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
    !!assigningUserId ? "opacity-50 cursor-not-allowed" : "hover:bg-surface"
  } ${selectedAssigneeId === user._id ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "text-main"
  }`}
  >
  <User className="w-4 h-4 text-muted" />
  <div className="flex flex-col truncate flex-1">
  <span className="font-medium truncate">{user.name}</span>
  <span className="text-[10px] text-muted uppercase">
  {user.designation || user.role}
  </span>
  </div>
  {isAssigning ? (
    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin ml-auto" />
  ) : selectedAssigneeId === user._id ? (
  <Check className="w-4 h-4 text-green-500 ml-auto" />
  ) : null}
  </button>
  );
  })}
 </>
 ) : (
 <div className="px-3 py-3 text-center">
 <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
 <p className="text-sm text-muted font-medium">No technicians found</p>
 <p className="text-xs text-muted mt-1">Use "Add Technician" to update privileges</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 }
 >
 {toast && (
 <Toast
 message={toast.message}
 type={toast.type}
 onClose={() => setToast(null)}
 />
 )}

  {/* Add Technician Modal */}
  {addTechnicianModal && (
    <GlassModal
      isOpen={true}
      onClose={() => {
        if (!promoting) {
          setAddTechnicianModal(false);
          setSelectedUserToPromote(null);
        }
      }}
      maxWidth="max-w-md"
      title={
        <div>
          <h2 className="text-base sm:text-lg font-black text-heading tracking-widest uppercase">
            ADD TECHNICIAN
          </h2>
          <p className="text-[9px] text-muted font-black tracking-[0.2em] mt-1 uppercase">Grant Technician Privileges</p>
        </div>
      }
      footer={
        <div className="flex gap-3 sm:gap-4 w-full">
          <button
            type="button"
            onClick={() => {
              setAddTechnicianModal(false);
              setSelectedUserToPromote(null);
            }}
            disabled={promoting}
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-muted uppercase tracking-widest hover:text-muted transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handlePromoteToTechnician}
            disabled={!selectedUserToPromote || promoting}
            className="flex-1 sm:py-4 text-[10px] sm:text-[10px] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed btn btn-primary"
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
      }
    >
      <div className="space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar min-h-[400px]">
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
          <div className="bg-surface/50 border border-border-subtle rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-widest">NAME</p>
                <p className="text-sm font-bold text-main truncate">{selectedUserToPromote.name}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-widest">CURRENT DESIGNATION</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>
                  {selectedUserToPromote.designation || selectedUserToPromote.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-widest">ACTION</p>
                <p className="text-xs text-muted">
                  This user will be added to the <strong>Technician List</strong>. <br />
                  Their existing Role ({selectedUserToPromote.role}) and Designation will remain unchanged.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  )}

 {/* Main Content Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-0">

 {/* Left Column */}
 <div className="lg:col-span-2 space-y-4">
 {/* Description */}
 <div className="glass-card p-4 relative z-10">
 <h3 className="text-sm font-bold text-heading uppercase tracking-wide border-b border-border-subtle pb-2 mb-3">
 Description
 </h3>
 <p className="text-sm text-main leading-relaxed">{ticket.description}</p>
 </div>

 {/* DISCUSSION / CHAT SECTION */}
 <div className="glass-card p-4 relative z-10">
 <h3 className="text-sm font-bold text-heading uppercase tracking-wide mb-4">Discussion</h3>
 <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
 {ticket.responses?.map((res, i) => (
 <div key={i} className="bg-surface/50 rounded-xl p-3 border border-border-subtle">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 rounded-full text-sm font-bold shrink-0">
 {res.avatar && res.avatar !== "👤" && !res.avatar.includes("Unknown") ?
 <img src={res.avatar} alt="av" className="w-full h-full rounded-full object-cover" /> :
 res.author?.charAt(0)}
 </div>
 <div className="flex-1">
 <div className="flex justify-between mb-1">
 <h4 className="text-sm font-bold text-heading">{res.author}</h4>
 <span className="text-xs text-muted">{new Date(res.time).toLocaleString()}</span>
 </div>
 <p className="text-sm text-main whitespace-pre-wrap">{res.content}</p>
 </div>
 </div>
 </div>
 ))}
 {(!ticket.responses || ticket.responses.length === 0) && <p className="text-center text-xs text-muted italic">No messages yet.</p>}
 </div>

 <div className="relative">
 <textarea
 value={newResponse}
 onChange={e => {
 setNewResponse(e.target.value);
 setResponseError(validateDescription(e.target.value, { min: 10, max: 500, required: true }));
 }}
 onBlur={() => setResponseError(validateDescription(newResponse, { min: 10, max: 500, required: true }))}
 className={`glass-input pr-12 min-h-[60px] resize-none ${responseError ? "!border-red-400" : ""}`}
 placeholder="Type a reply (min 10 characters, at least 3 words)..."
 />
 {responseError && (
 <p className="text-xs text-red-500 mt-1">{responseError}</p>
 )}
 <button
 onClick={handleSubmitResponse}
 disabled={!newResponse.trim() || !!responseError}
 className="btn-ghost absolute right-2 p-2 rounded-lg"
 >
 <Send size={16} />
 </button>
 </div>
 </div>
 </div>

 {/* Right Column */}
 <div className="space-y-4">
 <div className="glass-card p-4 relative z-10">
 <h3 className="text-sm font-bold text-heading uppercase mb-3 border-b pb-2">Ticket Details</h3>
 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400"><Flag size={16} /></div>
 <div>
 <p className="text-xs font-medium text-muted uppercase">Priority</p>
 <p className="text-sm font-bold text-heading">{ticket.priority}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400"><User size={16} /></div>
 <div>
 <p className="text-xs font-medium text-muted uppercase">Assignee</p>
 <p className="text-sm font-bold text-heading">{selectedAssignee?.name || "Unassigned"}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="glass-card p-4 relative z-10">
 <h3 className="text-sm font-bold text-heading uppercase tracking-wide border-b border-border-subtle pb-2 mb-3">
 Attachments
 </h3>
 {ticket.attachments && ticket.attachments.length > 0 ? (
 <div className="space-y-2">
 {ticket.attachments.map((file, idx) => (
 <button
 key={idx}
 onClick={() => {
 downloadFile(file.blobName || file.url, file.name);
 }}
 className="w-full flex items-center justify-between p-3 bg-surface rounded-xl border border-border-subtle hover:bg-amber-50 dark:bg-amber-900/30 hover:border-amber-200 dark:border-amber-800/50 transition-all group"
 >
 <div className="flex items-center gap-2 overflow-hidden text-left">
 <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs">
 {file.name.split('.').pop().toUpperCase()}
 </div>
 <span className="text-xs font-bold text-main truncate">{file.name}</span>
 </div>
 <div className="text-muted group-hover:text-amber-600 dark:text-amber-400">
 <Paperclip size={16} />
 </div>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted italic">No attachments found.</p>
 )}
 </div>
 </div>
 </div>
 </PageContainer>
 );
};

export default AssignTicket;