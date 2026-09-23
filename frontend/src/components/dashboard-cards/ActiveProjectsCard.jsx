import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { FiFolder } from "react-icons/fi";

const ActiveProjectsCard = ({ projects = [] }) => {

 return (
 <div className="bg-surface border border-border-subtle rounded-xl shadow-sm p-5 flex flex-col h-full w-full">
 {/* Icon top left */}
 

 {/* Header */}
 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-lg text-heading font-semibold">Active Projects</h2>
 <p className="text-muted text-sm font-medium">
 Ongoing projects and their current status
 </p>
 </div>
 <button className="btn-ghost flex items-center">
 View All
 <ArrowRightIcon className="h-4 w-4 ml-1" />
 </button>
 </div>

 {/* Project List */}
 {projects.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-muted py-8 flex-1"><p>No active projects found.</p></div>) : (<ul className="space-y-4 text-sm flex-1">{projects.map((project, index) => (<li key={index} className="bg-secondary/50 rounded-lg px-4 py-3 flex flex-col gap-2 border border-border-subtle"><div className="flex justify-between items-center"><span className="font-medium text-heading">{project.title}</span><span className="text-sm text-muted">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</span></div><div className="w-full bg-surface rounded-full h-4 relative border border-border-subtle"><div className="bg-amber-500 h-4 rounded-full transition-all duration-500" style={{ width: `${project.progress || (project.status === 'Completed' ? 100 : project.status === 'Active' ? 50 : 20)}%` }}></div><span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[10px] text-heading font-medium">{project.status || 'Ongoing'}</span></div></li>))}</ul>)}
 </div>
 );
};

export default ActiveProjectsCard;



