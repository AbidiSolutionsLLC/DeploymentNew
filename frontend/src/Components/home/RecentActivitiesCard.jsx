// ========== RecentActivitiesCard.jsx ==========
import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiClock } from "react-icons/fi";
import EmptyCardState from "./EmptyCardState";

const recentActivities = [
 {
 id: 1,
 user: "Paul",
 action: "added a new task",
 time: "2 mins ago",
 color: "bg-green-100 text-green-800",
 },
 {
 id: 2,
 user: "Sarah",
 action: "updated project status",
 time: "10 mins ago",
 color: "bg-amber-100 text-amber-800",
 },
 {
 id: 3,
 user: "Admin",
 action: "deleted a holiday",
 time: "1 hour ago",
 color: "bg-red-100 text-red-700",
 },
];

const RecentActivitiesCard = ({ onDelete }) => {
 const [menuOpen, setMenuOpen] = useState(false);
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

 return (
 <div className="relative bg-surface rounded-[1.2rem] shadow-md border border-amber-100 p-4 w-full">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <FiClock className="w-4 h-4 text-purple-600" />
 <h3 className="text-xs font-bold text-main uppercase tracking-tight">Recent Activities</h3>
 </div>
 <p className="text-[10px] font-medium text-muted">
 Logs of team actions & updates
 </p>
 </div>

 <div className="relative" ref={menuRef}>
 <button
 onClick={() => setMenuOpen(!menuOpen)}
 className="p-1.5 rounded-lg hover:bg-app transition"
 >
 <FiMoreVertical className="h-4 w-4 text-muted" />
 </button>

 {menuOpen && (
 <div className="absolute right-0 mt-1 w-32 bg-surface shadow-lg border border-subtle rounded-xl z-50">
 <button
 onClick={() => {
 onDelete();
 setMenuOpen(false);
 }}
 className="flex items-center w-full px-3 py-2 text-[10px] text-red-500 hover:bg-red-50 font-medium"
 >
 <FiTrash2 className="w-3 h-3 mr-2" />
 Delete Card
 </button>
 </div>
 )}
 </div>
 </div>

 <div className="max-h-[200px] overflow-y-auto w-full">
 {recentActivities.length > 0 ? (
 <ul className="space-y-2 text-[10px]">
 {recentActivities.map((item) => (
 <li
 key={item.id}
 className={`${item.color} px-3 py-2 rounded-lg flex items-start gap-2.5`}
 >
 <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold bg-surface border border-subtle text-xs">
 {item.user[0]}
 </div>
 <div>
 <p className="font-medium text-main">
 <span className="font-semibold">{item.user}</span> {item.action}
 </p>
 <span className="text-[9px] text-muted">{item.time}</span>
 </div>
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

export default RecentActivitiesCard;

