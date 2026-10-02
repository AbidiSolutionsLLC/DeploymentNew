import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import NewProjectDrawer from "../../components/NewProjectDrawer";
import useProjects from "../../hooks/useProjects";
import projectApi from "../../api/projectApi";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import PortalHeader from "../../components/projectPortal/PortalHeader";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import FilterChips from "../../components/projectPortal/FilterChips";
import PortalTable from "../../components/projectPortal/PortalTable";
import Pill, { PROJECT_STATUS_TONE } from "../../components/projectPortal/Pill";
import Progress from "../../components/projectPortal/Progress";
import { formatDate, projectProgress, personName } from "../../components/projectPortal/helpers";

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
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (!q ||
          (p.title || "").toLowerCase().includes(q) ||
          (p.projectID || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q))
    );
  }, [projects, query, status]);

  const countFor = (s) => (s === "All" ? projects.length : projects.filter((p) => p.status === s).length);

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
      render: (v) => <span className="text-xs font-medium text-muted whitespace-nowrap">{v || "—"}</span>,
    },
    {
      key: "title",
      label: "Project",
      render: (v, row) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="text-sm font-semibold text-heading truncate">{v}</p>
          {row.description && <p className="text-[11px] text-muted truncate">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      hideBelow: "lg",
      render: (v) => <span className="text-sm text-main whitespace-nowrap">{personName(v)}</span>,
    },
    {
      key: "team",
      label: "Team",
      hideBelow: "xl",
      render: (v) => <span className="text-sm text-main whitespace-nowrap">{v?.length || 0} people</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <Pill tone={PROJECT_STATUS_TONE[v] || "neutral"}>{v || "Planning"}</Pill>,
    },
    {
      key: "startDate",
      label: "Start",
      hideBelow: "md",
      render: (v) => <span className="text-xs text-muted whitespace-nowrap">{formatDate(v)}</span>,
    },
    {
      key: "dueDate",
      label: "End",
      hideBelow: "md",
      render: (v) => <span className="text-xs text-muted whitespace-nowrap">{formatDate(v)}</span>,
    },
    {
      key: "progress",
      label: "Progress",
      render: (_v, row) => {
        const pct = projectProgress(row);
        return (
          <div className="flex items-center gap-2 min-w-[110px]">
            <Progress value={pct} />
            <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PortalHeader
        title="Projects"
        subtitle={`${rows.length} of ${projects.length} projects in view`}
        actions={
          <>
            <ToolbarSearch
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
            />
            <button type="button" onClick={openNew} className="btn btn-primary py-2.5 px-4 whitespace-nowrap">
              <PlusIcon className="w-4 h-4 mr-2" /> New Project
            </button>
          </>
        }
      >
        <FilterChips
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: s, count: countFor(s) }))}
        />
      </PortalHeader>

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
  );
};

export default Projects;
