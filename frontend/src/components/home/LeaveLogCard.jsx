// src/Components/home/LeaveLogCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaUmbrellaBeach as BeachIcon } from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../../axios";
import EmptyCardState from "./EmptyCardState";
import Loader from "../ui/Loader";
import { formatDisplayDate } from "../../utils/dateUtils";
import HomeCardShell from "./HomeCardShell";

const LeaveLogCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveLogs, setLeaveLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user?._id;

  useEffect(() => {
    const fetchLeaveLogs = async () => {
      try {
        const response = await api.get("/leaves", { params: { my: true, limit: 10 } });
        const allLeaves = response.data || [];

        const userLeaves = allLeaves
          .map((item) => ({
            name: item.employeeName,
            date: formatDisplayDate(item.startDate, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            type: item.leaveType,
            status: item.status || "Pending",
          }))
          .slice(0, 6);

        setLeaveLogs(userLeaves);
      } catch (error) {
        console.error("Failed to fetch leave logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveLogs();

    const interval = setInterval(fetchLeaveLogs, 30000);
    window.addEventListener("focus", fetchLeaveLogs);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchLeaveLogs);
    };
  }, [userId]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <HomeCardShell
      title="Leave Logs"
      sub="Track your leave history"
      icon={BeachIcon}
      accent="#8B5CF6"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      {loading ? (
        <Loader size="sm" />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 max-h-[150px] custom-scrollbar">
          {leaveLogs.length > 0 ? (
            <ul className="space-y-2">
              {leaveLogs.map((log, index) => (
                <li
                  key={index}
                  className="bg-app rounded-lg p-2 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-[10px] text-main">{log.name}</span>
                    <span className="text-[9px] text-muted">{log.date}</span>
                  </div>
                  <div className="flex flex-col text-right text-[9px]">
                    <span className="font-medium text-main">{log.type}</span>
                    <span
                      className={`font-medium ${
                        log.status === "Approved"
                          ? "text-success"
                          : log.status === "Rejected"
                          ? "text-danger"
                          : "text-warning"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCardState message="You haven't added anything yet" />
          )}
        </div>
      )}
    </HomeCardShell>
  );
};

export default LeaveLogCard;
