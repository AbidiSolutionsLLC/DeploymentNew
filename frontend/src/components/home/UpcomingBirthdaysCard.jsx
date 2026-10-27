import React, { useRef, useState, useEffect } from "react";
import { FiGift } from "react-icons/fi";
import api from "../../axios";
import { toast } from "react-toastify";
import EmptyCardState from "./EmptyCardState";
import Loader from "../ui/Loader";
import HomeCardShell from "./HomeCardShell";
import { getInitials } from "../../utils/tableUtils";

const UpcomingBirthdaysCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await api.get("/users/birthdays/upcoming");
        setBirthdays(response.data);
      } catch (error) {
        console.error("Failed to fetch birthdays:", error);
        toast.error("Failed to load birthday data");
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
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

  return (
    <HomeCardShell
      title="Upcoming Birthdays"
      sub="Celebrate your team!"
      icon={FiGift}
      accent="#EC4899"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      {loading ? (
        <Loader size="md" />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar max-h-[150px] w-full">
          {birthdays.length > 0 ? (
            <ul className="space-y-1.5 text-[10px]">
              {birthdays.slice(0, 6).map((b, index) => (
                <li
                  key={index}
                  className="bg-app rounded-lg p-2 flex items-center gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {getInitials(b.name) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-main truncate">{b.name || "Unknown"}</div>
                    <div className="text-[9px] text-muted truncate">
                      {b.date || "Date unknown"}
                    </div>
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

export default UpcomingBirthdaysCard;
