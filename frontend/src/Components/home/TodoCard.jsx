import React, { useState, useEffect, useRef } from "react";
import {
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiMoreVertical,
  FiCheckSquare,
} from "react-icons/fi";

const defaultTasks = [
  {
    id: 1,
    title: "UI Designs",
    description: "Explore the designs for UI",
    dueDate: "2024-05-15",
    completed: true,
  },
  {
    id: 2,
    title: "Build a component",
    description: "Create input field and interactions",
    dueDate: "2024-05-20",
    completed: false,
  },
];

const ToDoCard = ({ onDelete }) => {
  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    setTasks(defaultTasks);
  }, []);

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
    if (newTitle.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          title: newTitle.trim(),
          description: newDesc.trim(),
          dueDate: newDueDate || null,
          completed: false,
        },
      ]);
      setNewTitle("");
      setNewDesc("");
      setNewDueDate("");
      setShowAddForm(false);
    }
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleFieldChange = (id, field, value) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleBlur = () => setEditing(null);

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCheckSquare className="w-4 h-4 text-green-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">To-Do</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            Enter Your to do list here
          </p>
        </div>

        {/* 3-dot Menu */}
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

      {/* Add Task Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-3 text-xs text-green-600 hover:text-green-800 flex items-center gap-1.5 font-medium"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add Task
        </button>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          <input
            type="text"
            placeholder="Task name"
            className="border border-slate-300 px-3 py-2 rounded-lg text-xs w-full bg-white"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Task description"
            className="border border-slate-300 px-3 py-2 rounded-lg text-xs w-full bg-white"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <input
            type="date"
            className="border border-slate-300 px-3 py-2 rounded-lg text-xs w-full bg-white"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button
            onClick={addTask}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-medium self-end hover:bg-green-600 transition"
          >
            Save Task
          </button>
        </div>
      )}

      {/* Task List */}
      <ul className="space-y-2 text-[10px]">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`rounded-lg p-3 flex justify-between items-start gap-2 ${
              task.completed ? "bg-emerald-50 border border-emerald-100" : "bg-[#E0E5EA]/30"
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task.id)}
                className="mt-0.5 shrink-0 w-4 h-4"
              />
              <div className="min-w-0">
                {editing === task.id ? (
                  <>
                    <input
                      className="font-semibold bg-white px-2 py-1.5 rounded-lg border border-slate-300 w-full text-xs mb-1.5"
                      value={task.title}
                      onChange={(e) =>
                        handleFieldChange(task.id, "title", e.target.value)
                      }
                      onBlur={handleBlur}
                    />
                    <input
                      className="text-[10px] text-slate-600 bg-white px-2 py-1.5 rounded-lg border border-slate-300 w-full mb-1.5"
                      value={task.description}
                      onChange={(e) =>
                        handleFieldChange(task.id, "description", e.target.value)
                      }
                      onBlur={handleBlur}
                    />
                    <input
                      type="date"
                      className="text-[10px] text-slate-600 bg-white px-2 py-1.5 rounded-lg border border-slate-300 w-full"
                      value={task.dueDate || ""}
                      onChange={(e) =>
                        handleFieldChange(task.id, "dueDate", e.target.value)
                      }
                      onBlur={handleBlur}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className={`font-semibold cursor-pointer ${
                        task.completed ? "line-through text-slate-500" : "text-slate-700"
                      }`}
                      onClick={() => setEditing(task.id)}
                    >
                      {task.title}
                    </div>
                    <div
                      className="text-[9px] text-slate-600 cursor-pointer"
                      onClick={() => setEditing(task.id)}
                    >
                      {task.description}
                    </div>
                    {task.dueDate && (
                      <div className="text-[9px] text-slate-500 mt-1">
                        Due: {task.dueDate}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Edit + Delete Buttons */}
            <div className="flex flex-col gap-1.5 items-end">
              {!task.completed && (
                <button
                  onClick={() => setEditing(task.id)}
                  className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"
                  title="Edit"
                >
                  <FiEdit2 className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => removeTask(task.id)}
                className="bg-red-100 text-red-600 p-1.5 rounded-md hover:bg-red-200"
                title="Delete"
              >
                <FiTrash2 className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDoCard;