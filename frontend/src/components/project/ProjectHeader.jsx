import React from "react";
import { FaUsers, FaCalendar, FaFlag } from "react-icons/fa";
import { TableAvatar } from "../ui/TableCells";

const ProjectHeader = ({ project }) => {
 const getStatusColor = (status) => {
   switch (status?.toLowerCase()) {
   case 'active':
   case 'in progress':
     return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50';
   case 'on-hold':
   case 'on hold':
     return 'bg-yellow-100 text-yellow-800 border-yellow-200';
   case 'completed':
     return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
   default:
     return 'bg-app text-main border-border-subtle';
   }
 };

 const getPriorityColor = (priority) => {
   switch (priority?.toLowerCase()) {
   case 'high':
     return 'text-red-600 dark:text-red-400';
   case 'medium':
     return 'text-yellow-600';
   case 'low':
     return 'text-green-600 dark:text-green-400';
   default:
     return 'text-muted';
   }
 };

 const progress = (() => {
    const statusProgressMap = { 'Completed': 100, 'Active': 50, 'In Progress': 50, 'On Hold': 30, 'Planning': 15 };
    return project?.completionPercent || statusProgressMap[project?.status] || 0;
 })();


 return (
 <div className="rounded-lg p-4 sm:p-6 mb-6 shadow-sm border border-primary/20 bg-secondary">
 <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
 {/* Project Info */}
 <div className="flex-1 min-w-0">
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
 <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate text-heading">
 {project?.title || project?.name || 'Project Name'}
 </h1>
 <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium border whitespace-nowrap ${getStatusColor(project?.status)}`}>
 {project?.status || 'Planning'}
 </span>
 </div>
 
 <p className="mb-4 text-sm sm:text-base leading-relaxed text-description">
 {project?.description || 'No description provided for this project.'}
 </p>
 
 {/* Progress Bar */}
 <div className="mb-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium text-text">
 Progress
 </span>
 <span className="text-sm font-medium text-text">
 {progress}%
 </span>
 </div>
  <div className="w-full bg-border-subtle rounded-full h-2.5 overflow-hidden">
  <div 
  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 transition-all duration-500"
  style={{ width: `${progress}%` }}
  ></div>
  </div>
 </div>
 
 {/* Project Meta */}
 <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-description">
 <div className="flex items-center gap-2">
 <FaCalendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
 <span>
 Due: {project?.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <FaFlag className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${getPriorityColor(project?.priority)}`} />
 <span>
 Priority: {project?.priority || 'Medium'}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
 <span>
 {project?.teamMembers?.length || project?.team?.length || 0} members
 </span>
 </div>
 </div>
 </div>
 
 {/* Team Members */}
 <div className="xl:w-80 xl:flex-shrink-0">
 <div className="flex items-center gap-2 mb-3 text-description">
 <FaUsers className="w-4 h-4" />
 <span className="text-sm font-medium text-text">
 Team Members
 </span>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
 {(project?.teamMembers || project?.team || []).length > 0 ? (
 (project.teamMembers || project.team).map((member, index) => (
 <div 
 key={index} 
 className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-background"
 >
 <TableAvatar
 name={member.name || member.firstName}
 src={member.avatar || member.profileImage}
 size="lg"
 />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium truncate text-text">
 {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email}
 </p>
 <p className="text-xs truncate text-description">
 {member.role || 'Member'}
 </p>
 </div>
 </div>
 ))
 ) : (
 <div className="flex items-center gap-3">
 <span className="text-sm ml-2 text-description">
 No team members assigned yet.
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
