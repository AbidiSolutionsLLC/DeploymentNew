// ========== TimeoffBalanceCard.jsx ==========
import React, { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import leavesApi from "../../api/leavesApi";
import EmptyCardState from "./EmptyCardState";
import Loader from "../ui/Loader";
import HomeCardShell from "./HomeCardShell";

const TimeoffBalanceCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeOffData, setTimeOffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const data = await leavesApi.getLeaveBalance();
        const leaves = data?.leaves || {};

        const items = [
          {
            type: "Paid Time Off (PTO)",
            remaining: `${leaves.pto ?? 0} days`,
          },
          {
            type: "Sick Leave",
            remaining: `${leaves.sick ?? 0} days`,
          },
        ];

        if (data?.bookedLeaves != null) {
          items.push({
            type: "Booked Leaves",
            remaining: `${data.bookedLeaves} days`,
          });
        }

        if (data?.avalaibleLeaves != null) {
          items.push({
            type: "Total Available",
            remaining: `${data.avalaibleLeaves} days`,
          });
        }

        setTimeOffData(items);
      } catch (error) {
        console.error("Error fetching leaves:", error);
        setTimeOffData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

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
    <HomeCardShell
      title="Available Leaves"
      sub="Updated leave availability"
      icon={FiCalendar}
      accent="#14B8A6"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      {loading ? (
        <Loader size="sm" />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar max-h-[150px] w-full">
          {timeOffData.length > 0 ? (
            <ul className="space-y-1.5 text-[10px]">
              {timeOffData.map((item, index) => (
                <li
                  key={index}
                  className="bg-app rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-main">{item.type}</span>
                    <div className="text-[9px] text-muted">{item.remaining}</div>
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

export default TimeoffBalanceCard;
