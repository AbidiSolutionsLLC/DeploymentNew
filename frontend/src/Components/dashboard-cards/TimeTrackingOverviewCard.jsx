// Components/TimeTrackingOverviewCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiClock } from "react-icons/fi";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const timeData = {
  totalHours: 32,
  targetHours: 40,
  dailyBreakdown: [
    { day: "Mon", hours: 8 },
    { day: "Tue", hours: 6 },
    { day: "Wed", hours: 7 },
    { day: "Thu", hours: 5 },
    { day: "Fri", hours: 6 },
  ],
};

export default function TimeTrackingOverviewCard() {
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

  const percentage = Math.round((timeData.totalHours / timeData.targetHours) * 100);

  return (
    <div className="relative bg-background rounded-xl shadow-md p-5 pt-10 overflow-visible">
      {/* Icon top left */}
      <div className="absolute -top-4 left-4 bg-green-200 text-green-800 w-10 h-10 flex items-center justify-center rounded-md shadow z-10">
        <FiClock className="text-xl" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg text-text font-semibold">Time Tracking Overview</h2>
          <p className="text-cardDescription text-sm font-medium">
            Your logged hours vs weekly target
          </p>
        </div>

        {/* Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <FiMoreVertical className="h-5 w-5 text-gray-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md border rounded-md z-50">
              <button
                onClick={() => alert("Feature coming soon!")}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Reports
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress + Daily Breakdown */}
      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="w-20 h-20">
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              pathColor: "#16a34a",
              textColor: "#16a34a",
              trailColor: "#e5e7eb",
            })}
          />
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Total Hours</span>
            <span>{timeData.totalHours}h / {timeData.targetHours}h</span>
          </div>

          {/* Mini Bar Chart */}
          <div className="flex gap-2 items-end h-16">
            {timeData.dailyBreakdown.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                  className="bg-green-500 rounded-t"
                  style={{
                    height: `${(day.hours / 10) * 100}%`,
                    width: "100%",
                  }}
                ></div>
                <span className="text-xs mt-1">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action */}
      <button className="mt-4 w-full py-2 text-sm font-medium bg-green-100 text-green-800 rounded hover:bg-green-200 transition">
        Log Time
      </button>
    </div>
  );
}
