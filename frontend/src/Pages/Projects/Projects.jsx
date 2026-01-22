// src/pages/Projects.jsx  (hook-based)
import { useState } from "react";
import ProjectsTable from "../../Components/ProjectsTable";
import NewProjectDrawer from "../../Components/NewProjectDrawer";
import useProjects from "../../hooks/useProjects";
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
    <div className="px-4 py-2">
      <div className="p-8 rounded-xl bg-primary">
        <div className="bg-white px-8 py-4 font-semibold rounded-lg">Projects</div>
        <div className="my-6">
          <ProjectsTable
            projects={projects}
            loading={loading}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
            openModal={() => setShowModal(true)}
          />
          {error && <div className="text-red-500 mt-2">{String(error)}</div>}
        </div>

        <NewProjectDrawer
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateProject}
        />
      </div>
    </div>
  );
};

export default Projects;
