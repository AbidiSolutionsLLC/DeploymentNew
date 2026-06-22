import React from "react";

const FileTabs = ({ activeTab, setActiveTab }) => {
 return (
 <div className="flex space-x-2 bg-surface rounded-lg overflow-hidden mb-4 w-fit">
 <button
 onClick={() => setActiveTab("sharedWithMe")}
 className={`px-4 py-2 text-sm font-medium ${
 activeTab === "sharedWithMe"
 ? "bg-secondary text-heading"
 : "bg-app text-main"
 }`}
 >
 Shared with me
 </button>

 <button
 onClick={() => setActiveTab("SharedWithRole")}
 className={`px-4 py-2 text-sm font-medium ml-0 ${
 activeTab === "SharedWithRole"
 ? "bg-secondary text-heading"
 : "bg-app text-main"
 }`}
 >
 Shared with My Role
 </button>
 </div>
 );
};

export default FileTabs;