import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import usePermission from "../../hooks/usePermission";
import { PlusIcon, PencilIcon, TrashIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import NewProjectDrawer from "../../components/NewProjectDrawer";
import useProjects from "../../hooks/useProjects";
import projectApi from "../../api/projectApi";
import api from "../../axios";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTable from "../../components/projectPortal/PortalTable";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import ProjectStatusFilter, { PROJECT_STATUS_OPTIONS } from "../../components/projectPortal/ProjectStatusFilter";
import GlassButton from "../../components/ui/GlassButton";
import {
  TableDate,
  TablePerson,
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
const STATUS_OPTIONS = PROJECT_STATUS_OPTIONS;

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isProjectAdmin, isProjectManager, isProjectEmployee, projectRole, user } = usePermission();
  const isSuperAdmin = projectRole === 'superadmin';
  const isAdmin = isProjectAdmin;
  const isManager = isProjectManager;
  const canCreateProject = isProjectAdmin;
  const canDeleteProject = isProjectAdmin;

  const { projects, loading, error, refetch } = useProjects();
  const [query, setQuery] = useState("");

  const getInitialStatus = () => {
    const target = searchParams.get("status") || location.state?.status;
    if (target && (STATUS_OPTIONS.some((o) => o.value === target) || target === "Delayed")) {
      return target;
    }
    return "All";
  };

  const [status, setStatus] = useState(getInitialStatus);
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  useEffect(() => {
    const target = searchParams.get("status") || location.state?.status;
    if (target && (STATUS_OPTIONS.some((o) => o.value === target) || target === "Delayed")) {
      setStatus(target);
    }
  }, [searchParams, location.state]);

  const isDelayedProject = (p) => {
    if (!p.dueDate) return false;
    if (p.status === "Completed" || p.status === "Cancelled") return false;
    return new Date(p.dueDate) < new Date();
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      let matchStatus = true;
      if (status === "Delayed") {
        matchStatus = isDelayedProject(p);
      } else if (status !== "All") {
        matchStatus = p.status === status;
      }

      const matchQuery =
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.projectID || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [projects, query, status]);

  const statusCounts = useMemo(() => {
    const counts = {
      All: projects.length,
      Planning: 0,
      Active: 0,
      "On Hold": 0,
      Completed: 0,
      Delayed: 0,
      Cancelled: 0,
    };
    projects.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status] += 1;
      }
      if (isDelayedProject(p)) {
        counts.Delayed += 1;
      }
    });
    return counts;
  }, [projects]);

  const filtersActive = status !== "All";
  const resetFilters = () => {
    setStatus("All");
    setSearchParams({});
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
      key: "_index",
      label: "#",
      type: "index",
      sortable: false,
      width: 56,
      hideBelow: "sm",
    },
    {
      key: "projectID",
      label: "ID",
      hideBelow: "xl",
      render: (v) => <TableText value={v} muted />,
    },
    {
      key: "title",
      label: "Project",
      render: (v, row) => (
        <TableTitle
          title={v}
          subtitle={row.description || undefined}
          maxWidth="max-w-[240px]"
          leading={
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border-accent bg-amber-50 text-brand-text dark:bg-amber-900/30">
              <RectangleStackIcon className="h-4 w-4" />
            </span>
          }
        />
      ),
    },
    {
      key: "owner",
      label: "Owner",
      hideBelow: "lg",
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

  const tableActions = [
    ...((canCreateProject || isManager)
      ? [{
          title: "Edit",
          icon: PencilIcon,
          onClick: openEdit,
          disabled: (row) => !canCreateProject && ((row.owner?._id || row.owner) !== (user?._id || user?.id))
        }]
      : []),
    ...(canDeleteProject
      ? [{
          title: "Delete",
          icon: TrashIcon,
          danger: true,
          onClick: handleDeleteProject,
        }]
      : [])
  ];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      <PortalHero
        label="Projects overview"
        title="Projects"
        compact
      />

      {/* Filter Panel - search, status filter & action without top divider line */}
      <FilterPanel>
        <FilterRow className="items-center">
          <GlassInput
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <ProjectStatusFilter
            value={status}
            onChange={(next) => {
              setStatus(next);
              if (next === "All") {
                setSearchParams({});
              } else {
                setSearchParams({ status: next });
              }
            }}
            counts={statusCounts}
          />
          {filtersActive && (
            <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
              RESET
            </GlassButton>
          )}
          {canCreateProject && (
            <div className="ml-auto flex-shrink-0">
              <GlassButton variant="primary" size="sm" icon={PlusIcon} onClick={openNew}>
                New Project
              </GlassButton>
            </div>
          )}
        </FilterRow>
      </FilterPanel>

      <PortalTable
        columns={columns}
        data={rows}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
        actions={tableActions}
        rowsPerPage={10}
        countLabel="projects"
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
