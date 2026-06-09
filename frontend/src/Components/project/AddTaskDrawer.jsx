import React, { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";

const AddTaskDrawer = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assigneeId: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assigneeId: ""
      });
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="modal-container-standard w-full max-w-lg bg-white flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Add New Task</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assign a new task to this project</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body-scroll p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Task Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="What needs to be done?"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the task details..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-6 pb-2 mt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className="btn btn-ghost px-6">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-8 shadow-lg shadow-blue-100 gap-2">
                <FaPlus className="w-3.5 h-3.5" strokeWidth={3} /> ADD TASK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTaskDrawer;
