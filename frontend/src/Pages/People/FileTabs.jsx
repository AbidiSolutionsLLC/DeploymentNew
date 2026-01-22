import React from "react";

const FileTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-2 bg-white rounded-lg overflow-hidden mb-4 w-fit">
      <button
        onClick={() => setActiveTab("sharedWithMe")}
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === "sharedWithMe"
            ? "bg-secondary text-heading"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        Shared with me
      </button>

      <button
        onClick={() => setActiveTab("sharedWithRole")}
        className={`px-4 py-2 text-sm font-medium ml-0 ${
          activeTab === "sharedWithRole"
            ? "bg-secondary text-heading"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        Shared with My Role
      </button>
    </div>
  );
};

export default FileTabs;