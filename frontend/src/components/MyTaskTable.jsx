import { useState } from "react";
import TaskDetailModal from "./TaskDetailModal";
import TaskStatusDropDown from "./home/TaskStatusDropDown";
import TableWithPagination from "./TableWithPagination";

const MyTasksTable = ({ tasks, setTasks, children }) => {
 const [selectedTask, setSelectedTask] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const openModal = (task) => {
 setSelectedTask(task);
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setSelectedTask(null);
 };
 const myTaskColumns = [
 { key: "title", label: "Task Name", render: (val) => <span className="whitespace-nowrap font-medium">{val}</span> },
 { key: "project", label: "Project", render: (val) => <span className="whitespace-nowrap">{val?.title || 'N/A'}</span> },
 { key: "description", label: "Description", render: (val) => <span className="whitespace-nowrap truncate max-w-xs block">{val}</span> },
 { key: "dueDate", label: "Due Date", render: (val) => <span className="whitespace-nowrap">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span> },
 { key: "priority", label: "Priority", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 {
 key: "status",
 label: "Status",
 render: (val, task, index) => (
 <div onClick={(e) => e.stopPropagation()}>
 <TaskStatusDropDown
 status={val}
 onChange={(newStatus) => {
 // We need to find the actual index of the task in the tasks array
 const actualIndex = tasks.findIndex(t => t === task);
 if (actualIndex !== -1) {
 setTasks((i) =>
 i.map((item, indexI) => {
 return indexI === actualIndex
 ? { ...item, status: newStatus }
 : item;
 })
 );
 }
 }}
 />
 </div>
 )
 }
 ];

 return (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-4 w-full overflow-hidden">
 {children}
 <TableWithPagination
 columns={myTaskColumns}
 data={tasks}
 emptyMessage="No tasks found"
 onRowClick={(task) => openModal(task)}
 defaultSort={{ key: "startDate", direction: "desc" }}
 />
 {isModalOpen && (
 <TaskDetailModal task={selectedTask} onClose={closeModal} />
 )}
 </div>
 );
};

export default MyTasksTable;
