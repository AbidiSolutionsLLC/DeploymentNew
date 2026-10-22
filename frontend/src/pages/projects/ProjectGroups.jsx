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
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { FaLayerGroup, FaFolderOpen, FaPlayCircle, FaChartLine } from "react-icons/fa";
import PageContainer from "../../components/ui/PageContainer";
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
import PortalHero from "../../components/ui/PortalHero";
import PortalToolbar, { ToolbarSelect } from "../../components/projectPortal/PortalToolbar";
import PortalTable from "../../components/projectPortal/PortalTable";
import {
  TableDate,
  TablePerson,
  TableProgress,
  TableStatus,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import Progress from "../../components/projectPortal/Progress";
import { formatDate, shortDate, personName } from "../../components/projectPortal/helpers";
import api from "../../axios";

const apiError = (err, fallback) =>
  typeof err === "string" ? err : err?.response?.data?.message || err?.message || fallback;

const GROUP_SORTS = [
  { value: "createdAt", label: "Created date" },
  { value: "name", label: "Group name" },
  { value: "owner", label: "Owner" },
  { value: "progress", label: "Progress" },
];

/**
 * KPI configuration matching Project Dashboard design
 */
const KPIS = [
  { label: "Total Portfolios", key: "totalPortfolios", Icon: FaLayerGroup, sub: "Groups created", tone: "amber" },
  { label: "Projects Covered", key: "projectsCovered", Icon: FaFolderOpen, sub: "Across all groups", tone: "sky" },
  { label: "Active Projects", key: "activeProjects", Icon: FaPlayCircle, sub: "Currently active", tone: "emerald" },
  { label: "Avg Portfolio Progress", key: "avgProgress", Icon: FaChartLine, sub: "Mean completion", tone: "violet" },
];

const KPI_TONES = {
  amber: {
    wash: "bg-[rgba(232,213,160,0.25)] dark:bg-[rgba(251,191,36,0.09)]",
    tile: "border-accent bg-[linear-gradient(135deg,#E8D5A0,#C5B588)] text-brand-text dark:border-[rgba(251,191,36,0.45)] dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.30),rgba(245,158,11,0.10))] dark:text-[#FFE7A3] dark:shadow-[0_0_26px_-6px_rgba(251,191,36,0.65)]",
    rail: "via-[rgba(251,191,36,0.8)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.16),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(251,191,36,0.4)]",
  },
  emerald: {
    wash: "dark:hover:bg-[rgba(16,185,129,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(52,211,153,0.4)] dark:bg-[rgba(16,185,129,0.16)] dark:text-[#6EE7B7] dark:shadow-[0_0_24px_-8px_rgba(16,185,129,0.75)]",
    rail: "via-[rgba(52,211,153,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(16,185,129,0.35)]",
  },
  sky: {
    wash: "dark:hover:bg-[rgba(56,189,248,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(56,189,248,0.4)] dark:bg-[rgba(56,189,248,0.16)] dark:text-[#7DD3FC] dark:shadow-[0_0_24px_-8px_rgba(56,189,248,0.75)]",
    rail: "via-[rgba(56,189,248,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(56,189,248,0.35)]",
  },
  violet: {
    wash: "dark:hover:bg-[rgba(167,139,250,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(167,139,250,0.4)] dark:bg-[rgba(167,139,250,0.16)] dark:text-[#C4B5FD] dark:shadow-[0_0_24px_-8px_rgba(167,139,250,0.75)]",
    rail: "via-[rgba(167,139,250,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(167,139,250,0.35)]",
  },
};

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

  const kpiData = {
    totalPortfolios: groups.length,
    projectsCovered: totalProjects,
    activeProjects: totalActiveProjects,
    avgProgress: avgPortfolioProgress,
  };

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
      key: "_index",
      label: "#",
      type: "index",
      sortable: false,
      width: 56,
      hideBelow: "sm",
    },
    {
      key: "name",
      label: "Group",
      render: (v, row) => (
        <TableTitle
          title={v}
          subtitle={row.description || undefined}
          maxWidth="max-w-[240px]"
          leading={
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border-accent bg-amber-50 text-brand-text dark:bg-amber-900/30">
              <FolderIcon className="h-4 w-4" />
            </span>
          }
        />
      ),
    },
    {
      key: "owner",
      label: "Owner",
      hideBelow: "md",
      render: (v) => {
        const name = personName(v);
        return name && name !== "—" ? (
          <TablePerson name={name} size="sm" />
        ) : (
          <TableText value="" />
        );
      },
    },
    {
      key: "projects",
      label: "Projects",
      sortable: false,
      render: (_v, row) => {
        const total = row.projectCount ?? (Array.isArray(row.projects) ? row.projects.length : 0);
        const active = row.activeProjectsCount ?? 0;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="lm-success-badge">{active} active</span>
            <span className="text-[11px] font-medium text-muted">{total} total</span>
          </div>
        );
      },
    },
    {
      key: "progress",
      label: "Rollup Progress",
      render: (_v, row) => <TableProgress value={row.progress ?? 0} width="min-w-[120px]" />,
    },
    {
      key: "createdAt",
      label: "Created",
      hideBelow: "xl",
      render: (v) => <TableDate value={v} tone="muted" />,
    },
  ];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      <PortalHero
        label="Project groups overview"
        title="Project Groups"
        description="Organize related projects into focused delivery portfolios."
      />

      {/* Summary KPIs */}
      <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_4px_20px_0_rgba(15,23,42,0.06)] backdrop-blur-[16px] dark:border-white/10 dark:bg-[linear-gradient(145deg,#1e293b_0%,#1a2436_55%,#162031_100%)] dark:shadow-[0_22px_60px_-24px_rgba(0,0,0,0.85)]">
        <span
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[rgba(232,213,160,0.7)] blur-3xl dark:bg-[rgba(251,191,36,0.16)]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-[rgba(232,213,160,0.3)] blur-3xl dark:bg-[rgba(251,191,36,0.08)]"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((kpi, index) => {
              const Icon = kpi.Icon;
              const tone = KPI_TONES[kpi.tone];
              const borders = [
                index > 0 ? "border-t border-border-subtle dark:border-white/10" : "",
                index % 2 === 1 ? "sm:border-l sm:border-border-subtle sm:dark:border-white/10" : "",
                index < 2 ? "sm:border-t-0" : "",
                index > 0 ? "lg:border-l lg:border-border-subtle lg:dark:border-white/10" : "",
                "lg:border-t-0",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={kpi.key}
                  className={`group relative flex items-center gap-4 overflow-hidden px-5 py-5 transition-colors duration-300 ${tone.wash} ${borders}`}
                >
                  <span
                    className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 dark:opacity-100 ${tone.rail}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${tone.glow}`}
                    aria-hidden="true"
                  />

                  <span
                    className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 ${tone.tile}`}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="relative min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-muted dark:text-slate-300">
                      {kpi.label}
                    </p>
                    <p className={`mt-1.5 text-2xl font-black leading-none text-heading tabular-nums dark:text-white ${tone.value}`}>
                      {kpiData[kpi.key] ?? 0}
                      {kpi.key === "avgProgress" && "%"}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-medium text-muted dark:text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Toolbar card — search, filters & actions live here, never in the hero */}
      <PortalToolbar
        searchValue={query}
        onSearchChange={(e) => setQuery(e.target.value)}
        searchPlaceholder="Search groups..."
        showing={rows.length}
        total={groups.length}
        countLabel="groups"
        filtersActive={query.trim() !== ""}
        onReset={() => setQuery("")}
        filters={
          <>
            <ToolbarSelect
              label="Sort by"
              value={sort.key}
              onChange={(e) => {
                const key = e.target.value;
                setSort({
                  key,
                  direction: key === "createdAt" || key === "progress" ? "desc" : "asc",
                });
              }}
              ariaLabel="Sort project groups"
              options={GROUP_SORTS}
            />
            <button
              type="button"
              onClick={() =>
                setSort((current) => ({
                  ...current,
                  direction: current.direction === "asc" ? "desc" : "asc",
                }))
              }
              className="lm-filter-reset"
              title="Toggle sort direction"
            >
              <ArrowsUpDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {sort.direction === "asc" ? "Ascending" : "Descending"}
            </button>
          </>
        }
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 mr-2" /> New Group
          </button>
        }
      />

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
        countLabel="groups"
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
          <>
            <GlassButton variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" form="groupForm" isLoading={submitting}>
              {editingGroup ? "Save Changes" : "Create Group"}
            </GlassButton>
          </>
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
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 w-full">
              <span className="text-xs text-muted">
                Created: {formatDate(detailGroup.createdAt)}
              </span>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <GlassButton variant="secondary" onClick={() => setDetailGroup(null)}>
                  Close
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    const g = detailGroup;
                    setDetailGroup(null);
                    openEditModal(g);
                  }}
                >
                  <PencilIcon className="w-4 h-4 mr-1.5 inline" /> Edit Group
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
                            <TableStatus value={p.status || "Planning"} />
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
                            className="p-1.5 rounded-lg text-muted hover:text-brand-text hover:bg-card-hover transition-colors"
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
    </PageContainer>
  );
};

export default ProjectGroups;
