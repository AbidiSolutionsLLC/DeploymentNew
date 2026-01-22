import React from "react";
import { FaPlus } from "react-icons/fa";
import SearchBar from "./SearchBar";

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

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <SearchBar />
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110 w-full sm:w-auto justify-center"
        >
          <FaPlus /> New Project
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-gray-100">
            <tr>
              {[
                "ID",
                "Project Name",
                "Project Owner",
                "No.Of User",
                "Status",
                "Start Date",
                "End Date",
                "Progress",
              ].map((header, index) => (
                <th
                  key={index}
                  className={`p-3 font-medium text-gray-700 border-r whitespace-nowrap last:border-none border-gray-300`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="border-b">
                  {[...Array(8)].map((__, colIndex) => (
                    <td key={colIndex} className="p-3">
                      <div className="h-4 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-200">
                  <td className="p-3 whitespace-nowrap">{project.id}</td>
                  <td className="p-3 whitespace-nowrap relative group">
                    <span>{project.name}</span>

                    {/* Hover button */}
                    <button
                      onClick={() => console.log("View project:", project)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-200 text-blue-700 px-3 py-1 rounded hover:bg-blue-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      View Project
                    </button>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {project.ProjectOwner || "N/A"}
                  </td>
                  <td className="p-3 whitespace-nowrap">{project.NoOfUser}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        project.Status === "Active"
                          ? "bg-green-100 text-green-800"
                          : project.Status === "Completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.Status}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(project.StartDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(project.EndDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
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
                          width: `${project.completion}%`,
                          background: getProgressColor(project.completion),
                          textAlign: "center",
                          color: "white",
                          fontSize: "12px",
                          lineHeight: "20px",
                          transition: "width 0.3s ease-in-out",
                        }}
                      >
                        {project.completion}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-3 text-center text-gray-500">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsTable;
