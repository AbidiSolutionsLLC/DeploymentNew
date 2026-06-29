import React from "react";
import { Search, ArrowRight, X } from "lucide-react";
import { IoCalendarNumberOutline } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ModernSelect from "./ui/ModernSelect";
import GlassInput from "./ui/GlassInput";

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
 <div className="flex flex-wrap items-center gap-3 w-full">
 {/* Search */}
 <GlassInput
 placeholder="Search expenses..."
 value={searchTerm}
 onChange={(e) => onSearchChange(e.target.value)}
 className="flex-1 min-w-[160px]"
 />

 {/* Date Range */}
 <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 py-2 h-[42px]">
 <IoCalendarNumberOutline size={16} className="text-muted flex-shrink-0" />
 <DatePicker
 selected={startDate}
 onChange={(date) => onStartDateChange(date)}
 selectsStart
 startDate={startDate}
 endDate={endDate}
 placeholderText="Start date"
 className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0 !rounded-none !shadow-none"
 />
 <ArrowRight size={12} className="text-muted flex-shrink-0" />
 <DatePicker
 selected={endDate}
 onChange={(date) => onEndDateChange(date)}
 selectsEnd
 startDate={startDate}
 endDate={endDate}
 minDate={startDate}
 placeholderText="End date"
 className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0 !rounded-none !shadow-none"
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
 className="btn btn-primary flex items-center gap-1"
 >
 <X size={14} /> Clear
 </button>
 )}
 </div>
 );
};

export default ExpenseFilters;