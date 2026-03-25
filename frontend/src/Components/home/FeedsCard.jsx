// src/Components/home/FeedsCard.jsx
import React, { useState, useRef } from "react";
import { FiActivity, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import EmptyCardState from "./EmptyCardState";

const feedsData = [
  { message: "Your request was approved from admin", actionType: "status" },
  { message: "Your log request was approved by project manager" },
  { message: "You have a message", description: "Hi, Paul, our new project...", actionType: "checkin" },
  { message: "You have not checked in yet." },
];

const FeedsCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    // CHANGED: p-4 -> p-3 for tighter spacing
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FiActivity className="w-3.5 h-3.5 text-green-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Feeds</h3>
          </div>
          <p className="text-[9px] font-medium text-slate-500">4+ unread messages</p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <FiMoreVertical className="h-4 w-4 text-slate-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white shadow-lg border border-slate-200 rounded-xl z-50">
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex items-center w-full px-3 py-2 text-[10px] text-red-500 hover:bg-red-50 font-medium"
              >
                <FiTrash2 className="w-3 h-3 mr-2" />
                Delete Card
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto pr-1">
        {feedsData.length > 0 ? (
          <ul className="space-y-1.5">
            {feedsData.map((item, index) => (
              <li
                key={index}
                className="bg-[#E0E5EA]/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-700 truncate block text-[10px]">{item.message}</span>
                  {item.description && (
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">{item.description}</div>
                  )}
                </div>

                {item.actionType && (
                  <button
                    className={`text-[9px] px-2 py-0.5 rounded-md font-medium shrink-0 ${item.actionType === "status" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                  >
                    {item.actionType === "status" ? "View" : "Check-in"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyCardState message="You haven't added anything yet" />
        )}
      </div>
    </div>
  );
};

export default FeedsCard;