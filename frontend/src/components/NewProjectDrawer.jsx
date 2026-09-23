import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const NewProjectDrawer = ({ isOpen, onClose }) => {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
 
 <div className="relative w-full max-w-lg rounded-xl shadow-2xl bg-surface dark:bg-app border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col p-6 max-h-[90vh]">
 {/* Header */}
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-lg font-semibold text-heading">New Project</h2>
 <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>

 {/* Form */}
 <form className="space-y-4 overflow-y-auto flex-1">
 <div className="grid grid-cols-2 gap-4">
 <input
 type="text"
 placeholder="Project Name"
 className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200"
 />
 <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200">
 <option value="">Project Owner</option>
 <option value="Alice">Alice</option>
 <option value="Bob">Bob</option>
 <option value="Charlie">Charlie</option>
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="relative">
 <input
 type="date"
 placeholder="Start Date"
 className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-amber-200"
 />
 <FaCalendarAlt className="absolute top-3 right-3 text-muted" />
 </div>
 <div className="relative">
 <input
 type="date"
 placeholder="End Date"
 className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-amber-200"
 />
 <FaCalendarAlt className="absolute top-3 right-3 text-muted" />
 </div>
 </div>

 <textarea
 placeholder="Description"
 rows="3"
 className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200"
 ></textarea>

 <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200">
 <option value="">Department</option>
 <option value="IT">IT</option>
 <option value="Marketing">Marketing</option>
 <option value="HR">HR</option>
 </select>

 <select className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200">
 <option value="">Users</option>
 <option value="User A">User A</option>
 <option value="User B">User B</option>
 <option value="User C">User C</option>
 </select>

 <div className="flex justify-end mt-4">
 <button type="submit" className="btn btn-primary">
 Save Project
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default NewProjectDrawer;
