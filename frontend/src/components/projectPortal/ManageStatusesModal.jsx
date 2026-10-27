import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Bars3Icon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";

export const DEFAULT_PROJECT_STATUSES = [
  { id: "backlog", label: "Backlog", color: "#64748b", category: "backlog" },
  { id: "todo", label: "To Do", color: "#f59e0b", category: "todo" },
  { id: "in-progress", label: "In Progress", color: "#3b82f6", category: "in_progress" },
  { id: "in-review", label: "In Review", color: "#8b5cf6", category: "in_review" },
  { id: "done", label: "Done", color: "#10b981", category: "done" },
];

const COLOR_PALETTE = [
  { label: "Slate", value: "#64748b" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Orange", value: "#ea580c" },
];

const MAX_STATUSES = 15;
const MIN_STATUSES = 2;

export default function ManageStatusesModal({ project, tasks = [], open, onClose, onSave }) {
  const [statuses, setStatuses] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[2].value);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Reassignment dialog state when deleting a status that currently has tasks
  const [pendingDeleteStatus, setPendingDeleteStatus] = useState(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassignList, setReassignList] = useState([]);

  useEffect(() => {
    if (open) {
      setError("");
      setEditingId(null);
      setNewLabel("");
      setPendingDeleteStatus(null);
      setReassignList([]);

      // Initialize statuses: check project.statuses first
      if (Array.isArray(project?.statuses) && project.statuses.length > 0) {
        setStatuses(
          project.statuses.map((s, idx) => ({
            id: s.id || `status-${idx}-${Date.now()}`,
            label: s.label,
            color: s.color || COLOR_PALETTE[idx % COLOR_PALETTE.length].value,
            order: s.order !== undefined ? s.order : idx,
            category: s.category || "todo",
          }))
        );
      } else {
        // Build from default statuses + legacy customStatuses
        const defaults = DEFAULT_PROJECT_STATUSES.map((d, i) => ({ ...d, order: i }));
        const customs = (project?.customStatuses || []).map((cs, i) => ({
          id: `custom-${i}-${cs.label.toLowerCase().replace(/\s+/g, "-")}`,
          label: cs.label,
          color: cs.color || "#8b5cf6",
          order: defaults.length + i,
          category: "in_progress",
        }));
        setStatuses([...defaults, ...customs]);
      }
    }
  }, [open, project]);

  // Count tasks per status label
  const taskCountByStatus = {};
  (tasks || []).forEach((t) => {
    const s = String(t.status || "").trim();
    if (s) {
      taskCountByStatus[s.toLowerCase()] = (taskCountByStatus[s.toLowerCase()] || 0) + 1;
    }
  });

  const getTaskCount = (label) => {
    return taskCountByStatus[(label || "").trim().toLowerCase()] || 0;
  };

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
    if (statuses.some((s) => s.label.toLowerCase() === lower)) {
      setError(`A status named "${trimmed}" already exists in this project.`);
      return;
    }
    if (statuses.length >= MAX_STATUSES) {
      setError(`Maximum ${MAX_STATUSES} statuses allowed.`);
      return;
    }

    const newId = `status-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setStatuses((prev) => [
      ...prev,
      {
        id: newId,
        label: trimmed,
        color: newColor,
        order: prev.length,
        category: "todo",
      },
    ]);
    setNewLabel("");
    setError("");
  };

  const startEditing = (status) => {
    setEditingId(status.id);
    setEditLabel(status.label);
    setError("");
  };

  const saveEditing = (id) => {
    const trimmed = editLabel.trim();
    if (!trimmed) {
      setError("Status name cannot be empty.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Status name must be 50 characters or fewer.");
      return;
    }
    const lower = trimmed.toLowerCase();
    if (statuses.some((s) => s.id !== id && s.label.toLowerCase() === lower)) {
      setError(`A status named "${trimmed}" already exists.`);
      return;
    }

    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label: trimmed } : s))
    );
    setEditingId(null);
    setEditLabel("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLabel("");
    setError("");
  };

  const handleColorChange = (id, color) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s))
    );
  };

  const initiateDelete = (status) => {
    if (statuses.length <= MIN_STATUSES) {
      setError(`A project must have at least ${MIN_STATUSES} statuses.`);
      return;
    }

    const count = getTaskCount(status.label);
    if (count > 0) {
      // Prompt user to reassign existing tasks
      const remaining = statuses.filter((s) => s.id !== status.id);
      setPendingDeleteStatus(status);
      setReassignTarget(remaining[0]?.label || "");
      return;
    }

    // No tasks assigned, remove directly
    setStatuses((prev) =>
      prev.filter((s) => s.id !== status.id).map((s, i) => ({ ...s, order: i }))
    );
    setError("");
  };

  const confirmDeleteWithReassign = () => {
    if (!pendingDeleteStatus || !reassignTarget) return;

    // Record task migration
    setReassignList((prev) => [
      ...prev.filter((r) => r.fromStatus !== pendingDeleteStatus.label),
      { fromStatus: pendingDeleteStatus.label, toStatus: reassignTarget },
    ]);

    setStatuses((prev) =>
      prev.filter((s) => s.id !== pendingDeleteStatus.id).map((s, i) => ({ ...s, order: i }))
    );

    setPendingDeleteStatus(null);
    setReassignTarget("");
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
    if (index === prev.length - 1) return;
    setStatuses((prev) => {
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

  const handleSave = async () => {
    if (statuses.length < MIN_STATUSES) {
      setError(`A project must have at least ${MIN_STATUSES} statuses.`);
      return;
    }
    setSaving(true);
    try {
      const formatted = statuses.map((s, i) => ({
        id: s.id,
        label: s.label.trim(),
        color: s.color || COLOR_PALETTE[i % COLOR_PALETTE.length].value,
        order: i,
        category: s.category || "todo",
      }));

      await onSave({
        statuses: formatted,
        reassignTasks: reassignList,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save statuses.");
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <GlassModal
      isOpen={open}
      onClose={onClose}
      title="Manage Project Statuses"
      description="Adjust, rename, color, reorder, or delete statuses for this project"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted">
            {statuses.length} status{statuses.length !== 1 ? "es" : ""} configured
          </span>
          <div className="flex items-center gap-2.5">
            <GlassButton variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSave} isLoading={saving} disabled={saving}>
              Save Statuses
            </GlassButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Status List with Drag & Drop */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={labelCls}>
              Project Workflow Columns ({statuses.length}/{MAX_STATUSES})
            </p>
            {statuses.length > 1 && (
              <span className="text-[10px] text-muted font-medium">
                Drag grip or use arrows to change column order
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {statuses.map((s, index) => {
              const count = getTaskCount(s.label);
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              const isEditing = editingId === s.id;

              return (
                <div
                  key={s.id || s.label}
                  draggable={!isEditing}
                  onDragStart={(e) => handleRowDragStart(e, index)}
                  onDragOver={(e) => handleRowDragOver(e, index)}
                  onDrop={(e) => handleRowDrop(e, index)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all ${
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

                  {/* Color Swatch Picker */}
                  <div className="relative group shrink-0">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full border border-border-subtle shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: s.color || "#64748b" }}
                      title="Change color"
                    />
                    <div className="hidden group-hover:flex absolute left-0 top-full mt-1 p-1.5 bg-surface rounded-lg shadow-xl border border-border-subtle gap-1 z-30">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleColorChange(s.id, c.value)}
                          className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                            s.color === c.value ? "ring-2 ring-brand" : ""
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Status Name / Inline Edit */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing(s.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          className="glass-input !py-1 !px-2 text-sm flex-1 font-semibold"
                          autoFocus
                          maxLength={50}
                        />
                        <button
                          type="button"
                          onClick={() => saveEditing(s.id)}
                          className="p-1 rounded text-success hover:bg-success-bg transition-colors"
                          title="Save name"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="p-1 rounded text-muted hover:bg-card-hover transition-colors"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-heading truncate">
                          {s.label}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-muted">
                            {count} task{count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(s)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors"
                        title="Rename status"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move column left"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === statuses.length - 1}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move column right"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => initiateDelete(s)}
                        disabled={statuses.length <= MIN_STATUSES}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          statuses.length <= MIN_STATUSES
                            ? `Minimum ${MIN_STATUSES} statuses required`
                            : "Delete status"
                        }
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reassignment Modal overlay when deleting a status with tasks */}
        {pendingDeleteStatus && (
          <div className="p-4 rounded-xl border border-warning-border bg-warning-bg/40 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-heading">
                  Reassign tasks before deleting "{pendingDeleteStatus.label}"
                </p>
                <p className="text-muted mt-0.5">
                  There {getTaskCount(pendingDeleteStatus.label) === 1 ? "is" : "are"}{" "}
                  <strong className="text-heading font-semibold">
                    {getTaskCount(pendingDeleteStatus.label)} task{getTaskCount(pendingDeleteStatus.label) > 1 ? "s" : ""}
                  </strong>{" "}
                  currently in this status. Select which status to move them to:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                className="glass-input text-xs font-semibold flex-1 !py-1.5"
              >
                {statuses
                  .filter((s) => s.id !== pendingDeleteStatus.id)
                  .map((s) => (
                    <option key={s.id} value={s.label}>
                      Move to: {s.label}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={confirmDeleteWithReassign}
                className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold hover:bg-danger/90 transition-colors"
              >
                Migrate & Delete
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteStatus(null)}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle text-muted text-xs hover:text-heading transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add New Status */}
        {statuses.length < MAX_STATUSES && (
          <div className="pt-2 border-t border-border-subtle">
            <p className={labelCls}>Add New Project Status</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="e.g. In QA, Staging, Blocked, Ready for Deploy"
                maxLength={50}
                className="glass-input flex-1 text-sm"
              />

              {/* Color swatch selector for new status */}
              <div className="flex items-center gap-1 px-2 border border-border-subtle rounded-xl bg-card">
                {COLOR_PALETTE.slice(0, 5).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewColor(c.value)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 ${
                      newColor === c.value ? "ring-2 ring-brand scale-110" : ""
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-accent bg-amber-500/10 text-brand-text text-xs font-bold hover:bg-amber-500/20 transition-colors shrink-0"
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
