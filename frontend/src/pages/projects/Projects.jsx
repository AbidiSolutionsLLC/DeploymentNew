import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, XMarkIcon, ChevronDownIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { FaClock, FaCheckCircle, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import NewProjectDrawer from "../../components/NewProjectDrawer";
import useProjects from "../../hooks/useProjects";
import projectApi from "../../api/projectApi";
import api from "../../axios";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import PageContainer from "../../components/ui/PageContainer";
import StatCard from "../../components/ui/StatCard";
import PortalHero from "../../components/ui/PortalHero";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import PortalTable from "../../components/projectPortal/PortalTable";
import {
  TableDate,
  TableProgress,
  TableStatus,
  TablePill,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import { projectProgress, personName } from "../../components/projectPortal/helpers";

/**
 * Projects — "Command Center" list page (PROJECT_PORTAL_DESIGN.md §9.2).
 * Full list loaded once (GET /projects?limit=1000); search/filter/sort/page client-side.
 */
const STATUSES = ["All", "Planning", "Active", "On Hold", "Completed", "Cancelled"];

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, error, refetch } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [projectGroups, setProjectGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  useEffect(() => {
    let mounted = true;
    api.get("/project-groups")
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.data || res.data || [];
        setProjectGroups(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Failed to load project groups", err));
    return () => { mounted = false; };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchStatus = status === "All" || p.status === status;
      const groupMatch =
        selectedGroup === "All" ||
        (selectedGroup === "None"
          ? !p.projectGroup
          : (p.projectGroup?._id || p.projectGroup) === selectedGroup);
      const groupName = p.projectGroup?.name || "";
      const matchQuery =
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.projectID || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        groupName.toLowerCase().includes(q);
      return matchStatus && groupMatch && matchQuery;
    });
  }, [projects, query, status, selectedGroup]);

  const countFor = (s) => (s === "All" ? projects.length : projects.filter((p) => p.status === s).length);
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;
  const dueSoonCount = projects.filter((p) => {
    if (!p.dueDate || p.status === "Completed" || p.status === "Cancelled") return false;
    const due = new Date(p.dueDate).getTime();
    return due >= Date.now() && due <= Date.now() + 14 * 24 * 60 * 60 * 1000;
  }).length;
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + projectProgress(project), 0) / projects.length)
    : 0;

  const filtersActive = status !== "All" || selectedGroup !== "All";
  const resetFilters = () => {
    setStatus("All");
    setSelectedGroup("All");
  };

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  // Create vs edit — same drawer, same payload shape (PUT supports all fields).
  const handleSave = async (payload) => {
    try {
      if (editing) {
        await projectApi.updateProject(editing._id, payload);
        toast.success("Project updated successfully");
      } else {
        await projectApi.createProject(payload);
        toast.success("Project created successfully");
      }
      closeDrawer();
      await refetch();
    } catch (err) {
      toast.error(apiError(err, editing ? "Failed to update project" : "Failed to create project"));
    }
  };

  const handleDeleteProject = (project) =>
    confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
      confirmText: "Delete",
      onConfirmAction: async () => {
        try {
          await projectApi.deleteProject(project._id);
          toast.success("Project deleted successfully");
          await refetch();
        } catch (err) {
          toast.error(apiError(err, "Failed to delete project"));
        }
      },
    });

  const handleRowClick = (project) => navigate(`/project/projectDetailed/${project._id}`);

  const columns = [
    {
      key: "projectID",
      label: "ID",
      hideBelow: "xl",
      render: (v) => <TableText value={v} muted />,
    },
    {
      key: "title",
      label: "Project",
      render: (v, row) => <TableTitle title={v} subtitle={row.description || undefined} maxWidth="max-w-[220px]" />,
    },
    {
      key: "projectGroup",
      label: "Group",
      hideBelow: "lg",
      render: (v) => {
        const name = v?.name || (typeof v === "string" ? v : null);
        return name ? <TablePill>{name}</TablePill> : <TableText value="" />;
      },
    },
    {
      key: "owner",
      label: "Owner",
      hideBelow: "lg",
      render: (v) => <TableText value={personName(v)} />,
    },
    {
      key: "team",
      label: "Team",
      hideBelow: "xl",
      render: (v) => <TableText value={`${v?.length || 0} people`} />,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <TableStatus value={v || "Planning"} />,
    },
    {
      key: "startDate",
      label: "Start",
      hideBelow: "md",
      render: (v) => <TableDate value={v} tone="muted" />,
    },
    {
      key: "dueDate",
      label: "End",
      hideBelow: "md",
      render: (v) => <TableDate value={v} tone="muted" />,
    },
    {
      key: "progress",
      label: "Progress",
      render: (_v, row) => <TableProgress value={projectProgress(row)} />,
    },
  ];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      <PortalHero
        label="Projects overview"
        title="Projects"
        description="Manage delivery, ownership, and progress across every project."
      />

      <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Active projects", value: activeCount, Icon: FaClock, sub: "In progress", tone: "text-sky-600 dark:text-sky-400" },
          { label: "Completed", value: completedCount, Icon: FaCheckCircle, sub: "Delivered", tone: "text-emerald-600 dark:text-emerald-400" },
          { label: "Due in 14 days", value: dueSoonCount, Icon: FaCalendarAlt, sub: "Approaching", tone: "text-amber-600 dark:text-amber-400" },
          { label: "Average progress", value: `${averageProgress}%`, Icon: FaChartLine, sub: "Across all projects", tone: "text-indigo-600 dark:text-indigo-400" },
        ].map(({ label, value, Icon, sub, tone }) => (
          <StatCard key={label} title={label} value={value} sub={sub} icon={Icon} tone={tone} />
        ))}
      </div>

      {/* Toolbar card — search, filters & actions live here, never in the hero */}
      <div className="glass-card !p-3.5 sm:!p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ToolbarSearch
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
            />
            <button
              type="button"
              onClick={openNew}
              className="btn btn-primary py-2.5 px-4 whitespace-nowrap sm:ml-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" /> New Project
            </button>
          </div>

          <div className="lm-filterbar border-t border-border-subtle pt-3">
            <span className="lm-filterbar__lead">
              <FunnelIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Filters
            </span>

            <div className="lm-filter-fields">
              <label className="lm-filter-field">
                <span className="lm-filter-field__label">Status</span>
                <span className="lm-filter-select-wrap">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="lm-filter-select"
                    aria-label="Filter projects by status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {`${s} (${countFor(s)})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="lm-filter-chevron" aria-hidden="true" />
                </span>
              </label>

              {projectGroups.length > 0 && (
                <label className="lm-filter-field">
                  <span className="lm-filter-field__label">Group</span>
                  <span className="lm-filter-select-wrap">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="lm-filter-select"
                      aria-label="Filter projects by group"
                    >
                      <option value="All">All Groups</option>
                      <option value="None">No Group</option>
                      {projectGroups.map((g) => (
                        <option key={g._id || g.id} value={g._id || g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="lm-filter-chevron" aria-hidden="true" />
                  </span>
                </label>
              )}
            </div>

            <div className="lm-filterbar__meta">
              <span className="lm-filterbar__meta-text">
                Showing <b>{rows.length}</b> of {projects.length}
              </span>
              {filtersActive && (
                <button type="button" onClick={resetFilters} className="lm-filter-reset">
                  <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <PortalTable
        columns={columns}
        data={rows}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
        actions={[
          { title: "Edit", icon: PencilIcon, onClick: openEdit },
          { title: "Delete", icon: TrashIcon, danger: true, onClick: handleDeleteProject },
        ]}
        rowsPerPage={10}
        emptyTitle={projects.length === 0 ? "No projects yet" : "No matching projects"}
        emptyHint={
          projects.length === 0
            ? "Create your first project to get started."
            : "Try a different search or status filter."
        }
      />

      <NewProjectDrawer isOpen={drawerOpen} onClose={closeDrawer} onSubmit={handleSave} project={editing} />
      </div>
    </PageContainer>
  );
};

export default Projects;
