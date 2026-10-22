import React from "react";
import { FaCalendarAlt, FaClock, FaEnvelope, FaFileAlt, FaUser } from "react-icons/fa";
import { Clock } from "lucide-react";
import { parseISOToLocalDate, formatDisplayDate } from "../utils/dateUtils";
import DetailModal, {
  DetailBadge,
  DetailField,
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

const HistoryViewLeaveModal = ({ isOpen, setIsOpen, leaveData }) => {
  if (!isOpen || !leaveData) return null;

  const employeeName = leaveData.employeeName || leaveData.name || "Employee";
  const duration = leaveDuration(leaveData);

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      ariaLabel="Leave history details"
      meta={
        <>
          <span className="font-mono font-semibold text-main">
            #{String(leaveData.id || leaveData._id || "leave").slice(-8).toUpperCase()}
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

          <div className="rounded-xl border border-warning-border bg-warning-bg p-4">
            <p className="text-[13px] leading-relaxed text-warning">
              This is a read-only view of the leave request from employee history.
            </p>
          </div>
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
              <p className="flex items-center gap-2 truncate text-[13px] font-medium text-main">
                <FaEnvelope size={12} className="shrink-0 text-muted" />
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
        </aside>
      </div>
    </DetailModal>
  );
};

export default HistoryViewLeaveModal;
