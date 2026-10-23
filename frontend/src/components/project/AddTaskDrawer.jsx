import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";

const AddTaskDrawer = ({ isOpen, onClose, onSubmit, maxDueDate = "" }) => {
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

 const labelCls = "block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest";

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={onClose}
 title="Add New Task"
 maxWidth="max-w-lg"
 footer={
 <>
 <GlassButton variant="secondary" type="button" onClick={onClose}>
 Cancel
 </GlassButton>
 <GlassButton variant="primary" type="submit" form="addTaskDrawerForm" icon={FaPlus}>
 Add Task
 </GlassButton>
 </>
 }
 >
 <form id="addTaskDrawerForm" onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className={labelCls}>
 Task Title *
 </label>
 <input
 type="text"
 name="title"
 value={formData.title}
 onChange={handleChange}
 required
 className="glass-input"
 placeholder="Enter task title"
 />
 </div>

 <div>
 <label className={labelCls}>
 Description
 </label>
 <textarea
 name="description"
 value={formData.description}
 onChange={handleChange}
 rows={4}
 className="glass-input"
 placeholder="Enter task description"
 />
 </div>

 <div>
 <label className={labelCls}>
 Priority
 </label>
 <select
 name="priority"
 value={formData.priority}
 onChange={handleChange}
 className="glass-input cursor-pointer"
 >
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 </select>
 </div>

 <div>
 <label className={labelCls}>
 Due Date
 </label>
 <input
 type="date"
 name="dueDate"
 value={formData.dueDate}
 onChange={handleChange}
 max={maxDueDate ? maxDueDate.slice(0, 10) : undefined}
 className="glass-input"
 />
 </div>
 </form>
 </GlassModal>
 );
};

export default AddTaskDrawer;
