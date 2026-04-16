import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiTrash2,
  FiPlus,
  FiEdit2,
  FiMoreVertical,
  FiCheckSquare,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import api from "../../axios";
import EmptyCardState from "./EmptyCardState";

const EMPTY_FORM = {
  title: "",
  description: "",
  dueDate: "",
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const getToday = () => new Date().toISOString().split("T")[0];

const validateTodo = ({ title, description, dueDate }) => {
  const nextErrors = {};
  const titleValue = title.trim();
  const descriptionValue = description.trim();

  if (!titleValue) nextErrors.title = "Task name is required";
  else if (titleValue.length < 3) nextErrors.title = "Task name must be at least 3 characters";
  else if (titleValue.length > 100) nextErrors.title = "Task name cannot exceed 100 characters";

  if (!descriptionValue) nextErrors.description = "Task description is required";
  else if (descriptionValue.length < 3) nextErrors.description = "Task description must be at least 3 characters";
  else if (descriptionValue.length > 500) nextErrors.description = "Task description cannot exceed 500 characters";

  if (!dueDate) nextErrors.dueDate = "Due date is required";
  else if (dueDate < getToday()) nextErrors.dueDate = "Due date cannot be in the past";

  return nextErrors;
};

const ToDoCard = ({ onDelete, userId }) => {
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [editTask, setEditTask] = useState(EMPTY_FORM);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addTouched, setAddTouched] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const menuRef = useRef();
  const pendingDeleteRef = useRef({});

  const resolvedUserId = userId || user?.user?._id || user?.user?.id;
  const addErrors = useMemo(() => validateTodo(newTask), [newTask]);
  const editErrors = useMemo(() => validateTodo(editTask), [editTask]);
  const addDisabled = saving || Object.keys(addErrors).length > 0;
  const editDisabled = updatingTaskId === editing || Object.keys(editErrors).length > 0;
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const firstDate = a?.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const secondDate = b?.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

      if (firstDate !== secondDate) return firstDate - secondDate;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [tasks]);

  useEffect(() => {
    const fetchTodos = async () => {
      if (!resolvedUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get(`/users/${resolvedUserId}/todos`);
        setTasks(
          data.map((todo) => ({
            ...todo,
            dueDate: formatDateInput(todo.dueDate),
          }))
        );
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load todos");
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [resolvedUserId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(pendingDeleteRef.current).forEach(({ timeoutId, task }) => {
        clearTimeout(timeoutId);
        if (resolvedUserId && task?._id) {
          api.delete(`/users/${resolvedUserId}/todos/${task._id}`).catch(() => {});
        }
      });
    };
  }, [resolvedUserId]);

  const resetAddForm = () => {
    setNewTask(EMPTY_FORM);
    setAddTouched({});
    setShowAddForm(false);
  };

  const resetEditForm = () => {
    setEditing(null);
    setEditTask(EMPTY_FORM);
    setEditTouched({});
  };

  const handleAddFieldChange = (field, value) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
    setAddTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEditFieldChange = (field, value) => {
    setEditTask((prev) => ({ ...prev, [field]: value }));
    setEditTouched((prev) => ({ ...prev, [field]: true }));
  };

  const addTask = async () => {
    if (addDisabled || !resolvedUserId) {
      setAddTouched({
        title: true,
        description: true,
        dueDate: true,
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        dueDate: newTask.dueDate,
      };
      const { data } = await api.post(`/users/${resolvedUserId}/todos`, payload);
      setTasks((prev) => [
        {
          ...data,
          dueDate: formatDateInput(data.dueDate),
        },
        ...prev,
      ]);
      resetAddForm();
      toast.success("Task added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const persistTaskUpdate = async (todoId, payload, optimisticUpdater) => {
    const previousTasks = tasks;
    setTasks(optimisticUpdater);

    try {
      setUpdatingTaskId(todoId);
      const { data } = await api.put(`/users/${resolvedUserId}/todos/${todoId}`, payload);
      setTasks((prev) =>
        prev.map((task) =>
          task._id === todoId
            ? {
                ...task,
                ...data,
                dueDate: formatDateInput(data.dueDate),
              }
            : task
        )
      );
    } catch (error) {
      setTasks(previousTasks);
      toast.error(error.response?.data?.message || "Failed to update task");
      throw error;
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await persistTaskUpdate(
        task._id,
        { completed: !task.completed },
        (prev) =>
          prev.map((item) =>
            item._id === task._id ? { ...item, completed: !item.completed } : item
          )
      );
    } catch {
      return;
    }
  };

  const handleEditClick = (task) => {
    setEditing(task._id);
    setEditTask({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
    });
    setEditTouched({});
  };

  const handleEditSave = async (taskId) => {
    if (editDisabled || !resolvedUserId) {
      setEditTouched({
        title: true,
        description: true,
        dueDate: true,
      });
      return;
    }

    try {
      await persistTaskUpdate(
        taskId,
        {
          title: editTask.title.trim(),
          description: editTask.description.trim(),
          dueDate: editTask.dueDate,
        },
        (prev) =>
          prev.map((task) =>
            task._id === taskId
              ? {
                  ...task,
                  title: editTask.title.trim(),
                  description: editTask.description.trim(),
                  dueDate: editTask.dueDate,
                }
              : task
          )
      );
      resetEditForm();
      toast.success("Task updated");
    } catch {
      return;
    }
  };

  const undoDelete = (todoId) => {
    const pendingDelete = pendingDeleteRef.current[todoId];
    if (!pendingDelete) return;

    clearTimeout(pendingDelete.timeoutId);
    setTasks((prev) => {
      const next = [...prev];
      next.splice(pendingDelete.index, 0, pendingDelete.task);
      return next;
    });
    delete pendingDeleteRef.current[todoId];
    toast.info("Task restored");
  };

  const confirmDeleteTask = (task) => {
    setDeleteDialog({ open: true, task });
  };

  const removeTask = () => {
    const task = deleteDialog.task;
    if (!task || !resolvedUserId) return;

    const index = tasks.findIndex((item) => item._id === task._id);
    setTasks((prev) => prev.filter((item) => item._id !== task._id));
    if (editing === task._id) resetEditForm();
    setDeleteDialog({ open: false, task: null });

    const timeoutId = window.setTimeout(async () => {
      try {
        await api.delete(`/users/${resolvedUserId}/todos/${task._id}`);
      } catch (error) {
        setTasks((prev) => {
          const next = [...prev];
          next.splice(index, 0, task);
          return next;
        });
        toast.error(error.response?.data?.message || "Failed to delete task");
      } finally {
        delete pendingDeleteRef.current[task._id];
      }
    }, 5000);

    pendingDeleteRef.current[task._id] = { timeoutId, task, index };

    toast(
      ({ closeToast }) => (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span>Task deleted</span>
          <button
            onClick={() => {
              undoDelete(task._id);
              closeToast?.();
            }}
            className="rounded-md bg-slate-900 px-2 py-1 text-white"
          >
            Undo
          </button>
        </div>
      ),
      {
        autoClose: 5000,
        closeOnClick: false,
      }
    );
  };

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
                  className={`border px-3 py-2 rounded-lg text-xs w-full bg-white ${addTouched.title && addErrors.title ? "border-red-400" : "border-slate-300"}`}
                  value={newTask.title}
                  onChange={(e) => handleAddFieldChange("title", e.target.value)}
                />
                {addTouched.title && addErrors.title && (
                  <p className="text-[9px] text-red-500 mt-1">{addErrors.title}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Task description"
                  className={`border px-3 py-2 rounded-lg text-xs w-full bg-white ${addTouched.description && addErrors.description ? "border-red-400" : "border-slate-300"}`}
                  value={newTask.description}
                  onChange={(e) => handleAddFieldChange("description", e.target.value)}
                />
                {addTouched.description && addErrors.description && (
                  <p className="text-[9px] text-red-500 mt-1">{addErrors.description}</p>
                )}
              </div>
              <div>
                <input
                  type="date"
                  min={getToday()}
                  className={`border px-3 py-2 rounded-lg text-xs w-full bg-white ${addTouched.dueDate && addErrors.dueDate ? "border-red-400" : "border-slate-300"}`}
                  value={newTask.dueDate}
                  onChange={(e) => handleAddFieldChange("dueDate", e.target.value)}
                />
                {addTouched.dueDate && addErrors.dueDate && (
                  <p className="text-[9px] text-red-500 mt-1">{addErrors.dueDate}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={resetAddForm}
                  className="text-[10px] text-slate-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  disabled={addDisabled}
                  className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Task List Section */}
        <div className="overflow-y-auto flex-1 pr-1 max-h-[200px] custom-scrollbar">
          {loading ? (
            <div className="text-[10px] text-slate-500 py-6 text-center">Loading todos...</div>
          ) : sortedTasks.length > 0 ? (
            <ul className="space-y-2 text-[10px]">
              {sortedTasks.map((task) => (
                <li
                  key={task._id}
                  className={`rounded-lg p-3 flex justify-between items-start gap-2 transition-all ${task.completed ? "bg-emerald-50 border border-emerald-100" : "bg-[#E0E5EA]/30 border border-transparent"
                    }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task)}
                      disabled={updatingTaskId === task._id}
                      className="mt-0.5 shrink-0 w-4 h-4 cursor-pointer accent-green-600"
                    />
                    <div className="min-w-0 flex-1">
                      {editing === task._id ? (
                        <div className="space-y-2">
                          <div>
                            <input
                              autoFocus
                              className={`font-semibold bg-white px-2 py-1 rounded border w-full text-xs ${editTouched.title && editErrors.title ? "border-red-400" : "border-slate-300"}`}
                              value={editTask.title}
                              onChange={(e) => handleEditFieldChange("title", e.target.value)}
                            />
                            {editTouched.title && editErrors.title && (
                              <p className="text-[9px] text-red-500 mt-1">{editErrors.title}</p>
                            )}
                          </div>
                          <div>
                            <input
                              className={`text-[10px] text-slate-600 bg-white px-2 py-1 rounded border w-full ${editTouched.description && editErrors.description ? "border-red-400" : "border-slate-300"}`}
                              value={editTask.description}
                              onChange={(e) => handleEditFieldChange("description", e.target.value)}
                              placeholder="Description"
                            />
                            {editTouched.description && editErrors.description && (
                              <p className="text-[9px] text-red-500 mt-1">{editErrors.description}</p>
                            )}
                          </div>
                          <div>
                            <input
                              type="date"
                              min={getToday()}
                              className={`text-[10px] bg-white px-2 py-1 rounded border w-full ${editTouched.dueDate && editErrors.dueDate ? "border-red-400" : "border-slate-300"}`}
                              value={editTask.dueDate}
                              onChange={(e) => handleEditFieldChange("dueDate", e.target.value)}
                            />
                            {editTouched.dueDate && editErrors.dueDate && (
                              <p className="text-[9px] text-red-500 mt-1">{editErrors.dueDate}</p>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleEditSave(task._id)}
                              disabled={editDisabled}
                              className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-green-600 transition disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingTaskId === task._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={resetEditForm}
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
                            onClick={() => handleEditClick(task)}
                          >
                            {task.title}
                          </div>
                          <div
                            className="text-[9px] text-slate-500 cursor-pointer whitespace-pre-wrap break-words"
                            onClick={() => handleEditClick(task)}
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
                    {!task.completed && editing !== task._id && (
                      <button
                        onClick={() => handleEditClick(task)}
                        className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"
                      >
                        <FiEdit2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => confirmDeleteTask(task)}
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
      {deleteDialog.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <FiTrash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
                Delete Todo
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Are you sure you want to delete this todo? You can undo it for a few seconds after deleting.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteDialog({ open: false, task: null })}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={removeTask}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToDoCard;
