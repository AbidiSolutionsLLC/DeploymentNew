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
 { key: "name", label: "Task Name", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "description", label: "Description", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "startDate", label: "Start Date", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "endDate", label: "End Date", render: (val) => <span className="whitespace-nowrap">{val}</span> },
 { key: "assignedBy", label: "Assigned By", render: (val) => <span className="whitespace-nowrap">{val}</span> },
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
 />
 {isModalOpen && (
 <TaskDetailModal task={selectedTask} onClose={closeModal} />
 )}
 </div>
 );
};

export default MyTasksTable;
