import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import api from "../axios";
import projectApi from "../api/projectApi";

/**
 * New Task dialog — real submit (PROJECT_PORTAL_DESIGN.md §7).
 * - Payload matches TaskJoiSchema exactly: title, project (required), team,
 *   priority (Low/Medium/High), status (Todo/…/Blocked), dueDate, description.
 * - Users + projects fetched live (no hard-coded names); assignee defaults to
 *   the signed-in user so the task shows up in "My Tasks".
 * - Validation always visible; state resets on open.
 * Contract: onSubmit(payload) → parent closes on success, toasts on failure.
 */
const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Todo", "In Progress", "In Review", "Done", "Blocked"];

const EMPTY_FORM = {
  taskName: "",
  project: "",
  assignTo: "",
  priority: "Medium",
  status: "Todo",
  dueDate: "",
  description: "",
};

const AddTaskModal = ({ isOpen, onClose, onSubmit }) => {
  const { userInfo } = useSelector((state) => state.user || {});
  const currentUserId = userInfo?.user?._id || userInfo?._id || userInfo?.id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchedRef = useRef(false);

  // Reset each time the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSaving(false);
  }, [isOpen]);

  // Load users + projects once per session
  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    let mounted = true;
    (async () => {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const [usersRes, projectList] = await Promise.all([api.get("/users"), projectApi.getProjects()]);
        if (!mounted) return;
        const userList = usersRes.data?.data || usersRes.data || [];
        setUsers(Array.isArray(userList) ? userList : []);
        setProjects(Array.isArray(projectList) ? projectList : []);
        fetchedRef.current = true;
        // Default the assignee to the signed-in user (so it lands in "My Tasks")
        setForm((prev) => ({ ...prev, assignTo: prev.assignTo || currentUserId || "" }));
      } catch {
        if (mounted) setOptionsError("Could not load users & projects. Close and try again.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, currentUserId]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const validate = () => {
    const next = {};
    if (!form.taskName.trim()) next.taskName = "Task name is required.";
    if (!form.project) next.project = "Project is required.";
    if (!form.assignTo) next.assignTo = "Assignee is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.taskName.trim(),
        project: form.project,
        team: [form.assignTo],
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        description: form.description.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const userOptions = users.map((u) => ({
    value: u._id || u.id,
    label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
  }));
  const projectOptions = projects.map((p) => ({ value: p._id, label: p.title }));

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <GlassButton variant="secondary" onClick={onClose} disabled={saving}>
        Cancel
      </GlassButton>
      <GlassButton variant="primary" type="submit" form="taskForm" isLoading={saving}>
        Create Task
      </GlassButton>
    </div>
  );

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      description="Create a task and assign it to a team member."
      maxWidth="max-w-2xl"
      footer={footer}
    >
      <form id="taskForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {optionsError && (
          <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">
            {optionsError}
          </p>
        )}

        {/* Task name */}
        <div>
          <label htmlFor="task-name" className={labelCls}>
            Task Name*
          </label>
          <input
            id="task-name"
            type="text"
            placeholder="e.g. Draft launch announcement"
            value={form.taskName}
            onChange={(e) => set("taskName", e.target.value)}
            className={`glass-input ${errors.taskName ? "is-error" : ""}`}
            required
          />
          {errors.taskName && <p className="text-danger text-xs mt-1">{errors.taskName}</p>}
        </div>

        {/* Project / Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ModernSelect
              label="Project*"
              name="project"
              value={form.project}
              onChange={handleChange}
              options={projectOptions}
              placeholder={loadingOptions ? "Loading projects..." : "Select project"}
              required
              error={errors.project}
            />
            {errors.project && <p className="text-danger text-xs mt-1">{errors.project}</p>}
          </div>
          <div>
            <ModernSelect
              label="Assign To*"
              name="assignTo"
              value={form.assignTo}
              onChange={handleChange}
              options={userOptions}
              placeholder={loadingOptions ? "Loading people..." : "Select assignee"}
              required
              error={errors.assignTo}
            />
            {errors.assignTo && <p className="text-danger text-xs mt-1">{errors.assignTo}</p>}
          </div>
        </div>

        {/* Priority / Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernSelect
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          />
          <ModernSelect
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>

        {/* Due date */}
        <div>
          <ModernDatePicker
            label="Due Date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-description" className={labelCls}>
            Description
          </label>
          <textarea
            id="task-description"
            placeholder="Brief description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="glass-input min-h-[90px] resize-y"
          />
        </div>
      </form>
    </GlassModal>
  );
};

export default AddTaskModal;
