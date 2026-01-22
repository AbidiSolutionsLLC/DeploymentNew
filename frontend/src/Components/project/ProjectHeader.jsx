import React from "react";
import { FaUsers, FaCalendar, FaFlag, FaChartLine } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext"; // Keep this import

const ProjectHeader = ({ project }) => {
  const { selectedTheme } = useTheme(); // Keep this import, though colors are now via CSS vars

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div 
      className="rounded-lg p-4 sm:p-6 mb-6 shadow-sm border border-primary/20 bg-secondary"
    >
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold truncate text-heading"
            >
              {project?.name || 'Project Name'}
            </h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium border whitespace-nowrap ${getStatusColor(project?.status)}`}>
              {project?.status || 'Active'}
            </span>
          </div>
          
          <p 
            className="mb-4 text-sm sm:text-base leading-relaxed text-description"
          >
            {project?.description || 'Project description will appear here. This section provides an overview of the project goals, objectives, and key deliverables.'}
          </p>
          
          {/* Progress Bar */}
          {project?.progress && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-sm font-medium text-text"
                >
                  Progress
                </span>
                <span 
                  className="text-sm font-medium text-text"
                >
                  {project.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300 bg-primary"
                  style={{ width: `${project.progress}%` }} // Width still needs inline style
                ></div>
              </div>
            </div>
          )}
          
          {/* Project Meta */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-description">
            <div className="flex items-center gap-2">
              <FaCalendar 
                className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
              />
              <span>
                Due: {project?.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaFlag 
                className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${getPriorityColor(project?.priority)}`}
              />
              <span>
                Priority: {project?.priority || 'Medium'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers 
                className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
              />
              <span>
                {project?.teamMembers?.length || 4} members
              </span>
            </div>
          </div>
        </div>
        
        {/* Team Members */}
        <div className="xl:w-80 xl:flex-shrink-0">
          <div className="flex items-center gap-2 mb-3 text-description">
            <FaUsers 
              className="w-4 h-4"
            />
            <span 
              className="text-sm font-medium text-text"
            >
              Team Members
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {project?.teamMembers?.length > 0 ? (
              project.teamMembers.map((member, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-background"
                >
                  <img
                    src={member.avatar || "/placeholder.svg"}
                    alt={member.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p 
                      className="text-sm font-medium truncate text-text"
                    >
                      {member.name}
                    </p>
                    <p 
                      className="text-xs truncate text-description"
                    >
                      {member.role}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <img
                      key={i}
                      src={`/diverse-team-meeting.png?height=40&width=40&query=team member ${i}`}
                      alt={`Team member ${i}`}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white flex-shrink-0"
                    />
                  ))}
                </div>
                <span 
                  className="text-sm ml-2 text-description"
                >
                  4 members
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
