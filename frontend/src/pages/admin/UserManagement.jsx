import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import api from "../../axios";
import {
  FaPlus,
  FaUsers,
  FaUserCheck,
  FaUserSlash,
  FaClock,
  FaBuilding,
  FaFileCsv,
  FaSyncAlt,
} from "react-icons/fa";
import { UsersIcon } from "@heroicons/react/20/solid";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import CreateUserModal from "../../components/CreateUserModal";
import CreateDepartmentModal from "../../components/CreateDepartmentModal";
import EditDepartmentModal from "../../components/EditDepartmentModal";
import ViewDepartmentModal from "../../components/ViewDepartmentModal";
import UserDetailModal from "../../components/UserDetailModal";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import StatCard from "../../components/ui/StatCard";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
import ModernSelect from "../../components/ui/ModernSelect";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TablePerson,
  TableId,
  TablePill,
  TableRole,
  TableMoney,
  TableStatus,
  TableTitle,
  TableDate,
} from "../../components/ui/TableCells";
import Toast from "../../components/Toast";
import { downloadCsv } from "../../utils/tableUtils";
import { getApiError } from "../../utils/validationUtils";
import { useConfirm } from "../../context/ConfirmContext";

const EASE = [0.16, 1, 0.3, 1];

/* Tab definitions (Leave Management style tab bar) */
const TABS = [
  { key: "all", title: "All Users", icon: FaUsers, hint: "Everyone in the employee directory" },
  { key: "Active", title: "Active", icon: FaUserCheck, hint: "Employees currently active" },
  { key: "Pending", title: "Pending", icon: FaClock, hint: "Invited but not activated yet" },
  { key: "Inactive", title: "Inactive", icon: FaUserSlash, hint: "Deactivated employees" },
  { key: "departments", title: "Departments", icon: FaBuilding, hint: "Organizational units and their members" },
];

const ROLE_ORDER = ["Super Admin", "Admin", "HR", "Manager", "Employee"];

const UserManagement = () => {
  const confirm = useConfirm();
  /* ==================== DATA ==================== */
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ==================== UI STATE ==================== */
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [deptSearch, setDeptSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [isViewDeptModalOpen, setIsViewDeptModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [viewDepartment, setViewDepartment] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, meRes] = await Promise.all([
        api.get("/users"),
        api.get("/departments"),
        api.get("/auth/me"),
      ]);

      const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const deptsArray = Array.isArray(deptsRes.data) ? deptsRes.data : deptsRes.data.data || [];

      setUsers(usersArray);
      setDepartments(deptsArray);
      setCurrentUser(meRes.data.user || meRes.data.data?.user || meRes.data.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showToast(getApiError(error, "Failed to load data"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Manual refresh (shows the button spinner + table loading state) */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  /* ==================== DERIVED COUNTS ==================== */
  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.empStatus === "Active").length,
      inactive: users.filter((u) => u.empStatus === "Inactive").length,
      pending: users.filter((u) => u.empStatus === "Pending").length,
      departments: departments.length,
    }),
    [users, departments]
  );

  const isDeptTab = activeTab === "departments";
  const canAddUser = Boolean(currentUser && ["Super Admin", "Admin", "HR"].includes(currentUser.role));
  const canAddDept = Boolean(currentUser && ["Super Admin", "Global Reader"].includes(currentUser.role));

  /* ==================== FILTER OPTIONS ==================== */
  const roleOptions = useMemo(() => {
    const derived = [...new Set(users.map((u) => u.role).filter(Boolean))];
    const roles = [...new Set([...ROLE_ORDER, ...derived])].sort(
      (a, b) => (ROLE_ORDER.indexOf(a) === -1 ? 99 : ROLE_ORDER.indexOf(a)) -
        (ROLE_ORDER.indexOf(b) === -1 ? 99 : ROLE_ORDER.indexOf(b))
    );
    return [{ value: "all", label: "All Roles" }, ...roles.map((r) => ({ value: r, label: r }))];
  }, [users]);

  const deptOptions = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      ...departments.map((d) => ({ value: d._id, label: d.name })),
    ],
    [departments]
  );

  /* ==================== FILTERED EMPLOYEES ==================== */
  const basePool = useMemo(
    () => (activeTab === "all" ? users : users.filter((u) => u.empStatus === activeTab)),
    [users, activeTab]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return basePool
      .filter((user) => {
        const matchesSearch =
          !q ||
          String(user.name || "").toLowerCase().includes(q) ||
          String(user.email || "").toLowerCase().includes(q) ||
          String(user.empID || "").toLowerCase().includes(q) ||
          String(user.department?.name || "").toLowerCase().includes(q);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesDept = deptFilter === "all" || (user.department?._id || user.department) === deptFilter;
        return matchesSearch && matchesRole && matchesDept;
      })
      .map((u) => ({ ...u, departmentName: u.department?.name || "" }));
  }, [basePool, searchTerm, roleFilter, deptFilter]);

  const hasFilters = Boolean(searchTerm) || roleFilter !== "all" || deptFilter !== "all";

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setDeptFilter("all");
  };

  /* ==================== FILTERED DEPARTMENTS ==================== */
  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    return departments
      .filter((d) => {
        if (!q) return true;
        return (
          String(d.name || "").toLowerCase().includes(q) ||
          String(d.description || "").toLowerCase().includes(q) ||
          String(d.manager?.name || "").toLowerCase().includes(q)
        );
      })
      .map((d) => ({
        ...d,
        managerName: d.manager?.name || "",
        memberCount: users.filter((u) => (u.department?._id || u.department) === d._id).length,
      }));
  }, [departments, users, deptSearch]);

  const hasDeptFilters = Boolean(deptSearch);

  const resetDeptFilters = () => setDeptSearch("");

  /* ==================== HANDLERS ==================== */
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const handleUserCreated = () => {
    fetchData();
  };

  const handleDepartmentCreated = () => {
    fetchData();
    showToast("Department created successfully");
  };

  const handleDepartmentUpdated = () => {
    fetchData();
    showToast("Department updated successfully");
  };

  const handleEditDepartment = useCallback((dept) => {
    setSelectedDepartment(dept);
    setIsEditDeptModalOpen(true);
  }, []);

  const handleViewDepartment = useCallback((dept) => {
    setViewDepartment(dept);
    setIsViewDeptModalOpen(true);
  }, []);

  const handleDeleteDepartment = useCallback((dept) => {
    confirm({
      title: "Delete Department",
      message: `Delete "${dept.name}" department? This will also remove sub-departments and unassign members.`,
      confirmText: "Delete",
      onConfirmAction: async () => {
        try {
          await api.delete(`/departments/${dept._id}`);
          fetchData();
          showToast("Department deleted successfully");
        } catch (error) {
          showToast(getApiError(error, "Failed to delete department"), "error");
          throw error;
        }
      },
    });
  }, [confirm, fetchData, showToast]);

  const handleUserUpdated = (type = "update") => {
    fetchData();
    // The modal already reports deletes itself — avoid stacking two toasts
    if (type !== "delete") showToast("User updated successfully");
  };

  /* ==================== CSV EXPORT ==================== */
  const exportUsersCsv = () => {
    if (filteredUsers.length === 0) {
      showToast("No data to download", "error");
      return;
    }
    downloadCsv(
      `employees_${activeTab === "all" ? "directory" : activeTab.toLowerCase()}.csv`,
      ["Employee ID", "Name", "Email", "Department", "Role", "Wage", "Status"],
      filteredUsers.map((u) => [
        u.empID || "",
        u.name || "",
        u.email || "",
        u.departmentName || "",
        u.role || "",
        u.hourlyWage ? `$${u.hourlyWage}` : "",
        u.empStatus || "",
      ])
    );
    showToast("Employee list exported");
  };

  const exportDepartmentsCsv = () => {
    if (filteredDepartments.length === 0) {
      showToast("No data to download", "error");
      return;
    }
    downloadCsv(
      "departments.csv",
      ["Department", "Description", "Head", "Members"],
      filteredDepartments.map((d) => [d.name || "", d.description || "", d.managerName || "", d.memberCount])
    );
    showToast("Departments exported");
  };

  /* ==================== TABLE COLUMNS ==================== */
  const userColumns = useMemo(
    () => [
      {
        key: "__index",
        label: "S.No.",
        sortable: false,
        type: "index",
        className: "text-muted text-xs font-bold",
      },
      {
        key: "name",
        label: "Employee",
        render: (value, row) => (
          <TablePerson
            name={value}
            subtitle={row.designation || row.email || "Employee"}
            className="min-w-[180px]"
          />
        ),
      },
      {
        key: "empID",
        label: "Employee ID",
        render: (value) => <TableId value={value} />,
      },
      {
        key: "departmentName",
        label: "Department",
        render: (value) => <TablePill>{value}</TablePill>,
      },
      {
        key: "role",
        label: "Role",
        render: (value) => <TableRole value={value} />,
      },
      {
        key: "hourlyWage",
        label: "Wage",
        render: (value) => <TableMoney value={value} decimals={0} />,
      },
      {
        key: "empStatus",
        label: "Status",
        render: (value) => <TableStatus value={value} />,
      },
    ],
    []
  );

  const departmentColumns = useMemo(
    () => [
      {
        key: "__index",
        label: "S.No.",
        sortable: false,
        type: "index",
        className: "text-muted text-xs font-bold",
      },
      {
        key: "name",
        label: "Department",
        render: (value, row) => (
          <TableTitle
            title={value}
            subtitle={row.description || "No description"}
            leading={
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center flex-shrink-0">
                <FaBuilding size={13} />
              </div>
            }
          />
        ),
      },
      {
        key: "managerName",
        label: "Head",
        render: (value) =>
          value ? (
            <TablePerson name={value} size="xs" />
          ) : (
            <span className="text-muted text-xs italic">Unassigned</span>
          ),
      },
      {
        key: "memberCount",
        label: "Members",
        render: (value) => (
          <TablePill tone="info" icon={<FaUsers size={10} />}>
            {value}
          </TablePill>
        ),
      },
      {
        key: "createdAt",
        label: "Created",
        render: (value) => <TableDate value={value} />,
      },
    ],
    []
  );

  const deptTableActions = useMemo(() => [
    {
      icon: <PencilIcon className="w-4 h-4" />,
      title: "Edit department",
      onClick: (row) => handleEditDepartment(row),
      className:
        "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-brand-text hover:border-border-accent hover:shadow-sm",
    },
    {
      icon: <EyeIcon className="w-4 h-4" />,
      title: "View department",
      onClick: (row) => handleViewDepartment(row),
      className:
        "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-brand-text hover:border-border-accent hover:shadow-sm",
    },
    {
      icon: <TrashIcon className="w-4 h-4" />,
      title: "Delete department",
      onClick: (row) => handleDeleteDepartment(row),
      className:
        "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-rose-500 hover:border-rose-400 hover:shadow-sm",
    },
  ], [handleEditDepartment, handleViewDepartment, handleDeleteDepartment]);

  const tableActions = [
    {
      icon: <PencilIcon className="w-4 h-4" />,
      title: "View / edit employee",
      onClick: (row) => handleUserClick(row),
      className:
        "p-2 rounded-lg text-muted bg-surface border border-border-subtle hover:text-brand-text hover:border-border-accent hover:shadow-sm",
    },
  ];

  /* ==================== TAB BAR MODEL ==================== */
  const tabItems = TABS.map((t) => {
    if (t.key === "Active") return { ...t, badge: counts.active };
    if (t.key === "Pending") return { ...t, badge: counts.pending };
    if (t.key === "Inactive") return { ...t, badge: counts.inactive };
    if (t.key === "departments") return { ...t, badge: counts.departments };
    return t;
  });


  /* ==================== RENDER ==================== */
  return (
    <>
      <PageContainer isCard={false}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="flex flex-col gap-4 w-full">
          {/* ============ HERO (Leave Management style) ============ */}
          <PortalHero
                label="User management overview"
              title="User Management"
            description="Manage employees, roles and departments — invite users, track statuses and keep your org structure in sync from one place."
            chips={[
              { icon: FaUsers, value: counts.total, label: " Employees" },
              { pulse: true, value: counts.pending, label: " Pending invites" },
            ]}
          />

          {/* ============ TAB BAR (Leave Management style) ============ */}
          <PortalTabBar
            tabs={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
            idPrefix="users-tab"
            panelId="users-tabpanel"
            ariaLabel="User management sections"
            layoutId="um-tab-pill"
            right={
              <>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn btn-primary w-full lg:w-auto flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
                  title="Refresh user data"
                >
                  <FaSyncAlt size={13} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
                {canAddDept && (
                  <GlassButton variant="secondary" size="sm" icon={FaPlus} onClick={() => setIsDeptModalOpen(true)}>
                    Department
                  </GlassButton>
                )}
                {canAddUser && (
                  <GlassButton variant="primary" size="sm" icon={FaPlus} onClick={() => setIsModalOpen(true)}>
                    Add User
                  </GlassButton>
                )}
              </>
            }
          />

          {/* Tab content — remount on change so it fades in fresh */}
          <Motion.div
            key={activeTab}
            id="users-tabpanel"
            role="tabpanel"
            aria-labelledby={`users-tab-${TABS.findIndex((t) => t.key === activeTab)}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
            className="flex flex-col gap-4"
          >
            {/* ============ KPI CARDS ============ */}
            <div className="lm-stagger grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Total Users"
                value={counts.total}
                sub="In directory"
                icon={FaUsers}
                tone="text-main"
                iconBg="bg-app"
              />
              <StatCard
                title="Active"
                value={counts.active}
                sub="Currently active"
                icon={FaUserCheck}
                tone="text-emerald-600 dark:text-emerald-400"
                iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              />
              <StatCard
                title="Pending"
                value={counts.pending}
                sub="Awaiting activation"
                icon={FaClock}
                tone="text-amber-600 dark:text-amber-400"
                iconBg="bg-amber-100 dark:bg-amber-900/40"
              />
              <StatCard
                title="Inactive"
                value={counts.inactive}
                sub="Deactivated"
                icon={FaUserSlash}
                tone="text-rose-600 dark:text-rose-400"
                iconBg="bg-rose-100 dark:bg-rose-900/40"
              />
              <StatCard
                title="Departments"
                value={counts.departments}
                sub="Org units"
                icon={FaBuilding}
                tone="text-sky-600 dark:text-sky-400"
                iconBg="bg-sky-100 dark:bg-sky-900/40"
              />
            </div>

            {!isDeptTab ? (
              <>
                {/* ============ EMPLOYEE FILTERS ============ */}
                <FilterPanel
                  title="Employee Directory"
                  subtitle={`${filteredUsers.length} of ${basePool.length} ${
                    activeTab === "all" ? "employees" : activeTab.toLowerCase()
                  } shown`}
                  hint="Switch status from the tabs above, then narrow by role or department. Click any row to view or edit an employee."
                  actions={
                    <>
                      {hasFilters && (
                        <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                          RESET
                        </GlassButton>
                      )}
                      <GlassButton variant="secondary" size="sm" icon={FaFileCsv} onClick={exportUsersCsv}>
                        EXPORT CSV
                      </GlassButton>
                    </>
                  }
                >
                  <FilterRow>
                    <GlassInput
                      placeholder="Search by name, email, ID or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 min-w-[220px]"
                    />
                    <div className="min-w-[140px]">
                      <ModernSelect
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        options={roleOptions}
                        placeholder="All Roles"
                      />
                    </div>
                    <div className="min-w-[160px]">
                      <ModernSelect
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        options={deptOptions}
                        placeholder="All Departments"
                      />
                    </div>
                  </FilterRow>
                </FilterPanel>

                {/* ============ EMPLOYEE TABLE ============ */}
                <GlobalTable
                  columns={userColumns}
                  data={filteredUsers}
                  loading={loading}
                  emptyMessage={hasFilters ? "No employees match these filters" : "No users found"}
                  onEmptyAction={hasFilters ? resetFilters : undefined}
                  emptyActionLabel="Clear all filters"
                  onRowClick={handleUserClick}
                  actions={tableActions}
                  rowsPerPage={10}
                  defaultSort={{ key: "createdAt", direction: "desc" }}
                  countLabel="employees"
                />
              </>
            ) : (
              <>
                {/* ============ DEPARTMENT FILTERS ============ */}
                <FilterPanel
                  title="Departments"
                  subtitle={`${filteredDepartments.length} of ${counts.departments} departments shown`}
                  hint="Review the org structure — member counts come straight from the employee directory."
                  actions={
                    <>
                      {hasDeptFilters && (
                        <GlassButton variant="ghost" size="sm" onClick={resetDeptFilters}>
                          RESET
                        </GlassButton>
                      )}
                      <GlassButton variant="secondary" size="sm" icon={FaFileCsv} onClick={exportDepartmentsCsv}>
                        EXPORT CSV
                      </GlassButton>
                    </>
                  }
                >
                  <FilterRow>
                    <GlassInput
                      placeholder="Search by department, head or description..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="flex-1 min-w-[220px]"
                    />
                  </FilterRow>
                </FilterPanel>

                {/* ============ DEPARTMENT TABLE ============ */}
                <GlobalTable
                  columns={departmentColumns}
                  data={filteredDepartments}
                  loading={loading}
                  emptyMessage={hasDeptFilters ? "No departments match this search" : "No departments found"}
                  onEmptyAction={
                    hasDeptFilters
                      ? resetDeptFilters
                      : canAddDept
                      ? () => setIsDeptModalOpen(true)
                      : undefined
                  }
                  emptyActionLabel={hasDeptFilters ? "Clear search" : "Add department"}
                  rowsPerPage={10}
                  defaultSort={{ key: "name", direction: "asc" }}
                  countLabel="departments"
                  actions={deptTableActions}
                />
              </>
            )}
          </Motion.div>
        </div>
      </PageContainer>

      {/* ============ MODALS ============ */}
      <CreateUserModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onUserCreated={handleUserCreated}
        allDepartments={departments}
        allManagers={users}
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

      <CreateDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentCreated={handleDepartmentCreated}
        potentialManagers={users}
      />

      <EditDepartmentModal
        isOpen={isEditDeptModalOpen}
        onClose={() => {
          setIsEditDeptModalOpen(false);
          setSelectedDepartment(null);
        }}
        onDepartmentUpdated={handleDepartmentUpdated}
        department={selectedDepartment}
        potentialManagers={users}
      />

      <ViewDepartmentModal
        isOpen={isViewDeptModalOpen}
        onClose={() => {
          setIsViewDeptModalOpen(false);
          setViewDepartment(null);
        }}
        department={viewDepartment}
        users={users}
      />
    </>
  );
};

export default UserManagement;
