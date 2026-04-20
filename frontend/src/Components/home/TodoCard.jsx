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
import ModernDatePicker from "../ui/ModernDatePicker";

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

const validateTodo = ({ title, description, dueDate }, options = {}) => {
  const { allowPastDue = false } = options;
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
  else if (!allowPastDue && dueDate < getToday()) nextErrors.dueDate = "Due date cannot be in the past";

  return nextErrors;
};

const ToDoCard = ({ onDelete, userId }) => {
  const { user } = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalForm, setAddModalForm] = useState(EMPTY_FORM);
  const [addModalTouched, setAddModalTouched] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalTouched, setModalTouched] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });
  const [detailModal, setDetailModal] = useState({ open: false, task: null });
  const [modalForm, setModalForm] = useState({ ...EMPTY_FORM, completed: false });
  const menuRef = useRef();
  const pendingDeleteRef = useRef({});

  const resolvedUserId = userId || user?.user?._id || user?.user?.id;
  const addErrors = useMemo(() => validateTodo(addModalForm), [addModalForm]);
  const modalErrors = useMemo(
    () => validateTodo(modalForm, { allowPastDue: true }),
    [modalForm]
  );
  const addDisabled = saving || Object.keys(addErrors).length > 0;
  const modalSaveDisabled =
    Object.keys(modalErrors).length > 0;
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

  const resetAddModal = () => {
    setAddModalForm(EMPTY_FORM);
    setAddModalTouched({});
    setAddModalOpen(false);
  };

  const openAddModal = () => {
    setAddModalForm(EMPTY_FORM);
    setAddModalTouched({});
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    resetAddModal();
  };

  const handleAddFieldChange = (field, value) => {
    setAddModalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFieldBlur = (field) => {
    setAddModalTouched((prev) => ({ ...prev, [field]: true }));
  };

  const addTask = async () => {
    if (addDisabled || !resolvedUserId) {
      setAddModalTouched({
        title: true,
        description: true,
        dueDate: true,
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: addModalForm.title.trim(),
        description: addModalForm.description.trim(),
        dueDate: addModalForm.dueDate,
      };
      const { data } = await api.post(`/users/${resolvedUserId}/todos`, payload);
      setTasks((prev) => [
        {
          ...data,
          dueDate: formatDateInput(data.dueDate),
        },
        ...prev,
      ]);
      resetAddModal();
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
      return data;
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

  const closeDetailModal = () => {
    setDetailModal({ open: false, task: null });
    setModalForm({ ...EMPTY_FORM, completed: false });
    setModalTouched({});
  };

  const openDetailModal = (task) => {
    if (!task) return;
    setDetailModal({ open: true, task });
    setModalForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      completed: !!task.completed,
    });
    setModalTouched({});
  };

  const handleModalFieldChange = (field, value) => {
    setModalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalFieldBlur = (field) => {
    setModalTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleModalSave = async () => {
    const task = detailModal.task;
    if (!task?._id || !resolvedUserId) return;
    if (modalSaveDisabled) {
      setModalTouched({ title: true, description: true, dueDate: true, completed: true });
      return;
    }

    try {
      const data = await persistTaskUpdate(
        task._id,
        {
          title: modalForm.title.trim(),
          description: modalForm.description.trim(),
          dueDate: modalForm.dueDate,
          completed: modalForm.completed,
        },
        (prev) =>
          prev.map((t) =>
            t._id === task._id
              ? {
                  ...t,
                  title: modalForm.title.trim(),
                  description: modalForm.description.trim(),
                  dueDate: modalForm.dueDate,
                  completed: modalForm.completed,
                }
              : t
          )
      );
      const merged = {
        ...task,
        ...data,
        dueDate: formatDateInput(data.dueDate),
      };
      setDetailModal((prev) => ({ ...prev, task: merged }));
      setModalForm({
        title: merged.title || "",
        description: merged.description || "",
        dueDate: merged.dueDate || "",
        completed: !!merged.completed,
      });
      toast.success("Task updated");
      closeDetailModal();
    } catch {
      return;
    }
  };

  const removeTask = () => {
    const task = deleteDialog.task;
    if (!task || !resolvedUserId) return;

    const index = tasks.findIndex((item) => item._id === task._id);
    setTasks((prev) => prev.filter((item) => item._id !== task._id));
    if (detailModal.open && detailModal.task?._id === task._id) {
      closeDetailModal();
    }
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
              Enter your to-do list here
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

        {/* Add Task Button */}
        <div className="shrink-0 mb-3">
          <button
            onClick={openAddModal}
            className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1.5 font-medium"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Add Task
          </button>
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
                      <div
                        className={`font-semibold cursor-pointer truncate ${task.completed ? "line-through text-slate-400" : "text-slate-700"
                          }`}
                        onClick={() => openDetailModal(task)}
                      >
                        {task.title}
                      </div>
                      <div
                        className="text-[9px] text-slate-500 cursor-pointer whitespace-pre-wrap break-words"
                        onClick={() => openDetailModal(task)}
                      >
                        {task.description}
                      </div>
                      {task.dueDate && (
                        <div
                          className="text-[9px] text-slate-400 mt-1 italic cursor-pointer"
                          onClick={() => openDetailModal(task)}
                        >
                          Due: {task.dueDate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <button
                      type="button"
                      onClick={() => openDetailModal(task)}
                      className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"
                      title="View / edit"
                    >
                      <FiEdit2 className="h-3 w-3" />
                    </button>
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
      {detailModal.open && detailModal.task && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetailModal();
          }}
        >
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                  Todo
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  View and update this task
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6">
              <div className="space-y-5 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white ${
                      modalTouched.title && modalErrors.title ? "border-red-400" : "border-slate-200"
                    }`}
                    value={modalForm.title}
                    onChange={(e) => handleModalFieldChange("title", e.target.value)}
                    onBlur={() => handleModalFieldBlur("title")}
                  />
                  {modalTouched.title && modalErrors.title && (
                    <p className="text-[11px] text-red-500 mt-1.5">{modalErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={8}
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-700 bg-white resize-y min-h-[140px] ${
                      modalTouched.description && modalErrors.description ? "border-red-400" : "border-slate-200"
                    }`}
                    value={modalForm.description}
                    onChange={(e) => handleModalFieldChange("description", e.target.value)}
                    onBlur={() => handleModalFieldBlur("description")}
                    placeholder="Describe the task..."
                  />
                  {modalTouched.description && modalErrors.description && (
                    <p className="text-[11px] text-red-500 mt-1.5">{modalErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <ModernDatePicker
                      label="Due Date"
                      name="dueDate"
                      value={modalForm.dueDate}
                      onChange={(e) => handleModalFieldChange("dueDate", e.target.value)}
                      required
                      placeholder="Select Date"
                      error={modalTouched.dueDate && modalErrors.dueDate ? modalErrors.dueDate : null}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 bg-slate-50/80 hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={modalForm.completed}
                        onChange={(e) => handleModalFieldChange("completed", e.target.checked)}
                        className="w-4 h-4 rounded accent-green-600"
                      />
                      <span className="text-sm font-semibold text-slate-700">Mark as completed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={closeDetailModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSave}
                disabled={modalSaveDisabled}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-[#64748b] shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingTaskId === detailModal.task._id ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {addModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal();
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                  Add To-Do
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enter task details and save to your to-do list.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6">
              <div className="space-y-5 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white ${
                      addModalTouched.title && addErrors.title ? "border-red-400" : "border-slate-200"
                    }`}
                    value={addModalForm.title}
                    onChange={(e) => handleAddFieldChange("title", e.target.value)}
                    onBlur={() => handleAddFieldBlur("title")}
                    placeholder="Task name"
                  />
                  {addModalTouched.title && addErrors.title && (
                    <p className="text-[11px] text-red-500 mt-1.5">{addErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-700 bg-white resize-y min-h-[120px] ${
                      addModalTouched.description && addErrors.description ? "border-red-400" : "border-slate-200"
                    }`}
                    value={addModalForm.description}
                    onChange={(e) => handleAddFieldChange("description", e.target.value)}
                    onBlur={() => handleAddFieldBlur("description")}
                    placeholder="Describe the task..."
                  />
                  {addModalTouched.description && addErrors.description && (
                    <p className="text-[11px] text-red-500 mt-1.5">{addErrors.description}</p>
                  )}
                </div>

                <div>
                  <ModernDatePicker
                    label="Due Date"
                    name="dueDate"
                    value={addModalForm.dueDate}
                    onChange={(e) => handleAddFieldChange("dueDate", e.target.value)}
                    required
                    placeholder="Select Date"
                    error={addModalTouched.dueDate && addErrors.dueDate ? addErrors.dueDate : null}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={closeAddModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addTask}
                disabled={addDisabled}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-[#64748b] shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save task"}
              </button>
            </div>
          </div>
        </div>
      )}
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
