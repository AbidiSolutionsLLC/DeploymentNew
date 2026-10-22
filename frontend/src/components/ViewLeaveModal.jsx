import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaCommentDots,
  FaEnvelope,
  FaFileAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { Send, Clock, Paperclip, Edit2 } from "lucide-react";
import { FiTrash2 } from "react-icons/fi";
import ModernSelect from "./ui/ModernSelect";
import api from "../axios";
import Toast from "../components/Toast";
import { useSelector } from "react-redux";
import { validateDescription, getApiError } from "../utils/validationUtils";
import { parseISOToLocalDate, formatDisplayDate } from "../utils/dateUtils";
import GlassButton from "./ui/GlassButton";
import { useConfirm } from "../context/ConfirmContext";
import Loader from "./ui/Loader";
import DetailModal, {
  DetailBadge,
  DetailField,
  DetailFooterButton,
  DetailSectionHeading,
} from "./ui/DetailModal";

const statusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "border-success-border bg-success-bg text-success";
  if (value === "rejected") return "border-danger-border bg-danger-bg text-danger";
  if (value === "pending") return "border-warning-border bg-warning-bg text-warning";
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

const leaveDuration = (leaveData) => {
  if (leaveData?.duration) return leaveData.duration;
  const daysCount =
    Math.ceil(
      (parseISOToLocalDate(leaveData.endDate) - parseISOToLocalDate(leaveData.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1;
  return `${daysCount} day${daysCount === 1 ? "" : "s"}`;
};

const ViewLeaveModal = ({
  isOpen,
  setIsOpen,
  leaveData,
  onStatusChange,
  fetchLeaveRequests,
  isAdminPortal = false,
}) => {
  const confirm = useConfirm();
  const { user } = useSelector((state) => state.auth);

  const userRole = (user?.user?.role || user?.role || "")
    .replace(/\s+/g, "")
    .toLowerCase();
  const canUpdateStatus =
    isAdminPortal && ["superadmin", "admin", "manager"].includes(userRole);

  const [selectedStatus, setSelectedStatus] = useState(leaveData?.status || "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState("");
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [responsesError, setResponsesError] = useState(false);

  const showToast = (message, type = "success") => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchResponses = async (isPolling = false) => {
    try {
      if (!isPolling) setLoadingResponses(true);
      setResponsesError(false);
      const response = await api.get(`/leaves/${leaveData.id}/responses`);
      setResponses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch responses:", error);
      setResponsesError(true);
    } finally {
      if (!isPolling) setLoadingResponses(false);
    }
  };

  useEffect(() => {
    let intervalId;

    const startPolling = () => {
      fetchResponses(false);
      intervalId = setInterval(() => {
        fetchResponses(true);
      }, 5000);
    };

    if (isOpen && leaveData?.id) {
      startPolling();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leaveData?.id]);

  const resetState = () => {
    setResponses([]);
    setNewResponse("");
    setEditingResponseId(null);
    setEditContent("");
    setAttachment(null);
    setToastMsg(null);
    setErrors({});
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetState();
  };

  const handleStatusChange = async () => {
    if (selectedStatus === leaveData.status || selectedStatus === "Pending") return;

    setIsSubmitting(true);
    try {
      await onStatusChange(leaveData.id, selectedStatus);
      if (typeof fetchLeaveRequests === "function") {
        await fetchLeaveRequests();
      }
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast(getApiError(error, "Failed to update status"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async () => {
    const error = validateDescription(newResponse, { min: 10, max: 500, required: true });
    if (error) {
      setErrors((prev) => ({ ...prev, newResponse: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, newResponse: null }));

    if (!newResponse.trim() && !attachment) return;

    try {
      const response = await api.post(`/leaves/${leaveData.id}/responses`, {
        content: newResponse.trim(),
      });

      setResponses((prev) => [...prev, response.data]);
      setNewResponse("");
      setAttachment(null);

      showToast("Response submitted successfully");
    } catch (error) {
      console.error("Failed to submit response:", error);
      showToast(getApiError(error, "Failed to submit response"), "error");
    }
  };

  const handleUpdateResponse = async (responseId) => {
    const error = validateDescription(editContent, { min: 10, max: 500, required: true });
    if (error) {
      setErrors((prev) => ({ ...prev, editContent: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, editContent: null }));

    if (!editContent.trim()) return;

    try {
      const response = await api.patch(`/leaves/${leaveData.id}/responses/${responseId}`, {
        content: editContent.trim(),
      });

      setResponses((prev) =>
        prev.map((res) =>
          res._id === responseId
            ? { ...res, ...response.data, isEdited: true, editedAt: new Date() }
            : res
        )
      );

      setEditingResponseId(null);
      setEditContent("");
      showToast("Response updated successfully");
    } catch (error) {
      console.error("Failed to update response:", error);
      showToast(getApiError(error, "Failed to update response"), "error");
    }
  };

  const handleDeleteResponse = async (responseId) => {
    await confirm({
      title: "Delete Response",
      message: "Are you sure you want to delete this response?",
      onConfirmAction: async () => {
        try {
          await api.delete(`/leaves/${leaveData.id}/responses/${responseId}`);
          setResponses((prev) => prev.filter((res) => res._id !== responseId));
          showToast("Response deleted successfully");
        } catch (error) {
          console.error("Failed to delete response:", error);
          showToast(getApiError(error, "Failed to delete response"), "error");
          throw error;
        }
      },
    });
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast("File size must be less than 25MB", "error");
        return;
      }
      setAttachment(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const getAvatarContent = (response) => {
    if (response.author?.avatar) {
      return (
        <img
          src={response.author.avatar}
          alt="avatar"
          className="h-full w-full rounded-full object-cover"
        />
      );
    }
    return response.author?.name?.charAt(0) || response.role?.charAt(0) || "?";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUserResponse = (response) => {
    if (response.author?._id === user?.user?._id) return true;
    if (response.author === user?.user?._id) return true;
    if (response.author?.email === user?.user?.email) return true;
    return false;
  };

  if (!isOpen || !leaveData) return null;

  const duration = leaveDuration(leaveData);
  const employeeName = leaveData.employeeName || leaveData.name || "Employee";

  return (
    <>
      {toastMsg && (
        <Toast
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      <DetailModal
        isOpen={isOpen}
        onClose={handleClose}
        ariaLabel="Leave request details"
        meta={
          <>
            <span className="font-mono font-semibold text-main">
              #{String(leaveData.id || "leave").slice(-8).toUpperCase()}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Applied {formatDateTime(leaveData.appliedAt || leaveData.createdAt)}</span>
          </>
        }
        title={`${leaveData.leaveType || "Leave"} request`}
        subtitle={`${employeeName}${leaveData.employee?.department ? ` · ${leaveData.employee.department}` : ""}`}
        badges={
          <>
            <DetailBadge tone={statusTone(leaveData.status)}>
              {leaveData.status || "Pending"}
            </DetailBadge>
            <DetailBadge>{duration}</DetailBadge>
          </>
        }
      >
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section>
              <DetailSectionHeading
                icon={<FaCalendarAlt size={13} className="text-muted" />}
                title="Leave details"
              />
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-muted">Start date</p>
                    <p className="text-[13px] font-medium text-main">
                      {formatDisplayDate(leaveData.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-muted">End date</p>
                    <p className="text-[13px] font-medium text-main">
                      {formatDisplayDate(leaveData.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-muted">Duration</p>
                    <p className="text-[13px] font-medium text-main">{duration}</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <DetailSectionHeading
                icon={<FaFileAlt size={13} className="text-muted" />}
                title="Reason"
              />
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                  {leaveData.reason && leaveData.reason !== "-"
                    ? leaveData.reason
                    : "No reason provided."}
                </p>
              </div>
            </section>

            <section>
              <DetailSectionHeading
                icon={<FaCommentDots size={13} className="text-muted" />}
                title="Discussion"
                count={
                  responses.length
                    ? `${responses.length} ${responses.length === 1 ? "reply" : "replies"}`
                    : undefined
                }
              />
              <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                <div className="max-h-[420px] divide-y divide-border-subtle overflow-y-auto custom-scrollbar">
                  {loadingResponses && responses.length === 0 ? (
                    <div className="px-4 py-6">
                      <Loader size="md" text="Loading discussion..." />
                    </div>
                  ) : responsesError ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-medium text-danger">
                        Failed to load discussion
                      </p>
                      <button
                        onClick={() => fetchResponses(false)}
                        className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-text hover:underline underline-offset-4"
                      >
                        Try again
                      </button>
                    </div>
                  ) : responses.length > 0 ? (
                    responses.map((response) => (
                      <div key={response._id} className="flex gap-3 px-4 py-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app text-[11px] font-semibold uppercase text-main ring-1 ring-border-subtle">
                          {getAvatarContent(response)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-semibold text-heading">
                                {response.author?.name || response.role || "Unknown user"}
                              </span>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                                {response.author?.role || response.role}
                              </span>
                              {response.isEdited && (
                                <span className="text-[11px] italic text-muted">(edited)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted">
                                {formatDate(response.time || response.createdAt)}
                              </span>
                              {!response.isSystemNote && isUserResponse(response) && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingResponseId(response._id);
                                      setEditContent(response.content);
                                    }}
                                    className="rounded-md p-1 text-muted transition-colors hover:bg-card-hover hover:text-brand-text"
                                    title="Edit"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResponse(response._id)}
                                    className="rounded-md p-1 text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                                    title="Delete"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {editingResponseId === response._id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className={`block w-full resize-none rounded-lg border bg-app px-3 py-2 text-[13px] leading-relaxed text-main outline-none ${
                                  errors.editContent
                                    ? "border-danger-border"
                                    : "border-border-subtle focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                                }`}
                                rows="3"
                              />
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-muted">
                                  {editContent.length}/500
                                </span>
                                <div className="flex gap-2">
                                  <GlassButton
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setEditingResponseId(null);
                                      setEditContent("");
                                    }}
                                  >
                                    Cancel
                                  </GlassButton>
                                  <GlassButton
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleUpdateResponse(response._id)}
                                  >
                                    Save
                                  </GlassButton>
                                </div>
                              </div>
                              {errors.editContent && (
                                <p className="text-[11px] font-medium text-danger">
                                  {errors.editContent}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                              {response.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-xs text-muted">
                      No discussion yet. Start a conversation about this leave request.
                    </p>
                  )}
                </div>

                <div className="border-t border-border-subtle p-3">
                  <div
                    className={`rounded-lg border bg-surface transition-colors ${
                      errors.newResponse
                        ? "border-danger-border"
                        : "border-border-subtle focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10"
                    }`}
                  >
                    <textarea
                      value={newResponse}
                      onChange={(e) => {
                        setNewResponse(e.target.value);
                        if (errors.newResponse) setErrors((prev) => ({ ...prev, newResponse: null }));
                      }}
                      onKeyPress={handleKeyPress}
                      className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                      placeholder="Write a response..."
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {!attachment ? (
                          <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-main">
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleAttachmentChange}
                              disabled={isSubmitting}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
                            />
                            <Paperclip size={13} />
                          </label>
                        ) : (
                          <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main">
                            <Paperclip size={10} className="shrink-0 text-muted" />
                            <span className="truncate">{attachment.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachment(null)}
                              className="shrink-0 text-muted transition-colors hover:text-danger"
                              aria-label="Remove attachment"
                            >
                              <FaTimes size={9} />
                            </button>
                          </span>
                        )}
                        {!attachment && (
                          <span className="text-[11px] text-muted">Attach a file</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted">{newResponse.length}/500</span>
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          icon={Send}
                          onClick={handleSubmitResponse}
                          disabled={!newResponse.trim() || isSubmitting}
                        >
                          Send
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                  {errors.newResponse && (
                    <p className="mt-1.5 text-[11px] font-medium text-danger">
                      {errors.newResponse}
                    </p>
                  )}
                  <p className="mt-2 px-1 text-[11px] text-muted">
                    Press{" "}
                    <kbd className="rounded border border-border-subtle bg-app px-1.5 py-0.5">
                      Enter
                    </kbd>{" "}
                    to send,{" "}
                    <kbd className="rounded border border-border-subtle bg-app px-1.5 py-0.5">
                      Shift+Enter
                    </kbd>{" "}
                    for a new line
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0">
            <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              <DetailField label="Employee">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app text-[11px] font-semibold text-main ring-1 ring-border-subtle">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-main">{employeeName}</p>
                    <p className="truncate text-[11px] text-muted">
                      {leaveData.employee?.department || "Department not specified"}
                    </p>
                  </div>
                </div>
              </DetailField>

              <DetailField label="Email">
                <p className="truncate text-[13px] font-medium text-main">
                  {leaveData.email || "-"}
                </p>
              </DetailField>

              <DetailField label="Leave type">
                <p className="truncate text-[13px] font-medium text-main">
                  {leaveData.leaveType || "-"}
                </p>
              </DetailField>

              <DetailField label="Duration">
                <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                  <FaClock size={12} className="text-muted" />
                  {duration}
                </p>
              </DetailField>

              <DetailField label="Applied on">
                <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                  <Clock size={12} className="text-muted" />
                  {formatDateTime(leaveData.appliedAt || leaveData.createdAt)}
                </p>
              </DetailField>

              <DetailField label="Status" className="border-b-0">
                <DetailBadge tone={statusTone(leaveData.status)}>
                  {leaveData.status || "Pending"}
                </DetailBadge>
              </DetailField>
            </div>

            {leaveData.status === "Pending" && canUpdateStatus && (
              <div className="mt-4">
                <h3 className="mb-2.5 text-sm font-semibold text-heading">Update status</h3>
                <div className="rounded-xl border border-border-subtle bg-surface p-4">
                  <ModernSelect
                    label="Select new status"
                    name="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    required
                    placeholder="Select status"
                    options={[
                      { value: "Pending", label: "Select status", disabled: true },
                      { value: "Approved", label: "Approve" },
                      { value: "Rejected", label: "Reject" },
                    ]}
                    className="w-full"
                    disabled={isSubmitting}
                  />

                  <div className="mt-3 flex gap-2">
                    <DetailFooterButton
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </DetailFooterButton>
                    <GlassButton
                      variant={
                        selectedStatus === "Approved"
                          ? "primary"
                          : selectedStatus === "Rejected"
                          ? "danger"
                          : "secondary"
                      }
                      onClick={handleStatusChange}
                      disabled={
                        selectedStatus === "Pending" ||
                        selectedStatus === leaveData.status ||
                        isSubmitting
                      }
                      isLoading={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Updating..." : `Confirm ${selectedStatus}`}
                    </GlassButton>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </DetailModal>
    </>
  );
};

export default ViewLeaveModal;
