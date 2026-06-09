// src/pages/Projects.jsx  (hook-based)
import { useState } from "react";
import ProjectsTable from "../../Components/ProjectsTable";
import NewProjectDrawer from "../../Components/NewProjectDrawer";
import useProjects from "../../Hooks/useProjects";
import projectApi from "../../api/projectApi";
import { toast } from "react-toastify";

const Projects = () => {
  const { projects, loading, error, refetch } = useProjects(); // autoFetch true
  const [showModal, setShowModal] = useState(false);

  const handleCreateProject = async (projectData) => {
    try {
      await projectApi.createProject(projectData);
      toast.success("Project created successfully");
      setShowModal(false);
      await refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to create project");
    }
  };

  const handleUpdateProject = async (id, updates) => {
    try {
      await projectApi.updateProject(id, updates);
      toast.success("Project updated successfully");
      await refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to update project");
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await projectApi.deleteProject(id);
      toast.success("Project deleted successfully");
      await refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to delete project");
    }
  };

  return (
    <div className="w-full bg-transparent min-h-screen p-4">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Projects
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Manage and track organization projects
            </p>
          </div>
        </div>
      </div>

      <div className="my-6">
        <ProjectsTable
          projects={projects}
          loading={loading}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          openModal={() => setShowModal(true)}
        />
        {error && <div className="text-red-500 mt-2 text-[10px] font-black uppercase tracking-widest">{String(error)}</div>}
      </div>

      <NewProjectDrawer
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default Projects;
