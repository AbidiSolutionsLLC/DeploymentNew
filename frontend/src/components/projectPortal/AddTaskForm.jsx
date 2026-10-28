import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import { TableAvatar } from "../ui/TableCells";
import { X, Users } from "lucide-react";
import api from "../../axios";
import projectApi from "../../api/projectApi";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUS_OPTIONS = [
  { value: "Backlog", label: "Backlog" },
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "In Review", label: "In Review" },
  { value: "Done", label: "Done" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  assignees: [],
  priority: "Medium",
  status: "Backlog",
  dueDate: "",
};

export default function AddTaskForm({ projectId, project: propProject, onSubmit, onClose, initialStatus = "Todo", projectStatuses = null }) {
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

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    project: projectId || "",
    status: initialStatus || EMPTY_FORM.status,
  }));
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fetchedProject, setFetchedProject] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);

  // Active project resolution: prop -> redux -> fetched
  const selectedFromList = useMemo(() => {
    if (form.project && !projectId) {
      return projects.find((p) => p._id === form.project) || null;
    }
    return null;
  }, [form.project, projectId, projects]);

  const activeProject = propProject || reduxProject || fetchedProject || selectedFromList;

  const statusOptions = useMemo(() => {
    if (projectStatuses && projectStatuses.length > 0) {
      return projectStatuses.map((s) => ({ value: s, label: s }));
    }
    return STATUS_OPTIONS;
  }, [projectStatuses]);

  const projectMaxDate = useMemo(() => {
    if (!activeProject?.dueDate) return null;
    return new Date(activeProject.dueDate);
  }, [activeProject?.dueDate]);

  // Load users, projects, and active project if needed
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const promises = [api.get("/users")];
        if (!projectId) {
          promises.push(projectApi.getProjects());
        } else if (!propProject && !reduxProject) {
          promises.push(projectApi.getProjectById(projectId));
        }

        const results = await Promise.all(promises);
        if (!mounted) return;

        const userList = results[0].data?.data || results[0].data || [];
        setUsers(Array.isArray(userList) ? userList : []);

        if (!projectId && results[1]) {
          const projectList = results[1] || [];
          setProjects(Array.isArray(projectList) ? projectList : []);
        } else if (projectId && !propProject && !reduxProject && results[1]) {
          setFetchedProject(results[1]);
        }
      } catch {
        if (mounted) setOptionsError("Could not load form data. Please try again.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [projectId, propProject, reduxProject]);

  // Sync project field if projectId prop changes
  useEffect(() => {
    if (projectId) {
      setForm((prev) => ({ ...prev, project: projectId }));
    }
  }, [projectId]);

  // Sync default status when opened from a specific kanban column
  useEffect(() => {
    if (initialStatus) {
      setForm((prev) => ({ ...prev, status: initialStatus }));
    }
  }, [initialStatus]);

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

  // Automatically select default assignee from project members
  useEffect(() => {
    if (!projectMembers.length) return;

    const validAssignees = (form.assignees || []).filter((id) =>
      projectMembers.some((m) => String(m._id || m.id) === String(id))
    );

    if (validAssignees.length === 0) {
      // Prefer current user if in project, otherwise first project member
      const currentUserMember = projectMembers.find((m) => String(m._id || m.id) === String(currentUserId));
      const defaultMember = currentUserMember || projectMembers[0];
      if (defaultMember) {
        const defaultId = String(defaultMember._id || defaultMember.id);
        setForm((prev) => ({ ...prev, assignees: [defaultId] }));
        setErrors((prev) => ({ ...prev, assignees: null }));
      }
    } else if (validAssignees.length !== (form.assignees || []).length) {
      setForm((prev) => ({ ...prev, assignees: validAssignees }));
    }
  }, [projectMembers, currentUserId]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Task name is required.";
    const targetProject = form.project || projectId;
    if (!targetProject) next.project = "Project is required.";
    if (!form.assignees || form.assignees.length === 0) {
      next.assignees = "At least one assignee is required.";
    }
    if (form.dueDate && activeProject?.dueDate) {
      const taskDue = new Date(form.dueDate);
      const projectDue = new Date(activeProject.dueDate);
      if (taskDue.getTime() > projectDue.getTime()) {
        const formattedProjDue = projectDue.toISOString().split("T")[0];
        next.dueDate = `Due date cannot be after the project end date (${formattedProjDue}).`;
      }
    }
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
        project: form.project || projectId,
        team: form.assignees,
        assignees: form.assignees,
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

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";
  const isProjectFixed = Boolean(projectId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {optionsError && (
        <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">
          {optionsError}
        </p>
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

      {isProjectFixed ? (
        <>
          <div className="space-y-2">
            <div>
              <ModernSelect
                label={
                  form.assignees.length === 0
                    ? "Assign To*"
                    : form.assignees.length === 1
                    ? "Assign To* (Add 2nd Assignee)"
                    : `Assign To* (${form.assignees.length} assigned)`
                }
                name="assigneeSelect"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !form.assignees.includes(val)) {
                    set("assignees", [...form.assignees, val]);
                  }
                }}
                options={[
                  {
                    value: "",
                    label: loadingOptions
                      ? "Loading project members..."
                      : projectMembers.length === 0
                      ? "No members in this project"
                      : form.assignees.length === 0
                      ? "Select assignee"
                      : form.assignees.length === 1
                      ? "Add 2nd assignee..."
                      : "Add another assignee...",
                  },
                  ...projectMembers
                    .filter((m) => !form.assignees.includes(String(m._id || m.id)))
                    .map((u) => ({
                      value: String(u._id || u.id),
                      label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
                    })),
                ]}
                placeholder={
                  form.assignees.length === 0
                    ? "Select assignee"
                    : form.assignees.length === 1
                    ? "Add 2nd assignee..."
                    : "Add another assignee..."
                }
                error={errors.assignees}
              />
              {errors.assignees && <p className="text-danger text-xs mt-1">{errors.assignees}</p>}
            </div>

            {/* Selected Assignees Chips */}
            {form.assignees.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-card border border-border-subtle">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted mr-1">
                  Assigned ({form.assignees.length}):
                </span>
                {form.assignees.map((id) => {
                  const member = projectMembers.find((m) => String(m._id || m.id) === String(id));
                  const name = member ? member.name || member.email : "Member";
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-border-accent text-heading shadow-sm"
                    >
                      <TableAvatar name={name} src={member?.avatar} size="xs" />
                      <span className="truncate max-w-[120px]">{name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.assignees.filter((mId) => mId !== id);
                          set("assignees", updated);
                        }}
                        className="p-0.5 rounded-full hover:bg-danger-bg text-muted hover:text-danger transition-colors"
                        title={`Remove ${name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {projectMembers.length > 0 && (
              <p className="text-[11px] text-muted">
                Showing {projectMembers.length} member{projectMembers.length === 1 ? "" : "s"} in this project · Select multiple assignees (e.g. 2 co-assignees)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              options={statusOptions}
            />
            <div>
              <ModernDatePicker
                label="Due Date"
                name="dueDate"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                maxDate={projectMaxDate}
                error={errors.dueDate}
              />
              {errors.dueDate && <p className="text-danger text-xs mt-1">{errors.dueDate}</p>}
            </div>
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
                onChange={(e) => {
                  set("project", e.target.value);
                  set("assignees", []);
                }}
                options={projectOptions}
                placeholder={loadingOptions ? "Loading projects..." : "Select project"}
                required
                error={errors.project}
              />
              {errors.project && <p className="text-danger text-xs mt-1">{errors.project}</p>}
            </div>

            <div>
              <ModernSelect
                label={
                  form.assignees.length === 0
                    ? "Assign To*"
                    : form.assignees.length === 1
                    ? "Assign To* (Add 2nd Assignee)"
                    : `Assign To* (${form.assignees.length} assigned)`
                }
                name="assigneeSelect"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !form.assignees.includes(val)) {
                    set("assignees", [...form.assignees, val]);
                  }
                }}
                options={[
                  {
                    value: "",
                    label: loadingOptions
                      ? "Loading people..."
                      : projectMembers.length === 0
                      ? "No members available"
                      : form.assignees.length === 0
                      ? "Select assignee"
                      : form.assignees.length === 1
                      ? "Add 2nd assignee..."
                      : "Add another assignee...",
                  },
                  ...projectMembers
                    .filter((m) => !form.assignees.includes(String(m._id || m.id)))
                    .map((u) => ({
                      value: String(u._id || u.id),
                      label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
                    })),
                ]}
                placeholder={
                  form.assignees.length === 0
                    ? "Select assignee"
                    : form.assignees.length === 1
                    ? "Add 2nd assignee..."
                    : "Add another assignee..."
                }
                error={errors.assignees}
              />
              {errors.assignees && <p className="text-danger text-xs mt-1">{errors.assignees}</p>}
            </div>
          </div>

          {/* Selected Assignees Chips */}
          {form.assignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-card border border-border-subtle">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted mr-1">
                Assigned ({form.assignees.length}):
              </span>
              {form.assignees.map((id) => {
                const member = projectMembers.find((m) => String(m._id || m.id) === String(id));
                const name = member ? member.name || member.email : "Member";
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-border-accent text-heading shadow-sm"
                  >
                    <TableAvatar name={name} src={member?.avatar} size="xs" />
                    <span className="truncate max-w-[120px]">{name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.assignees.filter((mId) => mId !== id);
                        set("assignees", updated);
                      }}
                      className="p-0.5 rounded-full hover:bg-danger-bg text-muted hover:text-danger transition-colors"
                      title={`Remove ${name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              options={statusOptions}
            />
            <div>
              <ModernDatePicker
                label="Due Date"
                name="dueDate"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                maxDate={projectMaxDate}
                error={errors.dueDate}
              />
              {errors.dueDate && <p className="text-danger text-xs mt-1">{errors.dueDate}</p>}
            </div>
          </div>
        </>
      )}

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
        <GlassButton variant="secondary" type="button" onClick={onClose} disabled={saving}>
          Cancel
        </GlassButton>
        <GlassButton variant="primary" type="submit" isLoading={saving}>
          Create Task
        </GlassButton>
      </div>
    </form>
  );
}