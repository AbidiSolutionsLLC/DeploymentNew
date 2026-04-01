import React from "react";
import { Search, ArrowRight, Filter, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ModernSelect from "./ui/ModernSelect";

const ExpenseFilters = ({
  searchTerm,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  selectedUser,
  onUserChange,
  users,
  showUserFilter = false
}) => {
  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onCategoryFilterChange("all");
    if (showUserFilter) onUserChange("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || categoryFilter !== "all" || (showUserFilter && selectedUser !== "all");

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-4 relative z-10">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary-color/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-hover-surface border border-default rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-light transition-all text-primary-color placeholder:text-primary-color/30"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 bg-hover-surface p-1 rounded-lg border border-default">
          <DatePicker
            selected={startDate}
            onChange={(date) => onStartDateChange(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="w-28 bg-transparent border-none text-xs font-bold text-primary-color/60 outline-none text-center cursor-pointer"
          />
          <ArrowRight size={14} className="text-primary-color/30" />
          <DatePicker
            selected={endDate}
            onChange={(date) => onEndDateChange(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className="w-28 bg-transparent border-none text-xs font-bold text-primary-color/60 outline-none text-center cursor-pointer"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[140px]">
          <ModernSelect
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" }
            ]}
            placeholder="STATUS"
            className="text-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[140px]">
          <ModernSelect
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            options={[
              { value: "all", label: "All Categories" },
              { value: "travel", label: "Travel" },
              { value: "food", label: "Food" },
              { value: "supplies", label: "Supplies" },
              { value: "equipment", label: "Equipment" },
              { value: "other", label: "Other" }
            ]}
            placeholder="CATEGORY"
            className="text-xs"
          />
        </div>

        {/* User Filter (Admin/Superadmin only) */}
        {showUserFilter && (
          <div className="min-w-[160px]">
            <ModernSelect
              value={selectedUser}
              onChange={(e) => onUserChange(e.target.value)}
              options={[
                { value: "all", label: "All Employees" },
                ...users.map(user => ({
                  value: user._id,
                  label: user.name
                }))
              ]}
              placeholder="EMPLOYEE"
              className="text-xs"
            />
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-primary-color/50 hover:text-error transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseFilters;