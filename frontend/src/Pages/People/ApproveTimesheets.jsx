import React, { useState, useEffect, useRef } from "react";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight, FaEye } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi"; // Ensure this has getAllTimesheets
import { toast } from "react-toastify";
import TableWithPagination from "../../Components/TableWithPagination";
import ApproveTimesheetViewModal from "../../Components/ApproveTimesheetViewModal";

const ApproveTimesheets = () => {
  // Helper functions defined first
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  }

  function getSunday(date) {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return sunday;
  }

  const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
  const [weeklyData, setWeeklyData] = useState({
    weekStart: getMonday(new Date()).toISOString(),
    weekEnd: getSunday(new Date()).toISOString(),
    timesheets: [], // Pending
    approvedTimesheets: [],
    rejectedTimesheets: [],
    weeklyTotal: 0,
    weeklySubmitted: 0,
    weeklyApproved: 0
  });

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Pending, 1 = Approved

  const calendarRef = useRef(null);

  const tabs = [
    { title: "Pending Timesheets", status: "Pending", count: 0 },
    { title: "Approved Timesheets", status: "Approved", count: 0 }
  ];

  const ensureDate = (date) => {
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  };

  function formatDate(date) {
    const dateObj = ensureDate(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatWeekRange(start, end) {
    const startDate = ensureDate(start);
    const endDate = ensureDate(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "Invalid Date Range";
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  useEffect(() => {
    fetchWeeklyTimesheets();
  }, [selectedWeekStart]);

  const fetchWeeklyTimesheets = async () => {
    setLoading(true);
    try {
      const weekStartObj = ensureDate(selectedWeekStart);
      const weekEndObj = getSunday(weekStartObj);

      // FIX: Use YYYY-MM-DD for the query
      const startStr = weekStartObj.toISOString().split('T')[0];
      const endStr = weekEndObj.toISOString().split('T')[0];

      // FIX: Call the ADMIN endpoint with startDate/endDate
      // Note: Make sure your API wrapper passes these params correctly
      const response = await timesheetApi.getAllTimesheets({ startDate: startStr, endDate: endStr });
      
      // The Admin endpoint returns an ARRAY, not an object.
      const allTimesheets = Array.isArray(response) ? response : (response.timesheets || []);
      
      const pendingTimesheets = allTimesheets.filter(ts => ts.status === "Pending");
      const approvedTimesheets = allTimesheets.filter(ts => ts.status === "Approved");
      const rejectedTimesheets = allTimesheets.filter(ts => ts.status === "Rejected");

      const processedResponse = {
        weekStart: weekStartObj,
        weekEnd: weekEndObj,
        timesheets: pendingTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
        approvedTimesheets: approvedTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
        rejectedTimesheets: rejectedTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
        weeklyTotal: pendingTimesheets.length,
        weeklySubmitted: pendingTimesheets.reduce((sum, ts) => sum + (ts.submittedHours || 0), 0),
        weeklyApproved: approvedTimesheets.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0)
      };

      setWeeklyData(processedResponse);
    } catch (error) {
      console.error("Error loading admin timesheets:", error);
      toast.error("Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  };

  const navigateToPreviousWeek = () => {
    const currentDate = ensureDate(selectedWeekStart);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeekStart(getMonday(newDate));
  };

  const navigateToNextWeek = () => {
    const currentDate = ensureDate(selectedWeekStart);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeekStart(getMonday(newDate));
  };

  const handleWeekSelect = (date) => {
    const selectedDate = ensureDate(date);
    setSelectedWeekStart(getMonday(selectedDate));
    setShowCalendar(false);
  };

  const handleViewDetails = async (timesheet) => {
    try {
      const detailedTimesheet = await timesheetApi.getTimesheetById(timesheet._id);
      setSelectedTimesheet(detailedTimesheet);
      setShowDetails(true);
    } catch (error) {
      console.error("Failed to fetch timesheet details:", error);
      toast.error("Failed to load details");
    }
  };

  const handleStatusChange = async (timesheetId, status, approvedHours = null) => {
    setUpdating(true);
    try {
      const updateData = { status };
      if (approvedHours !== null) updateData.approvedHours = approvedHours;

      await timesheetApi.updateTimesheetStatus(timesheetId, updateData);
      
      // Refresh list after update
      await fetchWeeklyTimesheets();
      
      setShowDetails(false);
      setSelectedTimesheet(null);
      toast.success(`Timesheet ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Failed to update timesheet:", error);
      toast.error("Failed to update timesheet");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = (timesheetId, approvedHours) => handleStatusChange(timesheetId, "Approved", approvedHours);
  const handleReject = (timesheetId) => handleStatusChange(timesheetId, "Rejected", 0);

  // Update tabs counts dynamically based on fetched data
  tabs[0].count = weeklyData.timesheets?.length || 0;
  tabs[1].count = weeklyData.approvedTimesheets?.length || 0;

  const getCurrentData = () => {
    switch (activeTab) {
      case 0: return weeklyData.timesheets || [];
      case 1: return weeklyData.approvedTimesheets || [];
      default: return [];
    }
  };

  const getCurrentActions = () => {
    if (activeTab === 0) {
      return [{
        icon: <FaEye size={14} />,
        title: "View & Approve/Reject",
        className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        onClick: (row) => handleViewDetails(row)
      }];
    } else {
      return [{
        icon: <FaEye size={14} />,
        title: "View Details",
        className: "bg-slate-50 text-slate-600 hover:bg-slate-100",
        onClick: (row) => handleViewDetails(row)
      }];
    }
  };

  const getEmptyMessage = () => {
    const weekRange = formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd);
    return activeTab === 0 
      ? `No pending timesheets for ${weekRange}` 
      : `No approved timesheets for ${weekRange}`;
  };

  const timesheetColumns = [
    {
      key: "employeeName",
      label: "Employee",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
           {row.employee?.avatar ? (
               <img src={row.employee.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
           ) : (
               <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                   {row.employee?.name?.charAt(0) || "U"}
               </div>
           )}
           <span className="text-slate-700 font-medium">{row.employee?.name || row.employeeName || "Unknown"}</span>
        </div>
      )
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => {
        const dateObj = ensureDate(row.date);
        return (
          <span className="text-slate-700 font-medium">
            {isNaN(dateObj.getTime()) ? "Invalid Date" : dateObj.toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            })}
          </span>
        );
      }
    },
    {
      key: "name",
      label: "Timesheet Name",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{row.name || "Unnamed"}</span>
    },
    {
      key: "submittedHours",
      label: "Submitted Hours",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{(row.submittedHours || 0).toFixed(1)}</span>
    },
    {
      key: "approvedHours",
      label: activeTab === 0 ? "To Approve" : "Approved Hours",
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{(row.approvedHours || 0).toFixed(1)}</span>
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
          row.status === "Approved" ? "bg-green-100 text-green-800" : 
          row.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.status || "Pending"}
        </span>
      )
    }
  ];

  return (
    <div className="font-sans text-slate-600">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm inline-flex">
          {tabs.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === index ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.1)]" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item.title}
              {item.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === index ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-3 mb-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="pl-4">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">{tabs[activeTab].title}</h2>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/50 p-1 rounded-xl">
          <button onClick={navigateToPreviousWeek} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
            <FaAngleLeft size={16} />
          </button>

          <div className="relative" ref={calendarRef}>
            <button onClick={() => setShowCalendar(!showCalendar)} disabled={loading} className="h-10 px-4 flex items-center gap-2 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-200 transition-colors min-w-[180px] justify-center">
              <IoCalendarNumberOutline size={18} />
              <span>{formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}</span>
            </button>
            <AnimatePresence>
              {showCalendar && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-white shadow-xl rounded-2xl border border-slate-100 overflow-hidden">
                  <DatePicker selected={ensureDate(selectedWeekStart)} onChange={handleWeekSelect} inline />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={navigateToNextWeek} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <FaAngleRight size={16} />
          </button>
        </div>

        <div className="pr-1">
            <div className="bg-blue-50 text-blue-900 px-5 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                    {activeTab === 0 ? "Submitted Hours:" : "Approved Hours:"}
                </span>
                <span className="text-sm font-extrabold">
                    {activeTab === 0 
                        ? (weeklyData.weeklySubmitted || 0).toFixed(2) 
                        : (weeklyData.approvedTimesheets?.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0) || 0).toFixed(2)
                    }
                </span>
            </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={`${activeTab}-${selectedWeekStart}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium text-slate-500">Loading data...</p>
              </div>
            ) : (
              <TableWithPagination
                columns={timesheetColumns}
                data={getCurrentData()}
                loading={loading}
                emptyMessage={getEmptyMessage()}
                rowsPerPage={10}
                actions={getCurrentActions()}
                onRowClick={(row) => handleViewDetails(row)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showDetails && selectedTimesheet && (
        <ApproveTimesheetViewModal
          timesheet={selectedTimesheet}
          onClose={() => { setShowDetails(false); setSelectedTimesheet(null); }}
          onApprove={activeTab === 0 ? handleApprove : undefined}
          onReject={activeTab === 0 ? handleReject : undefined}
          loading={updating}
          isApprovedTab={activeTab === 1}
        />
      )}
    </div>
  );
};

export default ApproveTimesheets;
