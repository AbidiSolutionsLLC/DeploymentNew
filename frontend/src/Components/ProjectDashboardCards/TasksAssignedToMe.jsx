import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiClipboard } from "react-icons/fi";

const assignedTasks = [
  {
    title: "Prepare project update deck",
    status: "In Progress",
    action: "Open Task",
  },
  {
    title: "Finalize team onboarding",
    status: "Pending",
  },
  {
    title: "Submit time log for April",
    status: "Completed",
    action: "Review",
  },
];

const TasksAssignedToMeCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative bg-background rounded-xl shadow-md p-5 pt-10 overflow-visible">
      {/* Icon top left */}
      <div className="absolute -top-4 left-4 bg-purple-200 text-purple-800 w-10 h-10 flex items-center justify-center rounded-md shadow z-99">
        <FiClipboard className="text-xl" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg text-text font-semibold">Tasks Assigned to Me</h2>
          <p className="text-cardDescription text-sm font-medium">
            Active and pending tasks
          </p>
        </div>

        
      </div>

      {/* Task list */}
      <ul className="space-y-2 text-sm">
        {assignedTasks.map((item, index) => (
          <li
            key={index}
            style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.3)" }}
            className="bg-primary rounded px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <span className="font-medium text-text">{item.title}</span>
              <div className="text-description text-sm">Status: {item.status}</div>
            </div>

            {item.action && (
              <button className="text-xs px-3 py-1 rounded font-medium shrink-0 bg-purple-100 text-purple-700">
                {item.action}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksAssignedToMeCard;
