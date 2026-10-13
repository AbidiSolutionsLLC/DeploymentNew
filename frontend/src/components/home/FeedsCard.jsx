// src/Components/home/FeedsCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiActivity } from "react-icons/fi";
import api from "../../axios";
import { toast } from "react-toastify";
import EmptyCardState from "./EmptyCardState";
import Loader from "../ui/Loader";
import HomeCardShell from "./HomeCardShell";

function timeAgo(dateStr) {
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return "";
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

const FeedsCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const response = await api.get("/notifications", { params: { limit: 6 } });
        const notifications = response.data || [];
        setFeeds(
          notifications.map((n) => ({
            id: n._id,
            message: n.title,
            description: n.message && n.message !== n.title ? n.message : undefined,
            time: timeAgo(n.createdAt),
          }))
        );
      } catch (error) {
        console.error("Failed to fetch feeds:", error);
        toast.error("Failed to load feeds");
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  return (
    <HomeCardShell
      title="Feeds"
      sub="Recent updates for you"
      icon={FiActivity}
      accent="#0EA5E9"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      {loading ? (
        <Loader size="sm" />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar max-h-[160px]">
          {feeds.length > 0 ? (
            <ul className="space-y-1.5">
              {feeds.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 bg-app"
                >
                  <span className="mt-1 h-2 w-2 rounded-full shrink-0 bg-sky-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium text-main leading-snug break-words">
                      {item.message}
                    </div>
                    {item.description && (
                      <div className="text-[9px] text-muted mt-0.5 leading-snug break-words">
                        {item.description}
                      </div>
                    )}
                    <div className="text-[9px] text-muted mt-1">{item.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCardState message="No recent updates" />
          )}
        </div>
      )}
    </HomeCardShell>
  );
};

export default FeedsCard;
