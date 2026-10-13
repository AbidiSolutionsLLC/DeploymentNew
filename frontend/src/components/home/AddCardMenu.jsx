import React, { useState, useRef, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import GlassButton from "../../components/ui/GlassButton";

const cardOptions = [
  { id: "feeds", label: "Feeds" },
  { id: "attendance", label: "Attendance" },
  { id: "holidays", label: "Holidays" },
  { id: "todo", label: "To-Do" },
  { id: "notes", label: "Notes" },
  { id: "birthdays", label: "Birthdays" },
  { id: "leavelog", label: "Leave Logs" },
  { id: "timeoffBalance", label: "Time Off" },
];

const AddCardMenu = ({ onAdd, currentCards = [] }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const currentCardTypes = currentCards.map((c) => c.type);

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
      <GlassButton
        variant="primary"
        size="md"
        icon={PlusIcon}
        onClick={() => setOpen(!open)}
        className="uppercase tracking-wider"
      >
        Add Card
      </GlassButton>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-400 py-2 overflow-hidden z-50">
          <p className="px-4 pb-2 pt-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Dashboard cards
          </p>
          <ul className="text-xs text-slate-800 dark:text-slate-200 max-h-64 overflow-y-auto">
            {cardOptions.map((option) => (
              <li
                key={option.id}
                onClick={() => {
                  if (!currentCardTypes.includes(option.id)) {
                    onAdd(option.id);
                    setOpen(false);
                  }
                }}
                className={`px-4 py-2.5 transition font-semibold tracking-tight flex items-center gap-2.5 ${
                  currentCardTypes.includes(option.id)
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    currentCardTypes.includes(option.id)
                      ? "bg-slate-300 dark:bg-slate-600"
                      : "bg-amber-500"
                  }`}
                />
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
