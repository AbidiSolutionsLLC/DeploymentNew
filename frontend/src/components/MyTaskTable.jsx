import { useState } from "react";
import TaskDetailModal from "./TaskDetailModal";
import TaskStatusDropDown from "./home/TaskStatusDropDown";
import GlobalTable from "./ui/GlobalTable";
import {
  TableDate,
  TablePriority,
  TableText,
  TableTitle,
} from "./ui/TableCells";

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
 { key: "title", label: "Task Name", render: (val) => <TableTitle title={val} maxWidth="max-w-[200px]" /> },
 { key: "project", label: "Project", render: (val) => <TableText value={val?.title || "N/A"} /> },
 { key: "description", label: "Description", render: (val) => <TableText value={val} muted truncate maxWidth="max-w-xs" /> },
 { key: "dueDate", label: "Due Date", render: (val) => <TableDate value={val} /> },
 { key: "priority", label: "Priority", render: (val) => <TablePriority value={val} /> },
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
 <GlobalTable
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
