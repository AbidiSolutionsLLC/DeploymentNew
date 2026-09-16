import React from "react";
import { X } from "lucide-react";
import ModernSelect from "./ui/ModernSelect";
import GlassInput from "./ui/GlassInput";
import FilterRow from "./ui/FilterRow";
import DateRangePicker from "./ui/DateRangePicker";

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
 onStartDateChange(null);
 onEndDateChange(null);
 };

 const hasActiveFilters = searchTerm || statusFilter !== "all" || categoryFilter !== "all" || (showUserFilter && selectedUser !== "all") || startDate !== null || endDate !== null;

 return (
 <FilterRow>
 {/* Search */}
 <GlassInput
 placeholder="Search expenses..."
 value={searchTerm}
 onChange={(e) => onSearchChange(e.target.value)}
 className="flex-1 min-w-[160px]"
 />

 {/* Date Range */}
 <DateRangePicker
   startDate={startDate}
   endDate={endDate}
   onChange={(update) => {
     onStartDateChange(update[0]);
     onEndDateChange(update[1]);
   }}
 />

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
 />
 </div>

 {/* User Filter (admin only) */}
 {showUserFilter && (
 <div className="min-w-[160px]">
 <ModernSelect
 value={selectedUser}
 onChange={(e) => onUserChange(e.target.value)}
 options={[
 { value: "all", label: "All Employees" },
 ...users.map(u => ({ value: u._id, label: u.name }))
 ]}
 placeholder="EMPLOYEE"
 />
 </div>
 )}

 {/* Clear Filters */}
 {hasActiveFilters && (
 <button
 onClick={clearFilters}
 className="btn btn-secondary h-[42px] px-3 flex items-center gap-1 text-xs"
 >
 <X size={14} /> Clear
 </button>
 )}
 </FilterRow>
 );
};

export default ExpenseFilters;