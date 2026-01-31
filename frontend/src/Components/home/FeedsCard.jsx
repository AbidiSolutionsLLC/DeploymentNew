// src/Components/home/FeedsCard.jsx
import React from "react";
import { FiActivity } from "react-icons/fi";

const feedsData = [
  { message: "Your request was approved from admin", actionType: "status" },
  { message: "Your log request was approved by project manager" },
  { message: "You have a message", description: "Hi, Paul, our new project...", actionType: "checkin" },
  { message: "You have not checked in yet." },
];

const FeedsCard = ({ onDelete }) => {
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

        <button
          onClick={onDelete}
          className="text-[9px] text-slate-400 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          Remove
        </button>
      </div>

      {/* Feed list */}
      <ul className="space-y-1.5 flex-1 overflow-y-auto pr-1">
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
    </div>
  );
};

export default FeedsCard;