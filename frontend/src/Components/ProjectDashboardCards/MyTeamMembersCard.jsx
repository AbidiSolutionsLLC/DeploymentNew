// Components/MyTeamMembersCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiUsers } from "react-icons/fi";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "UI/UX Designer",
    email: "sarah.johnson@example.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Michael Smith",
    role: "Frontend Developer",
    email: "michael.smith@example.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Emma Brown",
    role: "Backend Developer",
    email: "emma.brown@example.com",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "David Wilson",
    role: "QA Engineer",
    email: "david.wilson@example.com",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
];

export default function MyTeamMembersCard() {
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
    <div className="relative bg-background rounded-xl shadow-md p-5 pt-10 overflow-visible ">
      {/* Icon top left */}
      <div className="absolute -top-4 left-4 bg-blue-200 text-blue-800 w-10 h-10 flex items-center justify-center rounded-md shadow z-99">
        <FiUsers className="text-xl" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg text-text font-semibold">My Team Members</h2>
          <p className="text-cardDescription text-sm font-medium">
            People you are working with
          </p>
        </div>

          <div className="flex items-start gap-2">
          <button className="flex items-center text-blue-600 text-sm hover:underline">
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
          </div>
      </div>

      {/* Team list */}
      <ul className="space-y-3 overflow-y-auto max-h-64 pr-2">
        {teamMembers.map((member, index) => (
          <li
            key={index}
            style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.3)" }}
            className="bg-primary rounded px-4 py-3 flex items-center gap-3"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div className="min-w-0">
              <span className="font-medium text-text block truncate">
                {member.name}
              </span>
              <div className="text-description text-sm truncate">
                {member.role}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
