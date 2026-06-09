import React, { useState, useMemo } from "react";
import DataTable from "./DataTable";
import FilterBar from "./FilterBar";
import TaskStatusDropDown from "./home/TaskStatusDropDown";
import TaskDetailModal from "./TaskDetailModal";

const ProjectTasksTable = ({ tasks, onUpdate, children }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({
    search: '',
    status: 'All'
  });

  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !filterValues.search || (task.name || "").toLowerCase().includes(filterValues.search.toLowerCase());
      const matchesStatus = filterValues.status === 'All' || task.status === filterValues.status;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, filterValues]);

  const columns = [
    { 
      key: "name", 
      label: "Task Name", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); openModal(row); }}
        >
          {val}
        </span>
      )
    },
    { 
      key: "description", 
      label: "Description", 
      sortable: false,
      render: (val) => (
        <span className="truncate max-w-[200px] block" title={val}>
          {val}
        </span>
      )
    },
    { 
      key: "startDate", 
      label: "Start Date", 
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { 
      key: "endDate", 
      label: "End Date", 
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { key: "assignedBy", label: "Assigned By", sortable: true },
    { key: "priority", label: "Priority", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (val, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <TaskStatusDropDown
            status={val}
            onChange={(newStatus) => {
              if (onUpdate) {
                onUpdate(row._id || row.id, { status: newStatus });
              }
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* If parent passes children, usually Top Bar with Add Button */}
      {children && (
        <div className="mb-4">
          {children}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <FilterBar 
            filters={[
              { type: 'search', key: 'search', placeholder: 'Search tasks...' },
              { type: 'select', key: 'status', label: 'Status', options: ['All', 'To Do', 'InProgress', 'UnderReview', 'Completed'] }
            ]}
            values={filterValues}
            onChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
            onReset={() => setFilterValues({ search: '', status: 'All' })}
          />
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <DataTable 
          data={filteredTasks}
          columns={columns}
          loading={false}
          defaultSort={{ key: "endDate", direction: "asc" }}
          onRowClick={(row) => openModal(row)}
        />
      </div>

      {isModalOpen && (
        <TaskDetailModal task={selectedTask} onClose={closeModal} />
      )}
    </div>
  );
};

export default ProjectTasksTable;
