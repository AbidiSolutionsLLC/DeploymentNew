import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import api from "../../axios";
import projectApi from "../../api/projectApi";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["backlog", "todo", "in-progress", "in-review", "done"];

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  assignee: "",
  priority: "Medium",
  status: "backlog",
  dueDate: "",
};

export default function AddTaskForm({ projectId, onSubmit, onClose }) {
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

  useEffect(() => {
    if (fetchedRef.current) return;
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
        setForm((prev) => ({ ...prev, project: projectId || "", assignee: currentUserId || "" }));
      } catch {
        if (mounted) setOptionsError("Could not load users & projects. Close and try again.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId, currentUserId]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Task name is required.";
    if (!form.project) next.project = "Project is required.";
    if (!form.assignee) next.assignee = "Assignee is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        project: form.project,
        team: [form.assignee],
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

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {optionsError && (
        <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">{optionsError}</p>
      )}

      <div>
        <label htmlFor="task-name" className={labelCls}>Task Name*</label>
        <input
          id="task-name"
          type="text"
          placeholder="e.g. Draft launch announcement"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={`glass-input ${errors.title ? "is-error" : ""}`}
          required
        />
        {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <ModernSelect
            label="Project*"
            name="project"
            value={form.project}
            onChange={(e) => set("project", e.target.value)}
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
            name="assignee"
            value={form.assignee}
            onChange={(e) => set("assignee", e.target.value)}
            options={userOptions}
            placeholder={loadingOptions ? "Loading people..." : "Select assignee"}
            required
            error={errors.assignee}
          />
          {errors.assignee && <p className="text-danger text-xs mt-1">{errors.assignee}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModernSelect
          label="Priority"
          name="priority"
          value={form.priority}
          onChange={(e) => set("priority", e.target.value)}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <ModernSelect
          label="Status"
          name="status"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
          options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ") }))}
        />
      </div>

      <ModernDatePicker label="Due Date" name="dueDate" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />

      <div>
        <label htmlFor="task-description" className={labelCls}>Description</label>
        <textarea
          id="task-description"
          placeholder="Brief description"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="glass-input min-h-[90px] resize-y"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <GlassButton variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</GlassButton>
        <GlassButton variant="primary" type="submit" isLoading={saving}>Create Task</GlassButton>
      </div>
    </form>
  );
}