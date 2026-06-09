import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "./DataTable";
import FilterBar from "./FilterBar";
import StatusBadge from "./StatusBadge";

const ProjectsTable = ({
  projects,
  loading,
  onUpdate,
  onDelete,
  openModal,
}) => {
  const navigate = useNavigate();
  const [filterValues, setFilterValues] = useState({
    search: '',
    status: 'All'
  });

  const getProgressColor = (percentage) => {
    if (percentage < 40) return "bg-red-500"; 
    if (percentage < 70) return "bg-amber-500"; 
    return "bg-emerald-500"; 
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !filterValues.search || (project.name || "").toLowerCase().includes(filterValues.search.toLowerCase());
      const matchesStatus = filterValues.status === 'All' || project.Status === filterValues.status;
      return matchesSearch && matchesStatus;
    });
  }, [projects, filterValues]);

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { 
      key: "name", 
      label: "Project Name", 
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
          onClick={() => navigate(`/projects/${row.id}`)}
        >
          {val}
        </span>
      )
    },
    { key: "ProjectOwner", label: "Project Owner", sortable: true },
    { key: "NoOfUser", label: "Users", sortable: true },
    { 
      key: "Status", 
      label: "Status", 
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    { 
      key: "StartDate", 
      label: "Start Date", 
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { 
      key: "EndDate", 
      label: "End Date", 
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { 
      key: "completion", 
      label: "Progress", 
      sortable: true,
      render: (val) => {
        const percent = val || 0;
        return (
          <div className="flex items-center gap-2 w-full min-w-[100px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getProgressColor(percent)} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-500 w-8 text-right">{percent}%</span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <FilterBar 
            filters={[
              { type: 'search', key: 'search', placeholder: 'Search projects...' },
              { type: 'select', key: 'status', label: 'Status', options: ['All', 'Active', 'On Hold', 'Completed'] }
            ]}
            values={filterValues}
            onChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
            onReset={() => setFilterValues({ search: '', status: 'All' })}
          />
        </div>
        <button
          onClick={openModal}
          className="btn btn-primary gap-2 shadow-lg shadow-blue-100 shrink-0 w-full sm:w-auto"
        >
          <Plus size={16} strokeWidth={3} /> NEW PROJECT
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <DataTable 
          data={filteredProjects}
          columns={columns}
          loading={loading}
          defaultSort={{ key: "id", direction: "desc" }}
        />
      </div>
    </div>
  );
};

export default ProjectsTable;
