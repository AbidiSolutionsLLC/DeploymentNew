import React from "react";
import GlobalTable from "../ui/GlobalTable";
import {
  TableDate,
  TablePriority,
  TableStatus,
  TableTitle,
} from "../ui/TableCells";

const ListView = ({ tasks, onTaskClick }) => {
  const columns = [
    {
      key: "title",
      label: "Task",
      render: (_, task) => (
        <TableTitle title={task.title} subtitle={task.taskID || "TSK"} maxWidth="max-w-[240px]" />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <TableStatus value={value || "To Do"} />,
    },
    {
      key: "team",
      label: "Assignees",
      sortable: false,
      render: (_, task) => (
        <span className="flex -space-x-2">
          {task.team && task.team.length > 0 ? (
            task.team.slice(0, 3).map((user, idx) => (
              <img
                key={idx}
                className="w-7 h-7 rounded-full border-2 border-surface object-cover"
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name || "User"}&background=random`
                }
                title={user.name}
                alt="Avatar"
              />
            ))
          ) : (
            <span className="text-muted text-xs">Unassigned</span>
          )}
          {task.team && task.team.length > 3 && (
            <span className="w-7 h-7 rounded-full border-2 border-surface bg-app flex items-center justify-center text-[10px] font-medium text-muted">
              +{task.team.length - 3}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (value) => <TableDate value={value} tone="muted" fallback="No date" />,
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => <TablePriority value={value || "Medium"} />,
    },
  ];

  return (
    <GlobalTable
      columns={columns}
      data={tasks || []}
      emptyMessage="No tasks found"
      emptyHint="Tasks added to this project will appear here."
      onRowClick={onTaskClick}
      defaultSort={{ key: "dueDate", direction: "asc" }}
      countLabel="tasks"
    />
  );
};

export default ListView;
