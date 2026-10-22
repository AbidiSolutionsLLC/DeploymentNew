import React from "react";
import { FaCalendarDay, FaClock, FaDownload, FaFileAlt, FaPaperclip } from "react-icons/fa";
import { downloadFile } from "../../utils/downloadFile";
import DetailModal, {
  DetailBadge,
  DetailField,
  DetailSectionHeading,
} from "../../components/ui/DetailModal";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ViewTimeLogModal = ({ log, onClose }) => {
  if (!log) return null;

  const attachments = log.attachments || [];
  const attachment = attachments[0];

  return (
    <DetailModal
      isOpen={!!log}
      onClose={onClose}
      ariaLabel="Time log details"
      meta={
        <>
          <span className="font-mono font-semibold text-main">
            #{String(log._id || "time-log").slice(-8).toUpperCase()}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Logged {formatDate(log.date)}</span>
        </>
      }
      title={log.jobTitle || "Time log"}
      badges={
        <DetailBadge tone="border-success-border bg-success-bg text-success">
          {log.totalHours || 0} hours
        </DetailBadge>
      }
    >
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section>
            <DetailSectionHeading
              icon={<FaFileAlt size={13} className="text-muted" />}
              title="Description"
            />
            <div className="rounded-xl border border-border-subtle bg-surface p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                {log.description || "No description provided."}
              </p>
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaPaperclip size={13} className="text-muted" />}
              title="Attachments"
              count={
                attachments.length
                  ? `${attachments.length} file${attachments.length === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {attachment ? (
                <div className="divide-y divide-border-subtle">
                  {attachments.map((file, index) => (
                    <button
                      key={file._id || index}
                      type="button"
                      onClick={() =>
                        downloadFile(
                          file.blobName || file.url || file.path,
                          file.originalname || file.name
                        )
                      }
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
                      title={`Download ${file.originalname || file.name || "attachment"}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-app text-[10px] font-semibold text-muted">
                        {String(file.originalname || file.name || "FILE")
                          .split(".")
                          .pop()
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-main">
                        {file.originalname || file.name || "Attachment"}
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
        </div>

        <aside className="min-w-0">
          <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <DetailField label="Date">
              <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                <FaCalendarDay size={12} className="text-muted" />
                {formatDate(log.date)}
              </p>
            </DetailField>

            <DetailField label="Total hours">
              <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                <FaClock size={12} className="text-muted" />
                {log.totalHours || 0} hours
              </p>
            </DetailField>

            <DetailField label="Attachment" className="border-b-0">
              <p className="truncate text-[13px] font-medium text-main">
                {attachment ? attachment.originalname || attachment.name || "1 file" : "None"}
              </p>
            </DetailField>
          </div>
        </aside>
      </div>
    </DetailModal>
  );
};

export default ViewTimeLogModal;
