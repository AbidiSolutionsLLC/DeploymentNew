import React, { useState, useEffect, useRef } from "react";
import {
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiMoreVertical,
  FiCheckSquare,
} from "react-icons/fi";
import { toast } from "react-toastify";

import EmptyCardState from "./EmptyCardState";

const defaultTasks = [];

const ToDoCard = ({ onDelete }) => {
  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const menuRef = useRef();

  useEffect(() => {
    // Load tasks from localStorage on mount
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse saved tasks:', e);
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, []);

  useEffect(() => {
    // Save tasks to localStorage whenever they change
    if (tasks.length > 0) {
      localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } else {
      localStorage.removeItem('todoTasks');
    }
  }, [tasks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTask = () => {
    const titleTrimmed = newTitle.trim();
    const descTrimmed = newDesc.trim();
    
    // Validation
    const newErrors = {};
    if (!titleTrimmed) {
      newErrors.title = 'Task name is required';
    }
    if (!newDueDate) {
      newErrors.date = 'Date is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix validation errors');
      return;
    }
    
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: titleTrimmed,
        description: descTrimmed,
        dueDate: newDueDate || null,
        completed: false,
      },
    ]);
    setNewTitle("");
    setNewDesc("");
    setNewDueDate("");
    setShowAddForm(false);
    setErrors({});
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id) => {
    const confirmed = window.confirm('Delete this task?');
    if (confirmed) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleFieldChange = (id, field, value) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleEditClick = (task) => {
    setEditing(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditDueDate(task.dueDate || "");
  };

  const handleEditSave = (id) => {
    const titleTrimmed = editTitle.trim();
    
    // Validation
    if (!titleTrimmed) {
      toast.error('Task name is required');
      return;
    }
    
    setTasks(tasks.map((t) => (t.id === id ? { 
      ...t, 
      title: titleTrimmed,
      description: editDesc.trim(),
      dueDate: editDueDate || null
    } : t)));
    setEditing(null);
    setErrors({});
  };

  const handleEditCancel = () => {
    setEditing(null);
    setEditTitle("");
    setEditDesc("");
    setEditDueDate("");
  };

  const handleBlur = () => setEditing(null);

  return (
    <>
      {/* Inline style for a custom slim scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-3 w-full h-full flex flex-col">
        {/* Header - Marked as shrink-0 so it stays fixed at top */}
        <div className="flex justify-between items-start mb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiCheckSquare className="w-4 h-4 text-green-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">To-Do</h3>
            </div>
            <p className="text-[10px] font-medium text-slate-500">
              Enter Your to do list here
            </p>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <FiMoreVertical className="h-4 w-4 text-slate-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white shadow-lg border border-slate-200 rounded-xl z-50">
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

        {/* Add Task Form Section - shrink-0 ensures it doesn't scroll away */}
        <div className="shrink-0">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-3 text-xs text-green-600 hover:text-green-800 flex items-center gap-1.5 font-medium"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add Task
            </button>
          ) : (
            <div className="flex flex-col gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <input
                  type="text"
                  placeholder="Task name"
                  className={`border px-3 py-2 rounded-lg text-xs w-full bg-white ${errors.title ? 'border-red-400' : 'border-slate-300'}`}
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                  }}
                />
                {errors.title && (
                  <p className="text-[9px] text-red-500 mt-1">{errors.title}</p>
                )}
              </div>
              <input
                type="text"
                placeholder="Task description"
                className="border border-slate-300 px-3 py-2 rounded-lg text-xs w-full bg-white"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div>
                <input
                  type="date"
                  className={`border px-3 py-2 rounded-lg text-xs w-full bg-white ${errors.date ? 'border-red-400' : 'border-slate-300'}`}
                  value={newDueDate}
                  onChange={(e) => {
                    setNewDueDate(e.target.value);
                    if (errors.date) setErrors(prev => ({ ...prev, date: null }));
                  }}
                />
                {errors.date && (
                  <p className="text-[9px] text-red-500 mt-1">{errors.date}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setErrors({});
                  }}
                  className="text-[10px] text-slate-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Task List Section */}
        <div className="overflow-y-auto flex-1 pr-1 max-h-[200px] custom-scrollbar">
          {tasks.length > 0 ? (
            <ul className="space-y-2 text-[10px]">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`rounded-lg p-3 flex justify-between items-start gap-2 transition-all ${task.completed ? "bg-emerald-50 border border-emerald-100" : "bg-[#E0E5EA]/30 border border-transparent"
                    }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="mt-0.5 shrink-0 w-4 h-4 cursor-pointer accent-green-600"
                    />
                    <div className="min-w-0 flex-1">
                      {editing === task.id ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            className="font-semibold bg-white px-2 py-1 rounded border border-slate-300 w-full text-xs"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <input
                            className="text-[10px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-300 w-full"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description"
                          />
                          <input
                            type="date"
                            className="text-[10px] bg-white px-2 py-1 rounded border border-slate-300 w-full"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleEditSave(task.id)}
                              className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-green-600 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="flex-1 bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-medium hover:bg-slate-300 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`font-semibold cursor-pointer truncate ${task.completed ? "line-through text-slate-400" : "text-slate-700"
                              }`}
                            onClick={() => setEditing(task.id)}
                          >
                            {task.title}
                          </div>
                          <div
                            className="text-[9px] text-slate-500 cursor-pointer line-clamp-2"
                            onClick={() => setEditing(task.id)}
                          >
                            {task.description}
                          </div>
                          {task.dueDate && (
                            <div className="text-[9px] text-slate-400 mt-1 italic">
                              Due: {task.dueDate}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {!task.completed && editing !== task.id && (
                      <button
                        onClick={() => handleEditClick(task)}
                        className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"
                      >
                        <FiEdit2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="bg-red-100 text-red-600 p-1.5 rounded-md hover:bg-red-200"
                    >
                      <FiTrash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCardState message="You haven't added anything yet" />
          )}
        </div>
      </div>
    </>
  );
};

export default ToDoCard;
