import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const NewProjectDrawer = ({ isOpen, onClose }) => {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-app flex justify-end z-50">
 <div className="w-full sm:w-[600px] md:w-[700px] bg-surface h-full shadow-lg flex flex-col p-6 relative">
 {/* Header */}
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-lg font-semibold">New Projects</h2>
 <button onClick={onClose} className="btn-ghost text-muted">&times;</button>
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
