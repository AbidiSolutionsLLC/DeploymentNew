// src/Components/home/LeaveLogCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { FaUmbrellaBeach as BeachIcon } from "react-icons/fa";
import api from "../../axios";

const LeaveLogCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveLogs, setLeaveLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchLeaveLogs = async () => {
      try {
        const response = await api.get("/leaves");
        const formattedData = response.data.data
          .map((item) => ({
            name: item.employeeName,
            date: new Date(item.startDate).toLocaleDateString(),
            type: item.leaveType,
            status: item.status || "Pending",
          }))
          .slice(0, 3);
        setLeaveLogs(formattedData);
      } catch (error) {
        console.error("Failed to fetch leave logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveLogs();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-3 h-full w-full">
         <div className="flex items-center gap-2 mb-2">
            <BeachIcon className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Leave Logs</h3>
         </div>
         <p className="text-[10px] text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    // CHANGED: p-4 -> p-3
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-3 w-full h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BeachIcon className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Leave Logs</h3>
          </div>
          <p className="text-[9px] font-medium text-slate-500">Track your leave history</p>
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

      <ul className="space-y-2 flex-1 overflow-y-auto pr-1">
        {leaveLogs.length > 0 ? (
          leaveLogs.map((log, index) => (
            <li
              key={index}
              className="bg-[#E0E5EA]/30 rounded-lg p-2.5 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-[10px] text-slate-700">{log.name}</span>
                <span className="text-[9px] text-slate-500">{log.date}</span>
              </div>
              <div className="flex flex-col text-right text-[9px]">
                <span className="font-medium text-slate-700">{log.type}</span>
                <span className={`font-medium ${
                    log.status === "Approved" ? "text-green-600" : 
                    log.status === "Rejected" ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            </li>
          ))
        ) : (
          <li className="p-3 text-center text-[10px] text-slate-500">
            No leave records found
          </li>
        )}
      </ul>
    </div>
  );
};

export default LeaveLogCard;