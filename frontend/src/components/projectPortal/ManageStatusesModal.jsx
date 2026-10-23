import React, { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, Bars3Icon } from "@heroicons/react/24/outline";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";

const BUILTIN_STATUSES = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
const MAX_CUSTOM_STATUSES = 10;

export default function ManageStatusesModal({ project, tasks = [], open, onClose, onSave }) {
  const [statuses, setStatuses] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (open) {
      setStatuses((project?.customStatuses || []).map((s, i) => ({ ...s, order: s.order ?? i })));
      setNewLabel("");
      setError("");
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [open, project]);

  // Count tasks per status label
  const taskCountByStatus = {};
  (tasks || []).forEach((t) => {
    const s = t.status || "";
    if (s) taskCountByStatus[s] = (taskCountByStatus[s] || 0) + 1;
  });

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setError("Status name cannot be empty.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Status name must be 50 characters or fewer.");
      return;
    }
    const lower = trimmed.toLowerCase();
    if (BUILTIN_STATUSES.some((b) => b.toLowerCase() === lower)) {
      setError(`"${trimmed}" is already a built-in status.`);
      return;
    }
    if (statuses.some((s) => s.label.toLowerCase() === lower)) {
      setError(`"${trimmed}" already exists.`);
      return;
    }
    if (statuses.length >= MAX_CUSTOM_STATUSES) {
      setError(`Maximum ${MAX_CUSTOM_STATUSES} custom statuses allowed.`);
      return;
    }
    setStatuses((prev) => [...prev, { label: trimmed, order: prev.length }]);
    setNewLabel("");
    setError("");
  };

  const handleRemove = (label) => {
    const count = taskCountByStatus[label] || 0;
    if (count > 0) {
      setError(`Cannot remove "${label}" — it still has ${count} task${count > 1 ? "s" : ""} assigned. Reassign those tasks first.`);
      return;
    }
    setStatuses((prev) => prev.filter((s) => s.label !== label).map((s, i) => ({ ...s, order: i })));
    setError("");
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setStatuses((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleMoveDown = (index) => {
    setStatuses((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleRowDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleRowDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleRowDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedIndex;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      setStatuses((prev) => {
        const next = [...prev];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
        return next.map((s, i) => ({ ...s, order: i }));
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRowDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(statuses.map((s, i) => ({ label: s.label, order: i })));
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save statuses.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <GlassModal
      isOpen={open}
      onClose={onClose}
      title="Manage Statuses"
      description="Add or drag-and-drop custom Kanban columns into your desired order"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <GlassButton variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" onClick={handleSave} isLoading={saving} disabled={saving}>
            Save Statuses
          </GlassButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Built-in statuses (read-only) */}
        <div>
          <p className={labelCls}>Built-in Statuses (Default)</p>
          <div className="flex flex-wrap gap-2">
            {BUILTIN_STATUSES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border-subtle bg-card text-xs font-semibold text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Custom statuses list */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className={labelCls}>
              Custom Statuses{" "}
              <span className="text-brand-text">
                ({statuses.length}/{MAX_CUSTOM_STATUSES})
              </span>
            </p>
            {statuses.length > 1 && (
              <span className="text-[10px] text-muted font-medium">Drag grip or use arrows to reorder</span>
            )}
          </div>
          {statuses.length === 0 ? (
            <p className="text-xs text-muted py-3 text-center border border-dashed border-border-subtle rounded-xl">
              No custom statuses added yet for this project.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {statuses.map((s, index) => {
                const count = taskCountByStatus[s.label] || 0;
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <div
                    key={s.label}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, index)}
                    onDragOver={(e) => handleRowDragOver(e, index)}
                    onDrop={(e) => handleRowDrop(e, index)}
                    onDragEnd={handleRowDragEnd}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all select-none ${
                      isDragging ? "opacity-40 border-dashed border-brand" : ""
                    } ${
                      isOver && !isDragging
                        ? "border-brand bg-amber-500/10 scale-[1.01]"
                        : "border-border-subtle bg-card"
                    }`}
                  >
                    <span
                      className="cursor-grab active:cursor-grabbing text-muted/60 hover:text-heading p-0.5 rounded transition-colors"
                      title="Drag to reorder"
                    >
                      <Bars3Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-heading truncate">
                      {s.label}
                      {count > 0 && (
                        <span className="ml-2 text-[10px] font-bold text-muted">
                          ({count} task{count > 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === statuses.length - 1}
                        className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(s.label)}
                        className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                        title={count > 0 ? `Cannot remove — ${count} task(s) assigned` : "Remove status"}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add new status */}
        {statuses.length < MAX_CUSTOM_STATUSES && (
          <div>
            <p className={labelCls}>Add New Status</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder='e.g. Testing, QA, Staging'
                maxLength={50}
                className="glass-input flex-1"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-accent bg-amber-50 text-brand-text text-xs font-bold hover:bg-amber-100 transition-colors shrink-0"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </GlassModal>
  );
}
