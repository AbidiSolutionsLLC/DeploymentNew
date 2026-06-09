import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const NewProjectDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="modal-container-standard w-full max-w-2xl bg-white flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">New Project</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Initialize a new organization project</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form className="modal-body-scroll p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Owner</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer">
                <option value="">Select Owner</option>
                <option value="Alice">Alice</option>
                <option value="Bob">Bob</option>
                <option value="Charlie">Charlie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
              <div className="relative group">
                <input
                  type="date"
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                />
                <FaCalendarAlt className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
              <div className="relative group">
                <input
                  type="date"
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                />
                <FaCalendarAlt className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
            <textarea
              placeholder="Enter project goals and scope..."
              rows="4"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer">
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assigned Users</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer">
                <option value="">Select Users</option>
                <option value="User A">User A</option>
                <option value="User B">User B</option>
                <option value="User C">User C</option>
              </select>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-6 pb-2 mt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-ghost px-6">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8 shadow-lg shadow-blue-100">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectDrawer;
