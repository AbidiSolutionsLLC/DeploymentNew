import React from "react";
import { FaCalendar, FaComment, FaGripVertical, FaClock } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext"; // Keep this import

const TaskCard = ({ task, isDragging }) => {
  const { selectedTheme } = useTheme(); // Keep this import, though colors are now via CSS vars

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg shadow-sm border border-primary/30 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 mb-3 select-none bg-secondary ${
        isDragging ? 'rotate-2 shadow-lg scale-105 z-50 opacity-80' : ''
      }`}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <FaGripVertical 
            className="mt-1 flex-shrink-0 text-xs opacity-50 text-description cursor-grab"
          />
          <h4 
            className="font-medium text-sm leading-tight break-words text-text"
          >
            {task.title}
          </h4>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getPriorityColor(task.priority)}`}>
          {task.priority || 'Low'}
        </span>
      </div>
      
      {/* Task Description */}
      {task.description && (
        <p 
          className="text-xs mb-3 leading-relaxed line-clamp-2 text-cardDescription"
        >
          {task.description}
        </p>
      )}
      
      {/* Due Date Alert */}
      {isOverdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
          <FaClock className="w-3 h-3" />
          <span>Overdue</span>
        </div>
      )}
      
      {isDueSoon && !isOverdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
          <FaClock className="w-3 h-3" />
          <span>Due Soon</span>
        </div>
      )}
      
      {/* Task Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <img
                src={task.assignee.avatar || "/placeholder.svg"}
                alt={task.assignee.name}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
              />
              <span 
                className="text-xs truncate max-w-[60px] sm:max-w-[80px] text-description"
              >
                {task.assignee.name}
              </span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center">
              <FaCalendar 
                className="w-3 h-3 mr-1 flex-shrink-0 text-description"
              />
              <span 
                className="text-xs whitespace-nowrap text-description"
              >
                {new Date(task.dueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          )}
        </div>
        
        {task.commentsCount > 0 && (
          <div className="flex items-center">
            <FaComment 
              className="w-3 h-3 mr-1 text-description"
            />
            <span 
              className="text-xs text-description"
            >
              {task.commentsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
