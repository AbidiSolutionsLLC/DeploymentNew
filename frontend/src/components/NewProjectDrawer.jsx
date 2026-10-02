import React, { useState, useEffect } from 'react';
import GlassModal from './ui/GlassModal';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from '../axios';

const NewProjectDrawer = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsersAndDepts();
    }
  }, [isOpen]);

  const fetchUsersAndDepts = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments')
      ]);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setDepartments(deptsRes.data?.data || deptsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch users or departments", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTeamChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setTeam(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !owner || !department) return;
    onSubmit({
      title,
      description,
      owner,
      department,
      team,
      startDate,
      dueDate
    });
    // Reset form on success will be handled by parent unmounting/closing it
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <button type="button" onClick={onClose} className="btn-ghost text-muted">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} className="btn btn-primary">
        Save Project
      </button>
    </div>
  );

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="New Project" footer={footer}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Project Name*</label>
            <input
              type="text"
              placeholder="Project Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Project Owner*</label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
              required
            >
              <option className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800" value="">Select Owner</option>
              {users.map(u => (
                <option className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800" key={u._id || u.id} value={u._id || u.id}>
                  {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(d) => setStartDate(d)}
              dateFormat="M/d/yyyy"
              placeholderText="Select Date"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer"
              popperProps={{ strategy: "fixed" }}
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold text-muted mb-2 uppercase">End Date</label>
            <DatePicker
              selected={dueDate}
              onChange={(d) => setDueDate(d)}
              dateFormat="M/d/yyyy"
              placeholderText="Select Date"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer"
              popperProps={{ strategy: "fixed" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2 uppercase">Description</label>
          <textarea
            placeholder="Description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none transition-all"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Department*</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
              required
            >
              <option className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800" value="">Select Department</option>
              {departments.map(d => (
                <option className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800" key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Team Members</label>
            <select
              multiple
              value={team}
              onChange={handleTeamChange}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all h-24 custom-scrollbar-visible"
            >
              {users.map(u => (
                <option className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800" key={u._id || u.id} value={u._id || u.id}>
                  {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>
      </form>
    </GlassModal>
  );
};

export default NewProjectDrawer;
