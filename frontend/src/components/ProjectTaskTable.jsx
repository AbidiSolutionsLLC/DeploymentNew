import React from "react";
import GlobalTable from "./ui/GlobalTable";
import {
  TableDate,
  TablePriority,
  TableStatus,
  TableText,
  TableTitle,
} from "./ui/TableCells";

const ProjectTasksTable = ({ tasks, children }) => {
 const taskColumns = [
 { key: "name", label: "Task Name", render: (val) => <TableTitle title={val} maxWidth="max-w-[200px]" /> },
 { key: "description", label: "Description", render: (val) => <TableText value={val} muted truncate maxWidth="max-w-[220px]" /> },
 { key: "startDate", label: "Start Date", render: (val) => <TableDate value={val} mode="short" tone="muted" /> },
 { key: "endDate", label: "End Date", render: (val) => <TableDate value={val} mode="short" tone="muted" /> },
 { key: "assignedBy", label: "Assigned By", render: (val) => <TableText value={val} /> },
 { key: "assignedTo", label: "Assigned To", render: (_, task) => <TableText value={task.assignedBy} /> },
 { key: "priority", label: "Priority", render: (val) => <TablePriority value={val} /> },
 { key: "status", label: "Status", render: (val) => <TableStatus value={val} /> }
 ];

 return (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-4 w-full overflow-hidden">
 {children}
 <GlobalTable
 columns={taskColumns}
 data={tasks}
 emptyMessage="No tasks found"
 defaultSort={{ key: "startDate", direction: "desc" }}
 />
 </div>
 );
};

export default ProjectTasksTable;
