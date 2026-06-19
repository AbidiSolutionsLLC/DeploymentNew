import React, { useState } from "react";
import ModernSelect from "./ui/ModernSelect"; 
import ModernDatePicker from "./ui/ModernDatePicker";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

const users = [
  "Ahsan Khan", "Murtaza Mehmood", "Hammad Shaikh", "Adil Abbas Khuhro", "Syed Munawar Ali Tirmizi",
];

const AddTaskModal = ({ isOpen, onClose }) => {
  const [assignTo, setAssignTo] = useState(null);
  const [assignBy, setAssignBy] = useState(null);
  const [queryTo, setQueryTo] = useState("");
  const [queryBy, setQueryBy] = useState("");
  const [showDropdownTo, setShowDropdownTo] = useState(false);
  const [showDropdownBy, setShowDropdownBy] = useState(false);
  
  // State for Modern Components
  const [taskData, setTaskData] = useState({
    priority: "Medium",
    status: "Pending",
    startDate: "",
    endDate: ""
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleModernChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: value ? null : `${name} is required.` }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const form = document.getElementById("taskForm");
    const newErrors = {};
    
    if (!form.taskName.value) newErrors.taskName = "Task name is required.";
    if (!taskData.startDate) newErrors.startDate = "Start date is required.";
    if (!taskData.endDate) newErrors.endDate = "End date is required.";
    if (!taskData.priority) newErrors.priority = "Priority is required.";
    if (!taskData.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    console.log("Submitting task:", { 
      taskName: form.taskName.value,
      ...taskData,
      assignTo,
      assignBy,
      description: form.description.value
    });
    // Add API call here
    onClose();
  };

  const filteredUsersTo = users.filter((user) => user.toLowerCase().includes(queryTo.toLowerCase()));
  const filteredUsersBy = users.filter((user) => user.toLowerCase().includes(queryBy.toLowerCase()));

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="ADD NEW TASK"
      maxWidth="max-w-2xl"
      footer={
        <>
          <GlassButton variant="ghost" onClick={onClose}>
            CANCEL
          </GlassButton>
          <GlassButton variant="primary" onClick={handleSubmit}>
            SAVE TASK
          </GlassButton>
        </>
      }
    >
      <form id="taskForm" onSubmit={handleSubmit} className="space-y-6">
        {/* Task Name */}
        <div>
          <label className="block text-[10px] font-black text-muted dark:text-slate-500 mb-2 uppercase tracking-widest">
            TASK NAME*
          </label>
          <input 
            type="text" 
            name="taskName"
            placeholder="Task name" 
            className={`glass-input w-full ${errors.taskName ? 'border-red-400 ring-1 ring-red-400' : ''}`} 
            required 
            onChange={(e) => setErrors(prev => ({ ...prev, taskName: e.target.value ? null : "Task name is required." }))}
          />
          {errors.taskName && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.taskName}</p>}
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernDatePicker label="Start Date" name="startDate" value={taskData.startDate} onChange={handleModernChange} placeholder="Select Start Date" error={errors.startDate} />
          <ModernDatePicker label="End Date" name="endDate" value={taskData.endDate} onChange={handleModernChange} placeholder="Select End Date" error={errors.endDate} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black text-muted dark:text-slate-500 mb-2 uppercase tracking-widest">
            DESCRIPTION
          </label>
          <textarea 
            name="description"
            placeholder="Brief description" 
            rows="3" 
            className="glass-input w-full resize-none min-h-[100px]"
          ></textarea>
        </div>

        {/* Assignment Row (Custom Searchable Dropdowns - Kept as is, but updated to use glass-input styling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-[10px] font-black text-muted dark:text-slate-500 mb-2 uppercase tracking-widest">ASSIGN TO</label>
            {!assignTo ? (
              <input 
                type="text" 
                value={queryTo} 
                onChange={(e) => { setQueryTo(e.target.value); setShowDropdownTo(true); }} 
                placeholder="Find user" 
                className="glass-input w-full" 
              />
            ) : (
              <div className="flex items-center justify-between border border-brand-primary/20 rounded-xl px-4 py-3 bg-brand-primary/5">
                <span className="text-sm font-bold text-heading dark:text-white">{assignTo}</span>
                <button type="button" onClick={() => {setAssignTo(null); setQueryTo("");}} className="text-[10px] font-black text-brand-primary uppercase">Change</button>
              </div>
            )}
            {showDropdownTo && filteredUsersTo.length > 0 && !assignTo && (
              <ul className="absolute left-0 right-0 mt-2 bg-surface dark:bg-slate-800 border border-border-subtle dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto custom-scrollbar-visible">
                {filteredUsersTo.map((user, i) => (
                  <li key={i} onClick={() => {setAssignTo(user); setShowDropdownTo(false);}} className="px-4 py-3 text-sm hover:bg-brand-primary/5 cursor-pointer text-heading dark:text-slate-300 font-medium border-b border-border-subtle dark:border-slate-700 last:border-0">{user}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black text-muted dark:text-slate-500 mb-2 uppercase tracking-widest">ASSIGN BY</label>
            {!assignBy ? (
              <input 
                type="text" 
                value={queryBy} 
                onChange={(e) => { setQueryBy(e.target.value); setShowDropdownBy(true); }} 
                placeholder="Find user" 
                className="glass-input w-full" 
              />
            ) : (
              <div className="flex items-center justify-between border border-brand-primary/20 rounded-xl px-4 py-3 bg-brand-primary/5">
                <span className="text-sm font-bold text-heading dark:text-white">{assignBy}</span>
                <button type="button" onClick={() => {setAssignBy(null); setQueryBy("");}} className="text-[10px] font-black text-brand-primary uppercase">Change</button>
              </div>
            )}
            {showDropdownBy && filteredUsersBy.length > 0 && !assignBy && (
              <ul className="absolute left-0 right-0 mt-2 bg-surface dark:bg-slate-800 border border-border-subtle dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto custom-scrollbar-visible">
                {filteredUsersBy.map((user, i) => (
                  <li key={i} onClick={() => {setAssignBy(user); setShowDropdownBy(false);}} className="px-4 py-3 text-sm hover:bg-brand-primary/5 cursor-pointer text-heading dark:text-slate-300 font-medium border-b border-border-subtle dark:border-slate-700 last:border-0">{user}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Priority & Status - UPDATED */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModernSelect 
            label="Priority" 
            name="priority" 
            value={taskData.priority} 
            onChange={handleModernChange}
            options={[{value: "Low", label: "LOW"}, {value: "Medium", label: "MEDIUM"}, {value: "High", label: "HIGH"}]} 
            error={errors.priority}
          />
          <ModernSelect 
            label="Status" 
            name="status" 
            value={taskData.status} 
            onChange={handleModernChange}
            options={[{value: "Pending", label: "PENDING"}, {value: "In Progress", label: "IN PROGRESS"}, {value: "Completed", label: "COMPLETED"}]} 
            error={errors.status}
          />
        </div>
      </form>
    </GlassModal>
  );
};

export default AddTaskModal;