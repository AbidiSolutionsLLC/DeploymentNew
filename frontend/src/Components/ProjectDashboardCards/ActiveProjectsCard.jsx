import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { FiFolder } from "react-icons/fi";

const ActiveProjectsCard = () => {
  const projects = [
    {
      name: "Website Redesign",
      dueDate: "Sep 15, 2025",
      progress: 75,
    },
    {
      name: "Mobile App Launch",
      dueDate: "Oct 1, 2025",
      progress: 50,
    },
    {
      name: "Marketing Campaign",
      dueDate: "Aug 20, 2025",
      progress: 90,
    },
  ];

  return (
    <div className="relative bg-background rounded-xl shadow-md p-5 pt-10 overflow-visible">
      {/* Icon top left */}
      <div className="absolute -top-4 left-4 bg-blue-200 text-blue-800 w-10 h-10 flex items-center justify-center rounded-md shadow z-99">
        <FiFolder className="text-xl" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg text-text font-semibold">Active Projects</h2>
          <p className="text-cardDescription text-sm font-medium">
            Ongoing projects and their current status
          </p>
        </div>
        <button className="flex items-center text-blue-600 text-sm hover:underline transition-colors duration-200 whitespace-nowrap">
          View All
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Project List */}
      <ul className="space-y-4 text-sm">
        {projects.map((project, index) => (
          <li
            key={index}
            style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.3)" }}
            className="bg-primary rounded px-4 py-2 flex flex-col gap-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-text">{project.name}</span>
              <span className="text-sm text-gray-400">{project.dueDate}</span>
            </div>
            <div className="w-full bg-white rounded-full h-4 relative">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              ></div>
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-text font-medium">
                {project.progress}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveProjectsCard;
