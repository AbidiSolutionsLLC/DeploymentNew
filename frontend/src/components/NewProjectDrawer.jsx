import React, { useState, useEffect, useRef } from "react";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import ModernSelect from "./ui/ModernSelect";
import ModernMultiSelect from "./ui/ModernMultiSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import api from "../axios";

/**
 * Project dialog — create AND edit (PROJECT_PORTAL_DESIGN.md §7).
 * - `project` prop present → edit mode (prefills + submits the same payload for PUT).
 * - Validation is always visible (never a silent no-op).
 * - Responsive: fields stack on phones (grid-cols-1 sm:grid-cols-2).
 * - State fully resets each time the dialog opens.
 * Contract: onSubmit(payload) → parent closes the dialog on success, toasts on failure.
 */
const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];

const EMPTY_FORM = {
  title: "",
  description: "",
  owner: "",
  department: "",
  status: "Planning",
  team: [],
  startDate: "",
  dueDate: "",
  milestones: [],
};

const toId = (v) => (v && typeof v === "object" ? String(v._id || v.id || "") : String(v || ""));
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const NewProjectDrawer = ({ isOpen, onClose, onSubmit, project = null }) => {
  const isEdit = Boolean(project);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchedRef = useRef(false);

  // Load dropdown data once per session (users + departments + project groups)
  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    let mounted = true;
    (async () => {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const [usersRes, deptsRes] = await Promise.all([
          api.get("/users"),
          api.get("/departments")
        ]);
        if (!mounted) return;
        const userList = usersRes.data?.data || usersRes.data || [];
        const deptList = deptsRes.data?.data || deptsRes.data || [];
        setUsers(Array.isArray(userList) ? userList : []);
        setDepartments(Array.isArray(deptList) ? deptList : []);
        fetchedRef.current = true;
      } catch {
        if (mounted) setOptionsError("Could not load form options. Close and try again.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // (Re)populate the form each time the dialog opens: edit prefills, create resets
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSaving(false);
    if (project) {
setForm({
          title: project.title || "",
          description: project.description || "",
          owner: toId(project.owner),
          department: toId(project.department),
          status: PROJECT_STATUSES.includes(project.status) ? project.status : "Planning",
        team: (project.team || []).map(toId).filter(Boolean),
        startDate: toDateInput(project.startDate),
        dueDate: toDateInput(project.dueDate),
        milestones: (project.milestones || []).map((milestone) => ({
          title: milestone.title || "",
          dueDate: toDateInput(milestone.dueDate),
          status: milestone.status || "Planned",
        })),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, project]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Project name is required.";
    if (!form.owner) next.owner = "Project owner is required.";
    if (!form.department) next.department = "Department is required.";
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      next.dueDate = "End date can't be before start date.";
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
        description: form.description.trim(),
        owner: form.owner,
        department: form.department,
        status: form.status,
        team: form.team,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        milestones: form.milestones.filter((milestone) => milestone.title.trim()).map((milestone) => ({
          ...milestone,
          title: milestone.title.trim(),
          dueDate: milestone.dueDate || null,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  const userOptions = users.map((u) => ({
    value: u._id || u.id,
    label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
  }));
  const departmentOptions = departments.map((d) => ({ value: d._id || d.id, label: d.name }));
  const groupOptions = [
    { value: "", label: "None (No Group)" },
    ...projectGroups.map((g) => ({ value: g._id || g.id, label: g.name }))
  ];

  const footer = (
    <>
      <GlassButton variant="secondary" onClick={onClose} disabled={saving}>
        Cancel
      </GlassButton>
      <GlassButton variant="primary" type="submit" form="projectForm" isLoading={saving}>
        {isEdit ? "Save Changes" : "Create Project"}
      </GlassButton>
    </>
  );

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Project" : "New Project"}
      description={isEdit ? "Update the project details below." : "Create a project and assign its owner and team."}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      <form id="projectForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {optionsError && (
          <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">
            {optionsError}
          </p>
        )}

        {/* Title */}
        <div>
          <label htmlFor="project-title" className={labelCls}>
            Project Name*
          </label>
          <input
            id="project-title"
            type="text"
            placeholder="e.g. Website Redesign"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={`glass-input ${errors.title ? "is-error" : ""}`}
            required
          />
          {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Owner / Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ModernSelect
              label="Project Owner*"
              name="owner"
              value={form.owner}
              onChange={handleChange}
              options={userOptions}
              placeholder={loadingOptions ? "Loading people..." : "Select owner"}
              required
              error={errors.owner}
            />
            {errors.owner && <p className="text-danger text-xs mt-1">{errors.owner}</p>}
          </div>
          <div>
            <ModernSelect
              label="Department*"
              name="department"
              value={form.department}
              onChange={handleChange}
              options={departmentOptions}
              placeholder={loadingOptions ? "Loading departments..." : "Select department"}
              required
              error={errors.department}
            />
            {errors.department && <p className="text-danger text-xs mt-1">{errors.department}</p>}
          </div>
        </div>

        {/* Team Members */}
        <div>
          <ModernMultiSelect
            label="Team Members"
            name="team"
            value={form.team}
            onChange={(e) => set("team", e.target.value)}
            users={users}
            placeholder={loadingOptions ? "Loading people..." : "Assign team members..."}
            searchPlaceholder="Search people by name or email..."
            helperText="Select members to add to the project. Click the dropdown to see unassigned members."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernDatePicker
            label="Start Date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
          />
          <ModernDatePicker
            label="End Date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
          />
        </div>
        {errors.dueDate && <p className="text-danger text-xs -mt-2">{errors.dueDate}</p>}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Milestones</label>
            <button
              type="button"
              className="text-xs font-bold text-brand-text hover:underline"
              onClick={() => setForm((prev) => ({
                ...prev,
                milestones: [...prev.milestones, { title: "", dueDate: "", status: "Planned" }],
              }))}
            >
              Add milestone
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {form.milestones.map((milestone, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_120px_auto] gap-2 items-center">
                <input
                  className="glass-input"
                  placeholder="Milestone name"
                  value={milestone.title}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((item, i) => i === index ? { ...item, title: e.target.value } : item),
                  }))}
                />
                <ModernDatePicker
                  value={milestone.dueDate}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((item, i) => i === index ? { ...item, dueDate: e.target.value } : item),
                  }))}
                />
                <ModernSelect
                  value={milestone.status}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((item, i) => i === index ? { ...item, status: e.target.value } : item),
                  }))}
                  options={["Planned", "In Progress", "Completed"].map((status) => ({ value: status, label: status }))}
                />
                <button
                  type="button"
                  className="p-2 text-danger hover:bg-danger-bg rounded-lg"
                  aria-label="Remove milestone"
                  onClick={() => setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }))}
                >
                  ×
                </button>
              </div>
            ))}
            {!form.milestones.length && <p className="text-xs text-muted">No milestones added yet.</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="project-description" className={labelCls}>
            Description
          </label>
          <textarea
            id="project-description"
            placeholder="What is this project about?"
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

export default NewProjectDrawer;
