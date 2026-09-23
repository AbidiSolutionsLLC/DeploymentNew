import React from "react";
import { FaPlus } from "react-icons/fa";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const TabNavigation = ({ 
 activeTab, 
 setActiveTab, 
 searchQuery, 
 setSearchQuery, 
 onAddTask 
}) => {

 const tabs = [
 { id: 'board', label: 'Board' },
 { id: 'list', label: 'List View' },
 { id: 'comments', label: 'Comments' }
 ];

 return (
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
 {/* Tab Navigation */}
 <div 
 className="flex space-x-1 rounded-lg p-1 w-full sm:w-auto overflow-x-auto bg-background"
 >
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
 activeTab === tab.id ? 'shadow-sm bg-surface text-heading' : 'text-muted hover:text-heading'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 
 {/* Actions */}
 <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
 <div className="flex-1 sm:flex-initial relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <MagnifyingGlassIcon 
 className="w-4 h-4 text-muted"
 />
 </div>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search tasks..."
 className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border-subtle focus:ring-2 focus:ring-brand focus:border-transparent transition-all bg-surface text-heading placeholder-gray-400"
 />
 </div>
 <button
 onClick={onAddTask}
 className="btn btn-primary flex items-center justify-center gap-2"
 >
 <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
 Add Task
 </button>
 </div>
 </div>
 );
};

export default TabNavigation;
