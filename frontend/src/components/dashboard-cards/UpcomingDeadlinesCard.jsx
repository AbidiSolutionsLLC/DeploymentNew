// Components/UpcomingDeadlinesCard.jsx
import React, { useRef, useState, useEffect } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { FiCalendar, FiMoreVertical, FiTrash2 } from "react-icons/fi";

const deadlines = [
 { task: "Submit Project Proposal", project: "Website Redesign", dueDate: "2025-08-11", status: "High Priority", completion: 30 },
 { task: "Client Review Meeting", project: "Mobile App Launch", dueDate: "2025-08-15", status: "Scheduled", completion: 55 },
 { task: "UI/UX Final Design", project: "Marketing Campaign", dueDate: "2025-08-20", status: "In Progress", completion: 45 },
];

function daysLeftFrom(dateString) {
 const today = new Date();
 const due = new Date(dateString + "T23:59:59");
 const diffMs = due - today;
 return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function UpcomingDeadlinesCard() {
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

 return (
 <div className="bg-surface border border-border-subtle rounded-xl shadow-sm p-5 flex flex-col h-full w-full">
 {/* Icon top left */}
 

 {/* Header */}
 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-lg text-heading font-semibold">Upcoming Deadlines</h2>
 <p className="text-muted text-sm font-medium">
 Keep track of critical dates and statuses
 </p>
 </div>

 <div className="flex items-start gap-2">
 <button className="btn-ghost flex items-center">
 View All
 <ArrowRightIcon className="h-4 w-4 ml-1" />
 </button>
 </div>
 </div>

 {/* List */}
 <ul className="space-y-3 overflow-y-auto max-h-64 pr-2">
 {deadlines.map((d, i) => {
 const daysLeft = daysLeftFrom(d.dueDate);
 const dueLabel =
 daysLeft > 1
 ? `${daysLeft} days left`
 : daysLeft === 1
 ? "1 day left"
 : daysLeft === 0
 ? "Due today"
 : `${Math.abs(daysLeft)} days overdue`;

 const statusClass =
 d.status === "High Priority"
 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
 : d.status === "Scheduled"
 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
 : d.status === "In Progress"
 ? "bg-yellow-100 text-yellow-700"
 : "bg-app text-muted";

 return (
 <li
 key={i}
 className="bg-secondary/50 rounded-lg px-4 py-3 flex flex-col gap-2 border border-border-subtle"
 >
 <div className="flex justify-between items-start gap-3">
 <div className="min-w-0">
 <h3 className="font-medium text-heading truncate">{d.task}</h3>
 <p className="text-muted text-sm truncate">
 {d.project} &middot; Due {new Date(d.dueDate).toLocaleDateString()}
 </p>
 </div>
 <div className="text-right flex flex-col items-end">
 <span className="text-sm text-muted">{dueLabel}</span>
 <span className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
 {d.status}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div
 className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
 style={{ width: `${d.completion}%` }}
 />
 </div>
 <div className="text-xs font-semibold text-heading w-12 text-right">
 {d.completion}%
 </div>
 </div>
 </li>
 );
 })}
 </ul>
 </div>
 );
}


