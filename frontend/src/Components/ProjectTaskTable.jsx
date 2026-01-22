
const ProjectTasksTable = ({ tasks ,children}) => {
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
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-gray-100">
            <tr>
              {["Task Name", "Description", "Start Date", "End Date", "Assigned By","Assigned To", "Priority", "Status"].map((header, index) => (
                <th
                  key={index}
                  className="p-3 font-medium text-gray-700 whitespace-nowrap border-r last:border-none border-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap">{task.name}</td>
                  <td className="p-3 whitespace-nowrap">{task.description}</td>
                  <td className="p-3 whitespace-nowrap">{task.startDate}</td>
                  <td className="p-3 whitespace-nowrap">{task.endDate}</td>
                  <td className="p-3 whitespace-nowrap">{task.assignedBy}</td>
                  <td className="p-3 whitespace-nowrap">{task.assignedBy}</td>
                  <td className="p-3 whitespace-nowrap">{task.priority}</td>
                  <td className="p-3 whitespace-nowrap">{task.status}</td>
                </tr>
              ))
            ) : (
              [...Array(8)].map((_, index) => (
                <tr key={index} className="border-b">
                  {[...Array(7)].map((__, colIndex) => (
                    <td key={colIndex} className="p-3">
                      <div className="h-4 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTasksTable;
