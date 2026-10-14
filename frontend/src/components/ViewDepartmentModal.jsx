import React from "react";
import { FaBuilding, FaUsers, FaFileAlt, FaCalendar } from "react-icons/fa";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

const ViewDepartmentModal = ({ department, isOpen, onClose, users = [] }) => {
  if (!department || !isOpen) return null;

  /* Same visual as .glass-input but without its single-line clipping
     (nowrap + overflow-hidden + ellipsis), so long text wraps fully. */
  const readFieldCls =
    "w-full rounded-lg border border-border-subtle dark:border-slate-700 bg-surface/50 dark:bg-slate-800/50 px-4 py-3 text-sm min-h-[44px]";

  /* Head: populated manager object from the API, with managerName fallback */
  const managerName = department.manager?.name || department.managerName || "";

  /* Members of this department (same source of truth as the table's member count) */
  const members = users.filter(
    (u) => (u.department?._id || u.department) === department._id
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 flex items-center justify-center">
            <FaBuilding size={18} />
          </div>
          <div>
            <h3 className="font-bold text-heading">{department.name}</h3>
            <p className="text-xs text-muted">Department Details</p>
          </div>
        </div>
      }
      maxWidth="max-w-md"
      footer={
        <GlassButton variant="secondary" onClick={onClose}>
          Close
        </GlassButton>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
            <FaBuilding size={9} /> Department Name
          </label>
          <div className="glass-input px-4 py-3 text-sm min-h-[44px] flex items-center bg-surface/50 dark:bg-slate-800/50 font-medium">
            {department.name || "—"}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
            <FaUsers size={9} /> Department Head
          </label>
          <div className="glass-input px-4 py-3 text-sm min-h-[44px] flex items-center bg-surface/50 dark:bg-slate-800/50">
            {managerName ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                  {managerName.charAt(0).toUpperCase()}
                </div>
                <span>{managerName}</span>
              </div>
            ) : (
              <span className="text-muted italic">Unassigned</span>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
            <FaUsers size={9} /> Members
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border bg-info-bg text-info border-info-border">
              {members.length}
            </span>
          </label>
          <div className={`${readFieldCls} leading-relaxed`}>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {members.slice(0, 8).map((m) => (
                  <span
                    key={m._id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface border border-border-subtle text-main"
                  >
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 flex items-center justify-center text-[8px] font-black">
                      {m.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    {m.name}
                  </span>
                ))}
                {members.length > 8 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface border border-border-subtle text-muted">
                    +{members.length - 8} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted italic">No members assigned</span>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
            <FaFileAlt size={9} /> Description
          </label>
          <div className={`${readFieldCls} whitespace-pre-wrap break-words leading-relaxed`}>
            {department.description || <span className="text-muted italic">No description provided</span>}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
            <FaCalendar size={9} /> Created
          </label>
          <div className="glass-input px-4 py-3 text-sm min-h-[44px] flex items-center bg-surface/50 dark:bg-slate-800/50">
            {department.createdAt ? (
              new Date(department.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
        </div>
      </div>
    </GlassModal>
  );
};

export default ViewDepartmentModal;
