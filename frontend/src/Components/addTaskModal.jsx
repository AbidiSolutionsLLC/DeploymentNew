import React, { useState, useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const users = [
  "Ahsan Khan",
  "Murtaza Mehmood",
  "Hammad Shaikh",
  "Adil Abbas Khuhro",
  "Syed Munawar Ali Tirmizi",
];

const AddTaskModal = ({ isOpen, onClose }) => {
  const [assignTo, setAssignTo] = useState(null);
  const [assignBy, setAssignBy] = useState(null);
  const [queryTo, setQueryTo] = useState("");
  const [queryBy, setQueryBy] = useState("");
  const [showDropdownTo, setShowDropdownTo] = useState(false);
  const [showDropdownBy, setShowDropdownBy] = useState(false);
  
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const filteredUsersTo = users.filter((user) =>
    user.toLowerCase().includes(queryTo.toLowerCase())
  );
  const filteredUsersBy = users.filter((user) =>
    user.toLowerCase().includes(queryBy.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            ADD NEW TASK
          </h2>
        </div>

        {/* Form Body */}
        <form 
          id="taskForm"
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
          onSubmit={(e) => { e.preventDefault(); /* Add submit logic */ }}
        >
          {/* Task Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">TASK NAME*</label>
            <input
              type="text"
              placeholder="Task name"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
              required
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">START DATE</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">END DATE</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DESCRIPTION</label>
            <textarea
              placeholder="Brief description"
              rows="3"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
            ></textarea>
          </div>

          {/* Assignment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assign To */}
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ASSIGN TO</label>
              {!assignTo ? (
                <input
                  type="text"
                  value={queryTo}
                  onChange={(e) => { setQueryTo(e.target.value); setShowDropdownTo(true); }}
                  placeholder="Find user"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <div className="flex items-center justify-between border border-blue-100 rounded-xl px-4 py-3 bg-blue-50/50">
                  <span className="text-sm font-bold text-slate-700">{assignTo}</span>
                  <button type="button" onClick={() => {setAssignTo(null); setQueryTo("");}} className="text-[10px] font-black text-blue-500 uppercase">Change</button>
                </div>
              )}
              {showDropdownTo && filteredUsersTo.length > 0 && !assignTo && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                  {filteredUsersTo.map((user, i) => (
                    <li key={i} onClick={() => {setAssignTo(user); setShowDropdownTo(false);}} className="px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer text-slate-600 font-medium border-b border-slate-50 last:border-0">
                      {user}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Assign By */}
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ASSIGN BY</label>
              {!assignBy ? (
                <input
                  type="text"
                  value={queryBy}
                  onChange={(e) => { setQueryBy(e.target.value); setShowDropdownBy(true); }}
                  placeholder="Find user"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <div className="flex items-center justify-between border border-blue-100 rounded-xl px-4 py-3 bg-blue-50/50">
                  <span className="text-sm font-bold text-slate-700">{assignBy}</span>
                  <button type="button" onClick={() => {setAssignBy(null); setQueryBy("");}} className="text-[10px] font-black text-blue-500 uppercase">Change</button>
                </div>
              )}
              {showDropdownBy && filteredUsersBy.length > 0 && !assignBy && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                  {filteredUsersBy.map((user, i) => (
                    <li key={i} onClick={() => {setAssignBy(user); setShowDropdownBy(false);}} className="px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer text-slate-600 font-medium border-b border-slate-50 last:border-0">
                      {user}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">PRIORITY</label>
              <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100">
                <option value="Low">LOW</option>
                <option value="Medium">MEDIUM</option>
                <option value="High">HIGH</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">STATUS</label>
              <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100">
                <option value="Pending">PENDING</option>
                <option value="In Progress">IN PROGRESS</option>
                <option value="Completed">COMPLETED</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            CANCEL
          </button>
          <button 
            type="submit" 
            form="taskForm"
            className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            SAVE TASK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;