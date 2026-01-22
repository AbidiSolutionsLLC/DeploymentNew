import React, { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const cardOptions = [
  { id: "feeds", label: "Feeds" },
  { id: "attendance", label: "Attendance" },
  { id: "holidays", label: "Holidays" },
  { id: "todo", label: "To-Do" },
  { id: "notes", label: "Notes"},
  { id: "recent activities", label: "Recent activities"},
  { id: "birthdays", label: "Birthdays"},
  { id: "leavelog", label: "Leave Logs"},
  { id: "upcomingDeadlines", label: "Deadlines"},
  { id: "timeoffBalance", label: "Time Off"},
  { id: "tasksAssignedToMe", label: "My Tasks"},
];

const AddCardMenu = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-white/50 hover:bg-white transition-all shadow-sm text-xs font-bold text-slate-700 uppercase tracking-wide"
      >
        More
        <EllipsisVerticalIcon className="h-4 w-4 text-slate-600" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 z-50 py-1">
          <ul className="text-xs text-slate-700">
            {cardOptions.map((option) => (
              <li
                key={option.id}
                onClick={() => {
                  onAdd(option.id);
                  setOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-[#E0E5EA]/50 transition font-medium uppercase tracking-tight"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddCardMenu;