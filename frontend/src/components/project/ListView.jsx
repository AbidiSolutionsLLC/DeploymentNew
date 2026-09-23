import React from "react";

const ListView = ({ tasks, onTaskClick }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "low": return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "todo": return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300";
      case "in progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "in review": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "testing": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "done": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-app text-main";
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-white/20 dark:border-white/10 shadow-sm min-h-[300px]">
        <p className="text-muted">No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-white/20 dark:border-white/10 overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-app border-b border-white/20 dark:border-white/10 text-muted">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Task</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Assignees</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Due Date</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/10 bg-surface">
            {tasks.map(task => (
              <tr 
                key={task._id || task.id} 
                className="hover:bg-app transition-colors cursor-pointer group"
                onClick={() => onTaskClick && onTaskClick(task)}
              >
                <td className="px-6 py-4 font-medium text-main flex items-center gap-2">
                  <span className="text-xs text-muted font-mono">{task.taskID || "TSK"}</span>
                  <span className="group-hover:text-brand transition-colors">{task.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status || "To Do"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {task.team && task.team.length > 0 ? (
                      task.team.slice(0, 3).map((user, idx) => (
                        <img 
                          key={idx} 
                          className="w-7 h-7 rounded-full border-2 border-surface object-cover" 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || "User"}&background=random`} 
                          title={user.name}
                          alt="Avatar" 
                        />
                      ))
                    ) : (
                      <span className="text-muted text-xs">Unassigned</span>
                    )}
                    {task.team && task.team.length > 3 && (
                      <div className="w-7 h-7 rounded-full border-2 border-surface bg-app flex items-center justify-center text-[10px] font-medium text-muted">
                        +{task.team.length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-muted">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No date"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority || "Medium"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
