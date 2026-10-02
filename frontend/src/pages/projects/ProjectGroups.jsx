import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { fetchProjectGroups, createProjectGroup, deleteProjectGroup } from "../../store/projectGroupSlice";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import PortalHeader from "../../components/projectPortal/PortalHeader";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import PortalTable from "../../components/projectPortal/PortalTable";
import { formatDate, personName } from "../../components/projectPortal/helpers";

/**
 * Project Groups — "Command Center" list page (PROJECT_PORTAL_DESIGN.md §9.4):
 * summary strip (3 mini stats) + dense table with delete action.
 */
const apiError = (err, fallback) =>
  typeof err === "string" ? err : err?.response?.data?.message || err?.message || fallback;

const ProjectGroups = () => {
  const dispatch = useDispatch();
  const { groups = [], loading } = useSelector((state) => state.projectGroups || {});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const confirm = useConfirm();

  useEffect(() => {
    dispatch(fetchProjectGroups());
  }, [dispatch]);

  const rows = groups.filter((g) => {
    const q = query.trim().toLowerCase();
    return !q || (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q);
  });

  const totalProjects = groups.reduce(
    (sum, g) => sum + (Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0),
    0
  );
  const owners = new Set(
    groups.map((g) => g.owner?._id || g.owner?.email || (typeof g.owner === "string" ? g.owner : null))
  ).size;

  const stats = [
    { label: "Total Groups", value: groups.length },
    { label: "Projects Covered", value: totalProjects },
    { label: "Group Owners", value: owners },
  ];

  const closeModal = () => {
    setShowModal(false);
    setName("");
    setDescription("");
    setNameError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Group name is required.");
      return;
    }
    try {
      await dispatch(createProjectGroup({ name: name.trim(), description })).unwrap();
      toast.success("Project group created");
      closeModal();
    } catch (err) {
      toast.error(apiError(err, "Failed to create group"));
    }
  };

  const handleDelete = (id) =>
    confirm({
      title: "Delete Group",
      message: "Are you sure you want to delete this project group?",
      confirmText: "Delete",
      onConfirmAction: async () => {
        try {
          await dispatch(deleteProjectGroup(id)).unwrap();
          toast.success("Project group deleted");
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
          <p className="text-sm font-semibold text-heading truncate">{v}</p>
          <p className="lg:hidden text-[11px] text-muted truncate">{row.description || "—"}</p>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      hideBelow: "lg",
      render: (v) => <span className="text-xs text-muted max-w-[260px] block truncate">{v || "—"}</span>,
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
      render: (v) => (
        <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-md bg-amber-50 border border-border-accent text-brand-text text-xs font-black tabular-nums">
          {Array.isArray(v) ? v.length : Number(v) || 0}
        </span>
      ),
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
        title="Project Groups"
        subtitle="Portfolios and groupings"
        actions={
          <>
            <ToolbarSearch
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups..."
            />
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" /> New Group
            </button>
          </>
        }
      >
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-px bg-border-subtle rounded-lg overflow-hidden">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-3 py-3 text-center min-w-0">
              <p className="text-lg sm:text-xl font-black text-heading tabular-nums leading-none">{s.value}</p>
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
        actions={[
          { title: "Delete group", icon: TrashIcon, danger: true, onClick: (row) => handleDelete(row._id) },
        ]}
        rowsPerPage={10}
        emptyTitle={groups.length === 0 ? "No project groups yet" : "No matching groups"}
        emptyHint={
          groups.length === 0
            ? "Group projects into portfolios to organize your work."
            : "Try a different search."
        }
      />

      <GlassModal
        isOpen={showModal}
        onClose={closeModal}
        title="Create Project Group"
        description="Group projects into portfolios to organize your work."
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <GlassButton variant="secondary" onClick={closeModal}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" form="groupForm">
              Create Group
            </GlassButton>
          </div>
        }
      >
        <form id="groupForm" onSubmit={handleCreate} className="flex flex-col gap-4">
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
              placeholder="e.g. Q1 Campaigns"
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
              placeholder="What is this group for?"
              rows={3}
              className="glass-input min-h-[100px] resize-y"
            />
          </div>
        </form>
      </GlassModal>
    </div>
  );
};

export default ProjectGroups;
