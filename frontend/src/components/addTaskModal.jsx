import React, { useState, useEffect, useRef, useMemo } from "react";
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
 * - When in project context (projectId provided):
 *   * Project is auto-selected, no dropdown shown
 *   * Assignees filtered to ONLY people included in that project
 *   * Assignee automatically pre-selected
 * - Validation always visible; state resets on open.
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

const AddTaskModal = ({ isOpen, onClose, onSubmit, projectId, project: propProject }) => {
  const { userInfo } = useSelector((state) => state.user || {});
  const authUser = useSelector((state) => state.auth?.user);
  const currentUserId =
    userInfo?.user?._id ||
    userInfo?._id ||
    userInfo?.id ||
    authUser?.user?._id ||
    authUser?._id ||
    authUser?.id;

  const reduxProject = useSelector((state) =>
    projectId
      ? state.projects.currentProject?._id === projectId
        ? state.projects.currentProject
        : state.projects.projects?.find((p) => p._id === projectId)
      : null
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fetchedProject, setFetchedProject] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchedRef = useRef(false);

  // Reset each time the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...EMPTY_FORM,
      project: projectId || "",
    });
    setErrors({});
    setSaving(false);
  }, [isOpen, projectId]);

  // Load users + projects once per session
  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    let mounted = true;
    (async () => {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const promises = [api.get("/users"), projectApi.getProjects()];
        if (projectId && !propProject && !reduxProject) {
          promises.push(projectApi.getProjectById(projectId));
        }
        const results = await Promise.all(promises);
        if (!mounted) return;
        const userList = results[0].data?.data || results[0].data || [];
        const projectList = results[1] || [];
        setUsers(Array.isArray(userList) ? userList : []);
        setProjects(Array.isArray(projectList) ? projectList : []);
        if (results[2]) {
          setFetchedProject(results[2]);
        }
        fetchedRef.current = true;
      } catch {
        if (mounted) setOptionsError("Could not load users & projects. Close and try again.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, projectId, propProject, reduxProject]);

  const selectedFromList = useMemo(() => {
    const targetId = form.project || projectId;
    if (targetId) {
      return projects.find((p) => p._id === targetId) || null;
    }
    return null;
  }, [form.project, projectId, projects]);

  const activeProject = propProject || reduxProject || fetchedProject || selectedFromList;

  // Compute assignees strictly restricted to this project's members (owner + team)
  const projectMembers = useMemo(() => {
    if (!activeProject && !projectId) {
      return users;
    }
    if (!activeProject) {
      return [];
    }

    const members = [];
    const seen = new Set();

    const add = (m) => {
      if (!m) return;
      const id = typeof m === "object" ? m._id || m.id : m;
      if (!id || seen.has(String(id))) return;
      seen.add(String(id));

      if (typeof m === "object" && (m.name || m.email)) {
        members.push(m);
      } else {
        const found = users.find((u) => String(u._id || u.id) === String(id));
        if (found) {
          members.push(found);
        } else {
          members.push({ _id: id, name: `Member (${String(id).slice(-4)})` });
        }
      }
    };

    if (activeProject.owner) add(activeProject.owner);
    if (Array.isArray(activeProject.team)) activeProject.team.forEach(add);

    return members;
  }, [activeProject, projectId, users]);

  // Automatically select assignee from project members
  useEffect(() => {
    if (!projectMembers.length) return;

    const isCurrentValid = form.assignTo && projectMembers.some((m) => String(m._id || m.id) === String(form.assignTo));

    if (!isCurrentValid) {
      // Prefer current user if in project, otherwise first project member
      const currentUserMember = projectMembers.find((m) => String(m._id || m.id) === String(currentUserId));
      const defaultMember = currentUserMember || projectMembers[0];
      if (defaultMember) {
        const defaultId = defaultMember._id || defaultMember.id;
        setForm((prev) => ({ ...prev, assignTo: defaultId }));
        setErrors((prev) => ({ ...prev, assignTo: null }));
      }
    }
  }, [projectMembers, currentUserId, form.assignTo]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const validate = () => {
    const next = {};
    if (!form.taskName.trim()) next.taskName = "Task name is required.";
    const targetProject = form.project || projectId;
    if (!targetProject) next.project = "Project is required.";
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
        project: form.project || projectId,
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

  const userOptions = projectMembers.map((u) => ({
    value: u._id || u.id,
    label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
  }));
  const projectOptions = projects.map((p) => ({ value: p._id, label: p.title }));

  const isProjectFixed = Boolean(projectId);

  const footer = (
    <>
      <GlassButton variant="secondary" onClick={onClose} disabled={saving}>
        Cancel
      </GlassButton>
      <GlassButton variant="primary" type="submit" form="taskForm" isLoading={saving}>
        Create Task
      </GlassButton>
    </>
  );

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      description="Create a task in this project"
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

        {isProjectFixed ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ModernSelect
                  label="Assign To*"
                  name="assignTo"
                  value={form.assignTo}
                  onChange={handleChange}
                  options={userOptions}
                  placeholder={
                    loadingOptions
                      ? "Loading project members..."
                      : projectMembers.length === 0
                      ? "No members in this project"
                      : "Select assignee"
                  }
                  required
                  error={errors.assignTo}
                />
                {errors.assignTo && <p className="text-danger text-xs mt-1">{errors.assignTo}</p>}
                {projectMembers.length > 0 && (
                  <p className="text-[11px] text-muted mt-1">
                    Showing only {projectMembers.length} member{projectMembers.length === 1 ? "" : "s"} included in this project
                  </p>
                )}
              </div>

              <ModernSelect
                label="Priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                options={PRIORITIES.map((p) => ({ value: p, label: p }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModernSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={STATUSES.map((s) => ({ value: s, label: s }))}
              />

              <ModernDatePicker
                label="Due Date"
                name="dueDate"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
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

            <ModernDatePicker
              label="Due Date"
              name="dueDate"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </>
        )}

        {/* Description */}
        <div>
          <label htmlFor="task-description" className={labelCls}>
            Description
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            placeholder="Brief description of what needs to be done..."
            value={form.description}
            onChange={handleChange}
            className="glass-input min-h-[90px] resize-y"
          />
        </div>
      </form>
    </GlassModal>
  );
};

export default AddTaskModal;
