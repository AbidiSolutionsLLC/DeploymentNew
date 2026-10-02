// src/pages/Projects.jsx (hook-based)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectsTable from "../../components/ProjectsTable";
import NewProjectDrawer from "../../components/NewProjectDrawer";
import useProjects from "../../hooks/useProjects";
import projectApi from "../../api/projectApi";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import SearchBar from "../../components/SearchBar";
import { FaPlus } from "react-icons/fa";
import useVariant from "../../components/prototype/useVariant";
import PrototypeSwitcher from "../../components/prototype/PrototypeSwitcher";
import ProjectsA from "./prototype/a/Projects";
import ProjectsB from "./prototype/b/Projects";
import ProjectsC from "./prototype/c/Projects";

// PROTOTYPE: `?variant=` renders one of three redesign proposals; absent → current UI.
const Projects = () => {
 const navigate = useNavigate();
 const { projects, loading, error, refetch } = useProjects(); // autoFetch true
 const [showModal, setShowModal] = useState(false);
 const { variant } = useVariant();

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

 const handleRowClick = (project) =>
  navigate(`/project/projectDetailed/${project._id || project.projectID || project.id}`);

 const content =
  variant === "a" ? (
   <ProjectsA
    projects={projects}
    loading={loading}
    error={error}
    onNew={() => setShowModal(true)}
    onRowClick={handleRowClick}
   />
  ) : variant === "b" ? (
   <ProjectsB
    projects={projects}
    loading={loading}
    error={error}
    onNew={() => setShowModal(true)}
    onRowClick={handleRowClick}
   />
  ) : variant === "c" ? (
   <ProjectsC
    projects={projects}
    loading={loading}
    error={error}
    onNew={() => setShowModal(true)}
    onRowClick={handleRowClick}
   />
  ) : (
   <PageContainer
    title="Projects"
    subtitle="Manage and track company projects"
    loading={loading}
    isCard={true}
    headerActions={
     <div className="flex items-center gap-3">
      <SearchBar />
      <button
       onClick={() => setShowModal(true)}
       className="flex items-center gap-2 btn btn-primary py-2.5 px-4"
      >
       <FaPlus /> New Project
      </button>
     </div>
    }
   >
    <div className="my-2">
     <ProjectsTable
      projects={projects}
      loading={loading}
      onUpdate={handleUpdateProject}
      onDelete={handleDeleteProject}
      openModal={() => setShowModal(true)}
      onRowClick={handleRowClick}
     />
     {error && <div className="text-red-500 mt-2">{String(error)}</div>}
    </div>
   </PageContainer>
  );

 return (
  <>
   {content}
   <NewProjectDrawer
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onSubmit={handleCreateProject}
   />
   <PrototypeSwitcher />
  </>
 );
};

export default Projects;

