import { useState } from "react";
import TaskDetailModal from "./TaskDetailModal";
import StatusDropDown from "./StatusDropDown";
import TaskStatusDropDown from "./home/TaskStatusDropDown";

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
  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      {/* Top Bar: Sort By & Add Task */}
      {/* <div className="flex justify-between items-center mb-4">
        <button className="flex items-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110">
          Sort By <FaSortDown className="text-xs" />
        </button>
        <button onClick={()=>openModal()} className="flex items-center gap-2 bg-[#86B2AA] text-white text-sm px-4 py-2 rounded-md hover:brightness-110">
          <FaPlus /> Add Task
        </button>
      </div> */}
      {children}

      {/* Tasks Table */}
      <div className="overflow-x-auto scrollbar-hide ">
        <table className="min-w-full text-sm scrollbar-hide text-left border-separate border-spacing-0">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Task Name",
                "Description",
                "Start Date",
                "End Date",
                "Assigned By",
                "Priority",
                "Status",
              ].map((header, index) => (
                <th
                  key={index}
                  className="p-3 font-medium text-gray-700 border-r whitespace-nowrap last:border-none border-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0
              ? tasks.map((task, index) => (
                  <tr
                    onClick={() => openModal(task)}
                    className="cursor-pointer hover:bg-blue-50"
                    key={index}
                  >
                    <td className="p-3 whitespace-nowrap">{task.name}</td>
                    <td className="p-3 whitespace-nowrap">
                      {task.description}
                    </td>
                    <td className="p-3 whitespace-nowrap">{task.startDate}</td>
                    <td className="p-3 whitespace-nowrap">{task.endDate}</td>
                    <td className="p-3 whitespace-nowrap">{task.assignedBy}</td>
                    {/* <td className="p-3">{task.assignedBy}</td> */}
                    <td className="p-3 whitespace-nowrap">{task.priority}</td>
                    {/* <td className="p-3">{task.status}</td> */}
                    <td className="p-3  h-full">
                      <TaskStatusDropDown
                        status={task.status}
                        onChange={(newStatus) => {
                          setTasks((i) =>
                            i.map((item, indexI) => {
                              return indexI === index
                                ? { ...item, status: newStatus }
                                : item;
                            })
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))
              : [...Array(8)].map((_, index) => (
                  <tr key={index} className="border-b">
                    {[...Array(7)].map((__, colIndex) => (
                      <td key={colIndex} className="p-3">
                        <div className="h-4 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {/* Modal */}
        {isModalOpen && (
          <TaskDetailModal task={selectedTask} onClose={closeModal} />
        )}
      </div>
    </div>
  );
};

export default MyTasksTable;
