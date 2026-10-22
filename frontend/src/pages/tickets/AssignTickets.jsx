"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axios";
import { useConfirm } from "../../context/ConfirmContext";
import Toast from "../../components/Toast";
import ModernSelect from "../../components/ui/ModernSelect";
import { downloadFile } from "../../utils/downloadFile";
import { validateDescription, getApiError } from "../../utils/validationUtils";
import {
  FaArrowLeft, FaTrash, FaChevronDown, FaUser,
  FaCheck, FaUserPlus, FaPaperPlane, FaCalendarDay,
  FaPaperclip, FaTimes, FaCommentDots, FaFileAlt, FaDownload
} from "react-icons/fa";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import Loader from "../../components/ui/Loader";

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Closed", label: "Closed" }
];

const PRIORITY_OPTIONS = [
  { value: "High Priority", label: "High" },
  { value: "Medium Priority", label: "Medium" },
  { value: "Low Priority", label: "Low" }
];

const cleanPriority = (priority) =>
  String(priority || "Normal").replace(/\s*Priority$/i, "");

const statusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "closed") return "border-success-border bg-success-bg text-success";
  if (value === "in progress") return "border-info-border bg-info-bg text-info";
  return "border-warning-border bg-warning-bg text-warning";
};

const priorityTone = (priority) => {
  const value = String(priority || "").toLowerCase();
  if (value.includes("high") || value.includes("critical"))
    return "border-danger-border bg-danger-bg text-danger";
  if (value.includes("medium")) return "border-warning-border bg-warning-bg text-warning";
  return "border-border-subtle bg-app text-muted";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const Badge = ({ tone, children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {children}
  </span>
);

const SectionHeading = ({ icon, title, count }) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
      {icon}
      {title}
    </h3>
    {count !== undefined && (
      <span className="text-[11px] font-medium text-muted">{count}</span>
    )}
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="mb-1.5 text-[11px] font-medium text-muted">{children}</p>
);

const optionButtonClass = (active) =>
  `rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
    active
      ? "bg-surface text-heading shadow-sm ring-1 ring-border-subtle"
      : "text-muted hover:text-main"
  }`;

export const AdminTicketDetail = ({
  ticketId: ticketIdProp,
  embedded = false,
  onClose,
  onDeleted,
}) => {
  const navigate = useNavigate();
  const { ticketId: routeTicketId } = useParams();
  const ticketId = ticketIdProp || routeTicketId;

  const [ticket, setTicket] = useState(null);
  const [newResponse, setNewResponse] = useState("");
  const [responseError, setResponseError] = useState(null);
  const [commentFiles, setCommentFiles] = useState([]);
  const [sendingResponse, setSendingResponse] = useState(false);
  const commentFileRef = useRef(null);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
  const [assigningUserId, setAssigningUserId] = useState(null);

  const [technician, setTechnician] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [addTechnicianModal, setAddTechnicianModal] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const confirm = useConfirm();

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        const ticketData = res.data?.data || res.data;
        setTicket(ticketData);
        setSelectedAssigneeId(ticketData?.assignedTo?._id || ticketData?.assignedTo || null);
      } catch (error) {
        showToast(getApiError(error, "Failed to fetch ticket"), "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsersData = async () => {
      try {
        const res = await api.get("/users?status=Active");

        const usersArray = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCompanyUsers(usersArray);
        const safeUsers = usersArray.filter(u => u.role !== "SuperAdmin");

        const techList = safeUsers.filter(user =>
          user.role === 'Technician' ||
          user.isTechnician === true ||
          (user.designation && user.designation.toLowerCase() === 'technician')
        );
        setTechnician(techList);

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
    } else {
      setLoading(false);
    }
  }, [ticketId]);

  const assignToUser = async (userId) => {
    setAssigningUserId(userId);
    try {
      const res = await api.patch(`/tickets/${ticketId}/assign`, { assignedTo: userId });
      const updatedTicket = res.data?.data || res.data;
      setTicket(updatedTicket);
      setSelectedAssigneeId(userId);
      showToast("Ticket assigned successfully");
    } catch (error) {
      showToast(getApiError(error, "Failed to assign ticket"), "error");
    } finally {
      setAssignDropdownOpen(false);
      setAssigningUserId(null);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      const updatedStatus = res.data?.data?.status || res.data?.status || newStatus;
      setTicket(prev => ({ ...prev, status: updatedStatus }));
      showToast("Status updated");
    } catch (error) {
      showToast(getApiError(error, "Failed to update status"), "error");
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      const updatedPriority = res.data?.data?.priority || res.data?.priority || newPriority;
      setTicket(prev => ({ ...prev, priority: updatedPriority }));
      showToast("Priority updated");
    } catch (error) {
      showToast(getApiError(error, "Failed to update priority"), "error");
    }
  };

  const handleCommentFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    const next = [...commentFiles, ...selected].slice(0, 5);
    setCommentFiles(next);
    setResponseError(
      validateDescription(newResponse, { min: 10, max: 500, required: next.length === 0 })
    );
    event.target.value = "";
  };

  const removeCommentFile = (index) => {
    const next = commentFiles.filter((_, i) => i !== index);
    setCommentFiles(next);
    setResponseError(
      validateDescription(newResponse, { min: 10, max: 500, required: next.length === 0 })
    );
  };

  const handleSubmitResponse = async () => {
    const hasFiles = commentFiles.length > 0;
    const err = validateDescription(newResponse, {
      min: 10,
      max: 500,
      required: !hasFiles,
    });
    if (err) {
      setResponseError(err);
      return;
    }
    setResponseError(null);
    setSendingResponse(true);
    try {
      let payload;
      if (hasFiles) {
        payload = new FormData();
        payload.append("content", newResponse);
        payload.append("avatar", "👤");
        commentFiles.forEach((file) => payload.append("attachments", file));
      } else {
        payload = { content: newResponse, avatar: "👤" };
      }
      const res = await api.post(`/tickets/${ticketId}/response`, payload);
      const updatedTicket = res.data?.data || res.data;
      setTicket(updatedTicket);
      setNewResponse("");
      setCommentFiles([]);
      showToast("Response submitted");
    } catch (error) {
      showToast(getApiError(error, "Failed to submit response"), "error");
    } finally {
      setSendingResponse(false);
    }
  };

  const handleDeleteTicket = async () => {
    confirm({
      title: "Delete Ticket",
      message: `Are you sure you want to delete this ticket? Ticket #${ticket?.ticketID || ticket?._id?.slice(0, 8)} along with its discussion history and attachments will be permanently removed.`,
      confirmText: "Delete Ticket",
      onConfirmAction: async () => {
        try {
          await api.delete(`/tickets/${ticketId}`);
          showToast("Ticket deleted");
          if (onDeleted) {
            onDeleted();
          } else {
            setTimeout(() => navigate("/admin/assign-ticket", { replace: true }), 1000);
          }
        } catch (error) {
          showToast(getApiError(error, "Failed to delete ticket"), "error");
          throw error;
        }
      },
    });
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

  const renderAssigneeMenu = () => (
    <>
      <button
        onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-[13px] font-medium text-main transition-colors hover:bg-card-hover"
      >
        <FaUser size={13} className="text-muted" />
        <span className="hidden max-w-[140px] truncate sm:inline">
          {selectedAssignee ? selectedAssignee.name : "Assign"}
        </span>
        <FaChevronDown size={12} className="text-muted" />
      </button>

      {assignDropdownOpen && (
        <div className="absolute right-0 z-[9999] mt-2 max-h-60 w-64 overflow-y-auto rounded-lg border border-border-subtle bg-surface shadow-lg custom-scrollbar">
          {technician.length > 0 ? (
            <>
              <div className="border-b border-border-subtle px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Available technicians
              </div>
              {technician.map((user) => {
                const isAssigning = assigningUserId === user._id;
                return (
                  <button
                    key={user._id}
                    onClick={() => assignToUser(user._id)}
                    disabled={!!assigningUserId}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                      assigningUserId
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-card-hover"
                    } ${
                      selectedAssigneeId === user._id
                        ? "bg-brand/5 text-brand-text"
                        : "text-main"
                    }`}
                  >
                    <FaUser className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{user.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {user.designation || user.role}
                      </span>
                    </div>
                    {isAssigning ? (
                      <Loader variant="spinner" size="sm" className="ml-auto text-brand" />
                    ) : selectedAssigneeId === user._id ? (
                      <FaCheck className="ml-auto h-3.5 w-3.5 shrink-0 text-success" />
                    ) : null}
                  </button>
                );
              })}
            </>
          ) : (
            <div className="px-3 py-6 text-center">
              <FaUser className="mx-auto mb-2 h-6 w-6 text-muted/60" />
              <p className="text-xs font-semibold text-main">No technicians found</p>
              <p className="mt-1 text-[11px] text-muted">
                Use "Add technician" to update privileges.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (loading) {
    if (embedded) {
      return (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader size="md" />
        </div>
      );
    }
    return (
      <PageContainer title="Loading Ticket..." loading={true} isCard={false}>
        <div className="min-h-screen bg-transparent p-2 flex items-center justify-center"></div>
      </PageContainer>
    );
  }

  if (!ticket) {
    if (embedded) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
          <p className="text-sm font-medium text-muted">Ticket not found</p>
          <button
            onClick={onClose}
            className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-main transition-colors hover:bg-card-hover"
          >
            Close
          </button>
        </div>
      );
    }
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

  const currentAssignee = ticket.assignedTo?.name || selectedAssignee?.name || "Unassigned";

  const requesterUser =
    (ticket?.user && typeof ticket.user === "object" && ticket.user.name)
      ? ticket.user
      : (ticket?.closedBy && typeof ticket.closedBy === "object" && ticket.closedBy.name)
      ? ticket.closedBy
      : companyUsers.find(
          (u) =>
            (ticket?.emailAddress && u.email?.toLowerCase() === ticket.emailAddress?.toLowerCase()) ||
            (ticket?.user && (u._id === ticket.user || u.id === ticket.user)) ||
            (ticket?.closedBy && (u._id === ticket.closedBy || u.id === ticket.closedBy))
        ) ||
        allUsers.find(
          (u) =>
            (ticket?.emailAddress && u.email?.toLowerCase() === ticket.emailAddress?.toLowerCase()) ||
            (ticket?.user && (u._id === ticket.user || u.id === ticket.user)) ||
            (ticket?.closedBy && (u._id === ticket.closedBy || u.id === ticket.closedBy))
        );

  const rawRequesterName = requesterUser?.name || (typeof ticket?.user === "object" ? ticket?.user?.name : null) || (typeof ticket?.closedBy === "object" ? ticket?.closedBy?.name : null);
  const isInvalidRequesterName = !rawRequesterName || /unknown/i.test(rawRequesterName);
  const requesterName = !isInvalidRequesterName
    ? rawRequesterName
    : ticket?.emailAddress
    ? ticket.emailAddress.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {!embedded && (
        <div className="relative z-0">
          <button
            onClick={() => navigate("/admin/assign-ticket")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface hover:text-main"
            title="Back to tickets"
          >
            <FaArrowLeft size={14} />
            <span>Back to tickets</span>
          </button>
        </div>
      )}

      <PageContainer isCard={false}>
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted">
                  <span className="font-mono font-semibold text-main">
                    #{ticket.ticketID || ticket._id?.slice(0, 8)}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>Created {formatDateTime(ticket.createdAt)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-lg font-semibold leading-snug tracking-tight text-heading">
                    {ticket.subject || ticket.title || "Untitled ticket"}
                  </h1>
                  <Badge tone={statusTone(ticket.status)}>{ticket.status || "Open"}</Badge>
                  <Badge tone={priorityTone(ticket.priority)}>
                    {cleanPriority(ticket.priority)}
                  </Badge>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <div className="relative z-30">{renderAssigneeMenu()}</div>
                <button
                  onClick={() => setAddTechnicianModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-[13px] font-medium text-main transition-colors hover:bg-card-hover"
                  title="Add new technician"
                >
                  <FaUserPlus size={13} className="text-muted" />
                  <span className="hidden sm:inline">Add technician</span>
                </button>
                <button
                  onClick={() => handleDeleteTicket()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger"
                  title="Delete ticket"
                  aria-label="Delete ticket"
                >
                  <FaTrash size={14} />
                </button>
                {embedded && (
                  <button
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:bg-card-hover hover:text-main"
                    title="Close"
                    aria-label="Close ticket details"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-6">
              <section>
                <SectionHeading
                  icon={<FaFileAlt size={13} className="text-muted" />}
                  title="Description"
                />
                <div className="rounded-xl border border-border-subtle bg-surface p-4">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                    {ticket.description || "No description provided."}
                  </p>
                </div>
              </section>

              <section>
                <SectionHeading
                  icon={<FaPaperclip size={13} className="text-muted" />}
                  title="Attachments"
                  count={
                    ticket.attachments?.length
                      ? `${ticket.attachments.length} file${ticket.attachments.length === 1 ? "" : "s"}`
                      : undefined
                  }
                />
                <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {ticket.attachments.map((file, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => downloadFile(file.blobName || file.url, file.name)}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
                          title={`Download ${file.name}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-app text-[10px] font-semibold text-muted">
                            {file.name.split(".").pop().toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-main">
                            {file.name}
                          </span>
                          <FaDownload
                            size={14}
                            className="shrink-0 text-muted transition-colors group-hover:text-main"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-center text-xs text-muted">
                      No attachments
                    </p>
                  )}
                </div>
              </section>

              <section>
                <SectionHeading
                  icon={<FaCommentDots size={13} className="text-muted" />}
                  title="Activity"
                  count={
                    ticket.responses?.length
                      ? `${ticket.responses.length} ${ticket.responses.length === 1 ? "reply" : "replies"}`
                      : undefined
                  }
                />
                <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                  <div className="max-h-[420px] divide-y divide-border-subtle overflow-y-auto custom-scrollbar">
                    {ticket.responses?.map((res, i) => (
                      <div key={i} className="flex gap-3 px-4 py-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app text-[11px] font-semibold text-main ring-1 ring-border-subtle">
                          {res.avatar && res.avatar !== "👤" && !res.avatar.includes("Unknown") ? (
                            <img src={res.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            res.author?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[13px] font-semibold text-heading">
                              {res.author || "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted">
                              {formatDateTime(res.time)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                            {res.content}
                          </p>
                          {res.attachments?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {res.attachments.map((file, fileIdx) => (
                                <button
                                  key={fileIdx}
                                  type="button"
                                  onClick={() => downloadFile(file.blobName || file.url, file.name)}
                                  className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main transition-colors hover:bg-card-hover"
                                  title={`Download ${file.name}`}
                                >
                                  <FaPaperclip size={10} className="shrink-0 text-muted" />
                                  <span className="truncate">{file.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!ticket.responses || ticket.responses.length === 0) && (
                      <p className="px-4 py-8 text-center text-xs text-muted">
                        No replies yet
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border-subtle p-3">
                    <div
                      className={`rounded-lg border bg-surface transition-colors ${
                        responseError
                          ? "border-danger-border"
                          : "border-border-subtle focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10"
                      }`}
                    >
                      <textarea
                        value={newResponse}
                        onChange={(e) => {
                          setNewResponse(e.target.value);
                          setResponseError(
                            validateDescription(e.target.value, {
                              min: 10,
                              max: 500,
                              required: commentFiles.length === 0,
                            })
                          );
                        }}
                        onBlur={() =>
                          setResponseError(
                            validateDescription(newResponse, {
                              min: 10,
                              max: 500,
                              required: commentFiles.length === 0,
                            })
                          )
                        }
                        className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                        placeholder="Write a reply..."
                      />

                      {commentFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 border-t border-border-subtle px-3 py-2">
                          {commentFiles.map((file, idx) => (
                            <span
                              key={`${file.name}-${idx}`}
                              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main"
                            >
                              <FaPaperclip size={10} className="shrink-0 text-muted" />
                              <span className="truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeCommentFile(idx)}
                                className="shrink-0 text-muted transition-colors hover:text-danger"
                                aria-label={`Remove ${file.name}`}
                              >
                                <FaTimes size={9} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => commentFileRef.current?.click()}
                            disabled={commentFiles.length >= 5}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-main disabled:cursor-not-allowed disabled:opacity-40"
                            title="Attach files"
                          >
                            <FaPaperclip size={13} />
                          </button>
                          <input
                            ref={commentFileRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleCommentFileSelect}
                          />
                          <span className="text-[11px] text-muted">
                            {commentFiles.length}/5 attachments
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[11px] ${
                              newResponse.length > 500 ? "text-danger" : "text-muted"
                            }`}
                          >
                            {newResponse.length}/500
                          </span>
                          <GlassButton
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={FaPaperPlane}
                            onClick={handleSubmitResponse}
                            disabled={
                              sendingResponse ||
                              (!newResponse.trim() && commentFiles.length === 0) ||
                              !!responseError
                            }
                            isLoading={sendingResponse}
                          >
                            Send
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                    {responseError && (
                      <p className="mt-1.5 text-[11px] font-medium text-danger">
                        {responseError}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="min-w-0">
              <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
              <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                <div className="border-b border-border-subtle px-4 py-3.5">
                  <FieldLabel>Status</FieldLabel>
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-app p-1">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatusChange(option.value)}
                        className={optionButtonClass(
                          String(ticket.status || "").toLowerCase() ===
                            option.value.toLowerCase()
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-b border-border-subtle px-4 py-3.5">
                  <FieldLabel>Priority</FieldLabel>
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-app p-1">
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePriorityChange(option.value)}
                        className={optionButtonClass(
                          cleanPriority(ticket.priority).toLowerCase() ===
                            cleanPriority(option.value).toLowerCase()
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-b border-border-subtle px-4 py-3.5">
                  <FieldLabel>Assignee</FieldLabel>
                  <p className="truncate text-[13px] font-medium text-main">
                    {currentAssignee}
                  </p>
                  {ticket.assignedTo?.email && currentAssignee !== "Unassigned" && (
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {ticket.assignedTo.email}
                    </p>
                  )}
                </div>

                <div className="border-b border-border-subtle px-4 py-3.5">
                  <FieldLabel>Requester</FieldLabel>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app text-[11px] font-semibold text-main ring-1 ring-border-subtle">
                      {requesterName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-main">
                        {requesterName}
                      </p>
                      {ticket.emailAddress && requesterName !== ticket.emailAddress && (
                        <p className="truncate text-[11px] text-muted">
                          {ticket.emailAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  <FieldLabel>Created</FieldLabel>
                  <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                    <FaCalendarDay size={12} className="text-muted" />
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </PageContainer>

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
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug tracking-tight text-heading">
                Add technician
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Grant technician privileges to a team member.
              </p>
            </div>
          }
          footer={
            <>
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setAddTechnicianModal(false);
                  setSelectedUserToPromote(null);
                }}
                disabled={promoting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="button"
                variant="primary"
                onClick={handlePromoteToTechnician}
                isLoading={promoting}
                disabled={!selectedUserToPromote || promoting}
              >
                Grant Permission
              </GlassButton>
            </>
          }
        >
          <div className="space-y-5 p-1">
            <section>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-heading">Team member</h3>
                <span className="text-[11px] font-medium text-muted">
                  {allUsers.length} available
                </span>
              </div>
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
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Choose a user to grant access to the technician ticket queue.
              </p>
            </section>

            {selectedUserToPromote ? (
              <section>
                <h3 className="mb-2.5 text-sm font-semibold text-heading">Privilege summary</h3>
                <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                  <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-app text-[13px] font-semibold uppercase text-muted">
                      {selectedUserToPromote.name?.charAt(0) || <FaUser size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-main">
                        {selectedUserToPromote.name}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {selectedUserToPromote.email || "No email on file"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border-subtle bg-app px-2.5 py-1 text-[10px] font-medium text-muted">
                      {selectedUserToPromote.designation || selectedUserToPromote.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4">
                    <div>
                      <p className="text-[11px] font-medium text-muted">Current role</p>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-main">
                        {selectedUserToPromote.role || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted">Designation</p>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-main">
                        {selectedUserToPromote.designation || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2.5">
                    <FaCheck size={12} className="mt-0.5 shrink-0 text-brand-text" />
                    <p className="text-[11px] leading-relaxed text-muted">
                      This user will be added to the{" "}
                      <strong className="font-semibold text-main">technician list</strong>. Their
                      existing role and designation remain unchanged.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center">
                <FaUserPlus size={22} className="text-muted/60" />
                <p className="text-xs font-semibold text-main">No user selected</p>
                <p className="max-w-[260px] text-[11px] leading-relaxed text-muted">
                  Choose a team member above to preview their details and grant technician access.
                </p>
              </div>
            )}
          </div>
        </GlassModal>
      )}
    </>
  );
};

const AssignTicket = () => <AdminTicketDetail />;

export default AssignTicket;