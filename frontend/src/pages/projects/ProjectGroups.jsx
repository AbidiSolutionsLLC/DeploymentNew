import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import {
  fetchProjectGroups,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
} from "../../store/projectGroupSlice";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import PortalHeader from "../../components/projectPortal/PortalHeader";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import PortalTable from "../../components/projectPortal/PortalTable";
import Progress from "../../components/projectPortal/Progress";
import Pill, { PROJECT_STATUS_TONE } from "../../components/projectPortal/Pill";
import { formatDate, shortDate, personName } from "../../components/projectPortal/helpers";
import api from "../../axios";

const apiError = (err, fallback) =>
  typeof err === "string" ? err : err?.response?.data?.message || err?.message || fallback;

const ProjectGroups = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups = [], loading } = useSelector((state) => state.projectGroups || {});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail modal state
  const [detailGroup, setDetailGroup] = useState(null);

  // Available company projects for group assignment
  const [allProjects, setAllProjects] = useState([]);

  const confirm = useConfirm();

  useEffect(() => {
    dispatch(fetchProjectGroups());
  }, [dispatch]);

  // Load projects for assigning
  useEffect(() => {
    let mounted = true;
    api.get("/projects?limit=1000")
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.data || res.data || [];
        setAllProjects(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Failed to load projects", err));
    return () => {
      mounted = false;
    };
  }, []);

  const rows = groups.filter((g) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      (g.name || "").toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q)
    );
  });

  const totalProjects = groups.reduce(
    (sum, g) => sum + (g.projectCount ?? (Array.isArray(g.projects) ? g.projects.length : 0)),
    0
  );
  const totalActiveProjects = groups.reduce(
    (sum, g) => sum + (g.activeProjectsCount ?? 0),
    0
  );
  const avgPortfolioProgress =
    groups.length > 0
      ? Math.round(groups.reduce((sum, g) => sum + (g.progress || 0), 0) / groups.length)
      : 0;

  const stats = [
    { label: "Total Portfolios", value: groups.length },
    { label: "Projects Covered", value: totalProjects },
    { label: "Active Projects", value: totalActiveProjects },
    { label: "Avg Portfolio Progress", value: `${avgPortfolioProgress}%` },
  ];

  const openCreateModal = () => {
    setEditingGroup(null);
    setName("");
    setDescription("");
    setSelectedProjects([]);
    setNameError("");
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setName(group.name || "");
    setDescription(group.description || "");
    const currentProjIds = Array.isArray(group.projects)
      ? group.projects.map((p) => (p && typeof p === "object" ? p._id : p))
      : [];
    setSelectedProjects(currentProjIds);
    setNameError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setName("");
    setDescription("");
    setSelectedProjects([]);
    setNameError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Group name is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingGroup) {
        await dispatch(
          updateProjectGroup({
            id: editingGroup._id,
            groupData: {
              name: name.trim(),
              description: description.trim(),
              projects: selectedProjects,
            },
          })
        ).unwrap();
        toast.success("Project group updated");
      } else {
        await dispatch(
          createProjectGroup({
            name: name.trim(),
            description: description.trim(),
            projects: selectedProjects,
          })
        ).unwrap();
        toast.success("Project group created");
      }
      closeModal();
      dispatch(fetchProjectGroups());
    } catch (err) {
      toast.error(apiError(err, editingGroup ? "Failed to update group" : "Failed to create group"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) =>
    confirm({
      title: "Delete Group",
      message:
        "Are you sure you want to delete this project group? Projects in this group will not be deleted, but will become ungrouped.",
      confirmText: "Delete",
      onConfirmAction: async () => {
        try {
          await dispatch(deleteProjectGroup(id)).unwrap();
          toast.success("Project group deleted");
          if (detailGroup && detailGroup._id === id) {
            setDetailGroup(null);
          }
        } catch (err) {
          toast.error(apiError(err, "Failed to delete group"));
        }
      },
    });

  const columns = [
    {
      key: "name",
      label: "Group",
      render: (v, row) => (
        <div className="min-w-0 max-w-[220px]">
          <div className="flex items-center gap-1.5">
            <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-heading truncate">{v}</p>
          </div>
          <p className="text-[11px] text-muted truncate mt-0.5">{row.description || "—"}</p>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      hideBelow: "md",
      render: (v) => <span className="text-sm text-main whitespace-nowrap">{personName(v)}</span>,
    },
    {
      key: "projects",
      label: "Projects",
      sortable: false,
      render: (_v, row) => {
        const total = row.projectCount ?? (Array.isArray(row.projects) ? row.projects.length : 0);
        const active = row.activeProjectsCount ?? 0;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tabular-nums">
              {active} active
            </span>
            <span className="text-xs text-muted tabular-nums">/ {total} total</span>
          </div>
        );
      },
    },
    {
      key: "progress",
      label: "Rollup Progress",
      render: (_v, row) => {
        const pct = row.progress ?? 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={pct} />
            <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      hideBelow: "xl",
      render: (v) => <span className="text-xs text-muted whitespace-nowrap">{formatDate(v)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PortalHeader
        eyebrow="Portfolio workspace"
        title="Project Groups"
        subtitle="Organize related projects into focused delivery portfolios."
        actions={
          <>
            <ToolbarSearch
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups..."
            />
            <button
              type="button"
              onClick={openCreateModal}
              className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" /> New Group
            </button>
          </>
        }
      >
        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-border-subtle rounded-xl px-3 py-3 min-w-0">
              <p className="text-xl sm:text-2xl font-black text-heading tabular-nums leading-none">{s.value}</p>
              <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted truncate">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </PortalHeader>

      <PortalTable
        columns={columns}
        data={rows}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        onRowClick={(row) => setDetailGroup(row)}
        actions={[
          { title: "View details", icon: EyeIcon, onClick: (row) => setDetailGroup(row) },
          { title: "Edit group", icon: PencilIcon, onClick: (row) => openEditModal(row) },
          { title: "Delete group", icon: TrashIcon, danger: true, onClick: (row) => handleDelete(row._id) },
        ]}
        rowsPerPage={10}
        emptyTitle={groups.length === 0 ? "No project groups yet" : "No matching groups"}
        emptyHint={
          groups.length === 0
            ? "Group projects into portfolios to organize and track progress."
            : "Try a different search."
        }
      />

      {/* Create / Edit Group Modal */}
      <GlassModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingGroup ? "Edit Project Group" : "Create Project Group"}
        description="Organize projects into strategic portfolios with dynamic progress roll-ups."
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <GlassButton variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" form="groupForm" isLoading={submitting}>
              {editingGroup ? "Save Changes" : "Create Group"}
            </GlassButton>
          </div>
        }
      >
        <form id="groupForm" onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="group-name"
              className="block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest"
            >
              Group Name*
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="e.g. Core Platform Q1"
              className={`glass-input ${nameError ? "is-error" : ""}`}
              required
            />
            {nameError && <p className="text-danger text-xs mt-1">{nameError}</p>}
          </div>

          <div>
            <label
              htmlFor="group-description"
              className="block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest"
            >
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What strategic purpose or initiative does this group cover?"
              rows={2}
              className="glass-input min-h-[80px] resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="group-projects"
              className="block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest"
            >
              Assigned Projects ({selectedProjects.length} selected)
            </label>
            <select
              id="group-projects"
              multiple
              value={selectedProjects}
              onChange={(e) =>
                setSelectedProjects(Array.from(e.target.selectedOptions, (o) => o.value))
              }
              className="glass-input h-32 custom-scrollbar-visible"
            >
              {allProjects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.title} ({p.status || "Planning"})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted mt-1">
              Hold Ctrl/Cmd to select or deselect multiple projects.
            </p>
          </div>
        </form>
      </GlassModal>

      {/* Group Details Drawer / Modal */}
      {detailGroup && (
        <GlassModal
          isOpen={Boolean(detailGroup)}
          onClose={() => setDetailGroup(null)}
          title={detailGroup.name}
          description={detailGroup.description || "Portfolio overview & child projects"}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-muted">
                Created: {formatDate(detailGroup.createdAt)}
              </span>
              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  onClick={() => {
                    const g = detailGroup;
                    setDetailGroup(null);
                    openEditModal(g);
                  }}
                >
                  <PencilIcon className="w-4 h-4 mr-1.5 inline" /> Edit Group
                </GlassButton>
                <GlassButton variant="secondary" onClick={() => setDetailGroup(null)}>
                  Close
                </GlassButton>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            {/* Portfolio Rollup Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border-subtle rounded-xl !p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Projects</p>
                <p className="text-xl font-black text-heading mt-1">
                  {detailGroup.projectCount ?? (Array.isArray(detailGroup.projects) ? detailGroup.projects.length : 0)}
                </p>
              </div>
              <div className="bg-card border border-border-subtle rounded-xl !p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Active</p>
                <p className="text-xl font-black text-heading mt-1">
                  {detailGroup.activeProjectsCount ?? 0}
                </p>
              </div>
              <div className="bg-card border border-border-subtle rounded-xl !p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Completed</p>
                <p className="text-xl font-black text-heading mt-1">
                  {detailGroup.completedProjectsCount ?? 0}
                </p>
              </div>
              <div className="bg-card border border-border-subtle rounded-xl !p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Progress</p>
                <p className="text-xl font-black text-heading mt-1">
                  {detailGroup.progress ?? 0}%
                </p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-heading mb-1.5">
                <span>Portfolio Completion Rate</span>
                <span>{detailGroup.progress ?? 0}%</span>
              </div>
              <Progress value={detailGroup.progress ?? 0} className="h-2.5" />
            </div>

            {/* Child Projects List */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                Group Member Projects ({Array.isArray(detailGroup.projects) ? detailGroup.projects.length : 0})
              </h3>
              {Array.isArray(detailGroup.projects) && detailGroup.projects.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {detailGroup.projects.map((proj) => {
                    const p = typeof proj === "object" ? proj : { _id: proj, title: "Project" };
                    return (
                      <div
                        key={p._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border-subtle hover:border-border-accent transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-heading truncate">{p.title}</h4>
                            <Pill tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>
                              {p.status || "Planning"}
                            </Pill>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted mt-1">
                            <span>Owner: {personName(p.owner)}</span>
                            <span>Due: {shortDate(p.dueDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:flex flex-col items-end w-24">
                            <span className="text-[10px] font-bold text-muted tabular-nums">
                              {p.progress ?? 0}%
                            </span>
                            <Progress value={p.progress ?? 0} className="w-full mt-0.5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailGroup(null);
                              navigate(`/project/projectDetailed/${p._id}`);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-card-hover transition-colors"
                            title="Open project details"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border-subtle rounded-lg text-xs text-muted">
                  No projects are currently linked to this group. You can assign projects using "Edit Group" or when creating projects.
                </div>
              )}
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

export default ProjectGroups;
