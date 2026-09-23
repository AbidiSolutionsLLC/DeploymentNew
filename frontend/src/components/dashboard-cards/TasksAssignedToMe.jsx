import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical, FiTrash2, FiClipboard } from "react-icons/fi";

const TasksAssignedToMeCard = ({ tasks = [], onDelete }) => {
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
 <h2 className="text-lg text-heading font-semibold">Tasks Assigned to Me</h2>
 <p className="text-muted text-sm font-medium">
 Active and pending tasks
 </p>
 </div>

 
 </div>

 {/* Task list */}
 {tasks.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-muted py-8 flex-1"><p>No active tasks found.</p></div>) : (<ul className="space-y-2 text-sm flex-1">{tasks.map((item, index) => (<li key={index} className="bg-secondary/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3 border border-border-subtle"><div className="min-w-0"><span className="font-medium text-heading">{item.title}</span><div className="text-description text-sm">Status: {item.status || "Pending"}</div></div><button className="btn btn-primary text-[10px] px-3 py-1.5 h-auto">View</button></li>))}</ul>)}
 </div>
 );
};

export default TasksAssignedToMeCard;



