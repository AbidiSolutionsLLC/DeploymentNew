import React from "react";
import TableWithPagination from "./TableWithPagination";

const ProjectTasksTable = ({ tasks, children }) => {
 const taskColumns = [
 { key: "name", label: "Task Name", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "description", label: "Description", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "startDate", label: "Start Date", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "endDate", label: "End Date", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "assignedBy", label: "Assigned By", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "assignedTo", label: "Assigned To", render: (_, task) => <span className="whitespace-nowrap">{task.assignedBy}</span> }, // Kept identical to old behavior
 { key: "priority", label: "Priority", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "status", label: "Status", render: (val) => <span className="whitespace-nowrap">{val}</span> }
 ];

 return (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-4 w-full overflow-hidden">
 {children}
 <TableWithPagination
 columns={taskColumns}
 data={tasks}
 emptyMessage="No tasks found"
 />
 </div>
 );
};

export default ProjectTasksTable;
