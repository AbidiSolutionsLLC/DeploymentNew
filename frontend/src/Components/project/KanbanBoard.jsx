import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // Keep this import
import TaskCard from "./TaskCard";

const KanbanBoard = ({ tasks, onDragEnd, loading }) => {
  const { selectedTheme } = useTheme(); // Keep this import, though colors are now via CSS vars
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);

  const kanbanColumns = [
    { id: 'backlog', title: 'Backlog', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
    { id: 'todo', title: 'To Do', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'in-progress', title: 'In Progress', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { id: 'under-review', title: 'Under Review', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'done', title: 'Done', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
  ];

  const getTasksByStatus = (status) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear draggedOver if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDraggedOver(null);
    
    if (draggedTask && draggedTask.status !== columnId) {
      // Simulate the react-beautiful-dnd result structure
      const result = {
        draggableId: draggedTask.id.toString(),
        destination: {
          droppableId: columnId
        },
        source: {
          droppableId: draggedTask.status
        }
      };
      
      onDragEnd(result);
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOver(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kanbanColumns.map(column => (
          <div 
            key={column.id} 
            className="rounded-lg p-4 animate-pulse bg-secondary"
          >
            <div 
              className="h-6 rounded mb-4 bg-background"
            ></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className="h-20 rounded bg-background"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {kanbanColumns.map(column => (
        <div 
          key={column.id} 
          className={`${column.bgColor} rounded-lg p-3 sm:p-4 border-2 border-dashed ${column.borderColor} ${
            draggedOver === column.id ? 'bg-opacity-70 scale-105 shadow-lg' : ''
          } transition-all duration-200`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="font-semibold text-sm sm:text-base truncate text-heading"
            >
              {column.title}
            </h3>
            <span 
              className="text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 bg-secondary text-text"
            >
              {getTasksByStatus(column.id).length}
            </span>
          </div>
          
          <div className="min-h-[300px] sm:min-h-[400px] transition-all duration-200 rounded-lg">
            {getTasksByStatus(column.id).map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                className={`${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
              >
                <TaskCard 
                  task={task} 
                  isDragging={draggedTask?.id === task.id}
                />
              </div>
            ))}
            
            {getTasksByStatus(column.id).length === 0 && (
              <div 
                className={`flex items-center justify-center h-32 text-sm rounded-lg border-2 border-dashed transition-all duration-200 border-primary/30 text-description ${draggedOver === column.id ? 'border-solid bg-secondary bg-opacity-50' : ''}`}
              >
                {draggedOver === column.id ? 'Drop task here' : 'No tasks'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
