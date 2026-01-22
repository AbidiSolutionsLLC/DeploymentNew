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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md transform transition-transform duration-300 ease-in-out">
        <div className="h-full p-6 shadow-xl bg-secondary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-heading">
              Add New Task
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:opacity-70 transition-opacity text-description"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full p-3 border border-primary/40 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm transition-all bg-background text-text"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-primary/40 rounded-lg resize-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm transition-all bg-background text-text"
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-3 border border-primary/40 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm transition-all bg-background text-text"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full p-3 border border-primary/40 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm transition-all bg-background text-text"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-primary rounded-lg text-sm font-medium hover:opacity-70 transition-opacity text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity bg-primary"
              >
                <FaPlus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTaskDrawer;
