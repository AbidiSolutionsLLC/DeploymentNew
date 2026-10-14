import React, { useState, useEffect, useRef } from "react";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import api from "../../axios";

const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];

export default function EditProjectForm({ project, onSubmit, onClose }) {

  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    owner: project?.owner?._id || project?.owner || "",
    department: project?.department?._id || project?.department || "",
    projectGroup: project?.projectGroup?._id || project?.projectGroup || "",
    status: PROJECT_STATUSES.includes(project?.status) ? project.status : "Planning",
    team: (project?.team || []).map((m) => m._id || m),
    startDate: project?.startDate ? String(project.startDate).slice(0, 10) : "",
    dueDate: project?.dueDate ? String(project.dueDate).slice(0, 10) : "",
  });
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      let mounted = true;
      (async () => {
        setLoadingOptions(true);
        setOptionsError("");
        try {
          const [usersRes, deptsRes, groupsRes] = await Promise.all([
            api.get("/users"),
            api.get("/departments"),
            api.get("/project-groups")
          ]);
          if (!mounted) return;
          const userList = usersRes.data?.data || usersRes.data || [];
          const deptList = deptsRes.data?.data || deptsRes.data || [];
          const groupList = groupsRes.data?.data || groupsRes.data || [];
          setUsers(Array.isArray(userList) ? userList : []);
          setDepartments(Array.isArray(deptList) ? deptList : []);
          setProjectGroups(Array.isArray(groupList) ? groupList : []);
          fetchedRef.current = true;
        } catch {
          if (mounted) setOptionsError("Could not load people & departments. Close and try again.");
        } finally {
          if (mounted) setLoadingOptions(false);
        }
      })();
      return () => { mounted = false; };
    }
  }, []);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Project name is required.";
    if (!form.owner) next.owner = "Project owner is required.";
    if (!form.department) next.department = "Department is required.";
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) next.dueDate = "End date can't be before start date.";
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
        projectGroup: form.projectGroup || null,
        status: form.status,
        team: form.team,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
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

  const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {optionsError && <p className="text-danger text-xs bg-danger-bg border border-danger-border rounded-lg px-3 py-2">{optionsError}</p>}

      <div>
        <label htmlFor="project-title" className={labelCls}>Project Name*</label>
        <input id="project-title" type="text" placeholder="e.g. Website Redesign" value={form.title} onChange={(e) => set("title", e.target.value)} className={`glass-input ${errors.title ? "is-error" : ""}`} required />
        {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModernSelect label="Project Owner*" name="owner" value={form.owner} onChange={(e) => set("owner", e.target.value)} options={userOptions} placeholder={loadingOptions ? "Loading people..." : "Select owner"} required error={errors.owner} />
        {errors.owner && <p className="text-danger text-xs mt-1">{errors.owner}</p>}
        <ModernSelect label="Department*" name="department" value={form.department} onChange={(e) => set("department", e.target.value)} options={departmentOptions} placeholder={loadingOptions ? "Loading departments..." : "Select department"} required error={errors.department} />
        {errors.department && <p className="text-danger text-xs mt-1">{errors.department}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModernSelect label="Status" name="status" value={form.status} onChange={(e) => set("status", e.target.value)} options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))} />
        <ModernSelect label="Project Group (Optional)" name="projectGroup" value={form.projectGroup} onChange={(e) => set("projectGroup", e.target.value)} options={groupOptions} placeholder={loadingOptions ? "Loading groups..." : "Select project group"} />
      </div>

      <div>
        <label htmlFor="project-team" className={labelCls}>Team Members</label>
        <select id="project-team" multiple value={form.team} onChange={(e) => set("team", Array.from(e.target.selectedOptions, (o) => o.value))} className="glass-input h-24 custom-scrollbar-visible">
          {users.map((u) => (<option key={u._id || u.id} value={u._id || u.id}>{u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}</option>))}
        </select>
        <p className="text-[10px] text-muted mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModernDatePicker label="Start Date" name="startDate" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        <ModernDatePicker label="End Date" name="dueDate" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} error={errors.dueDate} />
      </div>
      {errors.dueDate && <p className="text-danger text-xs -mt-2">{errors.dueDate}</p>}

      <div>
        <label htmlFor="project-description" className={labelCls}>Description</label>
        <textarea id="project-description" placeholder="What is this project about?" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="glass-input min-h-[90px] resize-y" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <GlassButton variant="secondary" type="button" onClick={onClose} disabled={saving}>Cancel</GlassButton>
        <GlassButton variant="primary" type="submit" isLoading={saving}>Save Changes</GlassButton>
      </div>
    </form>
  );
}