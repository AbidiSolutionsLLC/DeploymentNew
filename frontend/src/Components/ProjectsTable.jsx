import React from "react";
import { FaPlus } from "react-icons/fa";
import SearchBar from "./SearchBar";
import TableWithPagination from "./TableWithPagination";

const ProjectsTable = ({
 projects,
 loading,
 onUpdate,
 onDelete,
 openModal,
}) => {
 const handleEdit = (project) => {
 // You can implement edit functionality here
 // For example, open a modal with the project data
 console.log("Edit project:", project);
 };

 const handleDelete = (projectId) => {
 if (window.confirm("Are you sure you want to delete this project?")) {
 onDelete(projectId);
 }
 };

 // Function to decide color based on completion
 const getProgressColor = (percentage) => {
 if (percentage < 40) return "#f44336"; // red
 if (percentage < 70) return "#ff9800"; // orange
 return "#4caf50"; // green
 };

 const projectColumns = [
 {
 key: "id",
 label: "ID",
 render: (val) => <span className="whitespace-nowrap">{val}</span>
 },
 {
 key: "name",
 label: "Project Name",
 render: (val, project) => (
 <div className="whitespace-nowrap relative group">
 <span>{val}</span>
 <button
 onClick={() => console.log("View project:", project)}
 className="absolute right-0 top-1/2 -translate-y-1/2 bg-amber-200 text-amber-700 px-3 py-1 rounded hover:bg-amber-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
 >
 View Project
 </button>
 </div>
 )
 },
 {
 key: "ProjectOwner",
 label: "Project Owner",
 render: (val) => <span className="whitespace-nowrap">{val || "N/A"}</span>
 },
 {
 key: "NoOfUser",
 label: "No.Of User",
 render: (val) => <span className="whitespace-nowrap">{val}</span>
 },
 {
 key: "Status",
 label: "Status",
 render: (val) => (
 <span
 className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
 val === "Active"
 ? "bg-green-100 text-green-800"
 : val === "Completed"
 ? "bg-amber-100 text-amber-800"
 : "bg-app text-main"
 }`}
 >
 {val}
 </span>
 )
 },
 {
 key: "StartDate",
 label: "Start Date",
 render: (val) => <span className="whitespace-nowrap">{new Date(val).toLocaleDateString()}</span>
 },
 {
 key: "EndDate",
 label: "End Date",
 render: (val) => <span className="whitespace-nowrap">{new Date(val).toLocaleDateString()}</span>
 },
 {
 key: "completion",
 label: "Progress",
 render: (val) => (
 <div className="whitespace-nowrap w-32">
 <div
 style={{
 background: "#e0e0e0",
 borderRadius: "10px",
 height: "20px",
 width: "100%",
 overflow: "hidden",
 }}
 >
 <div
 style={{
 height: "100%",
 width: `${val}%`,
 background: getProgressColor(val),
 textAlign: "center",
 color: "white",
 fontSize: "12px",
 lineHeight: "20px",
 transition: "width 0.3s ease-in-out",
 }}
 >
 {val}%
 </div>
 </div>
 </div>
 )
 }
 ];

 return (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-4 w-full overflow-hidden">
 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
 <SearchBar />
 <button
 onClick={openModal}
 className="flex items-center gap-2 w-full sm:w-auto justify-center btn btn-primary"
 >
 <FaPlus /> New Project
 </button>
 </div>

 <TableWithPagination
 columns={projectColumns}
 data={projects}
 loading={loading}
 emptyMessage="No projects found"
 />
 </div>
 );
};

export default ProjectsTable;
