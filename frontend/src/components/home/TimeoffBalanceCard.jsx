// ========== TimeoffBalanceCard.jsx ==========
import React, { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import api from "../../axios";
import EmptyCardState from "./EmptyCardState";
import Loader from "../ui/Loader";
import HomeCardShell from "./HomeCardShell";

const TimeoffBalanceCard = ({ onDelete, userId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeOffData, setTimeOffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/users/${userId}/leaves`);
        const leaves = response.data?.data || response.data || {};

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

        if (leaves.majlis != null) {
          items.push({
            type: "Majlis Leave",
            remaining: `${leaves.majlis} days`,
          });
        }

        if (leaves.avalaibleLeaves != null) {
          items.push({
            type: "Total Available",
            remaining: `${leaves.avalaibleLeaves} days`,
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
  }, [userId]);

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
