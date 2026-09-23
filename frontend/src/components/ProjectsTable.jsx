import React from "react";
import { FaPlus } from "react-icons/fa";
import SearchBar from "./SearchBar";
import TableWithPagination from "./TableWithPagination";
import { useConfirm } from "../context/ConfirmContext";

const ProjectsTable = ({
 projects,
 loading,
 onUpdate,
 onDelete,
 openModal,
 onRowClick
}) => {
 const confirm = useConfirm();

 const handleEdit = (project) => {
 // You can implement edit functionality here
 // For example, open a modal with the project data
 console.log("Edit project:", project);
 };

 const handleDelete = async (projectId) => {
 await confirm({ 
  title: "Delete Project", 
  message: "Are you sure you want to delete this project?",
  onConfirmAction: async () => {
    await onDelete(projectId);
  }
 });
 };

 // Function to decide color based on completion
 const getProgressColor = (percentage) => {
 if (percentage < 40) return "#f44336"; // red
 if (percentage < 70) return "#ff9800"; // orange
 return "#4caf50"; // green
 };

 const projectColumns = [
 {
 key: "projectID",
 label: "ID",
 render: (val, project) => <span className="whitespace-nowrap font-medium text-muted">{val || project._id?.slice(-6).toUpperCase()}</span>
 },
 {
 key: "title",
 label: "Project Name",
 render: (val, project) => (
 <div className="whitespace-nowrap relative group">
 <span className="font-semibold text-main">{val}</span>
 </div>
 )
 },
 {
 key: "owner",
 label: "Project Owner",
 render: (val) => <span className="whitespace-nowrap">{val?.name || "N/A"}</span>
 },
 {
 key: "team",
 label: "No.Of User",
 render: (val) => <span className="whitespace-nowrap">{val?.length || 0}</span>
 },
 {
 key: "status",
 label: "Status",
 render: (val) => {
 const status = val || "Planning";
 let colorClass = "bg-app text-main";
 if (status === "Active") colorClass = "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400";
 if (status === "Completed") colorClass = "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400";
 if (status === "On Hold") colorClass = "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400";
 
 return (
 <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass}`}>
 {status}
 </span>
 );
 }
 },
 {
 key: "startDate",
 label: "Start Date",
 render: (val) => <span className="whitespace-nowrap text-muted">{val ? new Date(val).toLocaleDateString() : "N/A"}</span>
 },
 {
 key: "dueDate",
 label: "End Date",
 render: (val) => <span className="whitespace-nowrap text-muted">{val ? new Date(val).toLocaleDateString() : "N/A"}</span>
 },
 {
 key: "completion",
 label: "Progress",
 render: (val, project) => { const statusProgressMap = { 'Completed': 100, 'Active': 50, 'In Progress': 50, 'On Hold': 30, 'Planning': 15 }; const progress = val || statusProgressMap[project?.status] || 0; return ( <div className="whitespace-nowrap w-24">
 <div className="w-full bg-app rounded-full h-2.5 overflow-hidden border border-border-subtle">
 <div
 className="h-full transition-all duration-300"
 style={{
 width: `${progress}%`,
 background: getProgressColor(progress),
 }}
 ></div>
 </div>
 </div>
 );
 }
 }
 ];

 return (
 <div className="w-full flex flex-col gap-4">
 <TableWithPagination
 columns={projectColumns}
 data={projects}
 loading={loading}
 emptyMessage="No projects found"
 defaultSort={{ key: "createdAt", direction: "desc" }}
 onRowClick={onRowClick}
 />
 </div>
 );
};

export default ProjectsTable;


