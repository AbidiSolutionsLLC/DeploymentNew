import React from "react";
import { FaClipboardList } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext"; // Keep this import
import KanbanBoard from "./KanbanBoard";

const MyTaskView = ({ tasks, onDragEnd }) => { // Changed component name
  const { selectedTheme } = useTheme(); // Keep this import, though colors are now via CSS vars

  // Filter tasks assigned to current user (you'll need to implement user context)
  const myTasks = tasks.filter(task => {
    // Replace with actual user ID check
    return task.assignee?.id === 1; // Assuming current user ID is 1
  });

  if (myTasks.length === 0) {
    return (
      <div 
        className="rounded-lg p-8 text-center bg-secondary"
      >
        <div className="max-w-md mx-auto">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-background"
          >
            <FaClipboardList 
              className="w-8 h-8 text-description"
            />
          </div>
          <h3 
            className="text-lg font-medium mb-2 text-heading"
          >
            No tasks assigned
          </h3>
          <p 
            className="text-sm text-description"
          >
            You don't have any tasks assigned to you in this project yet.
          </p>
        </div>
      </div>
    );
  }

  return <KanbanBoard tasks={myTasks} onDragEnd={onDragEnd} />;
};

export default MyTaskView; // Changed export name
