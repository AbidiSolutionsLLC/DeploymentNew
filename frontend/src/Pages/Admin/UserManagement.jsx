import React, { useState, useEffect } from "react";
import CreateUserModal from "../../Components/CreateUserModal";
import CreateDepartmentModal from "../../Components/CreateDepartmentModal";
import DataTable from "../../Components/DataTable";
import FilterBar from "../../Components/FilterBar";
import StatusBadge from "../../Components/StatusBadge";
import { Plus } from "lucide-react";
import UserDetailModal from "../../Components/UserDetailModal";
import api from "../../axios";
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  
  // DataTable & FilterBar state
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState({
    search: '',
    status: 'All',
    department: 'All',
    role: 'All'
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // NOTE: Eventually this should be paginated via the backend.
      // For now, simulating client side filtering based on existing data.
      const [usersRes, deptsRes, meRes] = await Promise.all([
        api.get("/users"),
        api.get("/departments"),
        api.get("/auth/me"),
      ]);

      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setCurrentUser(meRes.data.user);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter the users based on FilterBar values
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        !filterValues.search ||
        user.name?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        user.empID?.toLowerCase().includes(filterValues.search.toLowerCase());
      
      const matchesStatus = filterValues.status === 'All' || user.empStatus === filterValues.status;
      const matchesDept = filterValues.department === 'All' || (user.department?.name || user.department) === filterValues.department;
      const matchesRole = filterValues.role === 'All' || user.role === filterValues.role;

      return matchesSearch && matchesStatus && matchesDept && matchesRole;
    });
  }, [users, filterValues]);

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterValues({
      search: '',
      status: 'All',
      department: 'All',
      role: 'All'
    });
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const handleUserCreated = () => {
    fetchData();
    toast.success("User created successfully");
  };

  const handleDepartmentCreated = () => {
    fetchData();
    setIsDeptModalOpen(false);
    toast.success("Department created successfully");
  };

  const handleUserUpdated = (type = "update") => {
    fetchData();
    toast.success(type === "delete" ? "User deleted successfully" : "User updated successfully");
  };

  const activeUsers = users.filter((u) => u.empStatus === "Active").length;
  const inactiveUsers = users.filter((u) => u.empStatus === "Inactive").length;
  const invitedUsers = users.filter((u) => u.empStatus === "Invited").length;

  const canAddUser = currentUser && ["Super Admin", "Admin"].includes(currentUser.role);

  const columns = [
    { key: 'empID', label: 'ID', sortable: true, render: (val) => `#${val}` },
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true, 
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
            {val ? val.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="font-bold">{val}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Department', sortable: true, render: (val) => val?.name || val || '-' },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'hourlyWage', label: 'Wage', sortable: true, render: (val) => val ? `$${val}` : '-' },
    { key: 'empStatus', label: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
  ];

  const filterConfig = [
    { type: 'search', key: 'search', placeholder: 'Search by name, email, or employee ID...' },
    { type: 'select', key: 'status', label: 'Status', options: ['All', 'Active', 'Inactive', 'Invited', 'Suspended'] },
    { type: 'select', key: 'department', label: 'Department', options: ['All', ...departments.map(d => d.name)] },
    { type: 'select', key: 'role', label: 'Role', options: ['All', 'Admin', 'Manager', 'Employee'] },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-hidden w-full bg-transparent min-h-screen p-4 flex flex-col">
      {/* HEADER */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              User Management
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Manage users, roles, and permissions
            </p>
          </div>

          <div className="flex gap-2">
            {canAddUser && (
              <button
                onClick={() => setIsDeptModalOpen(true)}
                className="btn btn-outline gap-2"
              >
                <Plus className="w-4 h-4" /> Add Department
              </button>
            )}
            {canAddUser && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary gap-2 shadow-lg shadow-blue-100"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            )}
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wide">
          <span className="text-slate-500">Total Users: <span className="text-slate-800">{users.length}</span></span>
          <span className="text-emerald-500">Active: <span className="text-emerald-700">{activeUsers}</span></span>
          <span className="text-rose-500">Inactive: <span className="text-rose-700">{inactiveUsers}</span></span>
          <span className="text-amber-500">Pending Invite: <span className="text-amber-700">{invitedUsers}</span></span>
        </div>
      </div>

      {/* FILTER BAR */}
      <FilterBar 
        filters={filterConfig}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={filteredUsers.length}
      />

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <DataTable 
          columns={columns}
          data={filteredUsers}
          loading={loading}
          onRowClick={handleUserClick}
        />
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onUserCreated={handleUserCreated}
        allDepartments={departments}
        allManagers={users}
      />

      <CreateDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentCreated={handleDepartmentCreated}
        potentialManagers={users}
      />

      <UserDetailModal
        user={selectedUser}
        currentUser={currentUser}
        isOpen={isUserDetailOpen}
        onClose={() => {
          setIsUserDetailOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        allManagers={users}
        allDepartments={departments}
      />
    </div>
  );
};

export default UserManagement;