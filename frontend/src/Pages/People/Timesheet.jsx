import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoCalendarNumberOutline, IoDownloadOutline } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import { toast } from "react-toastify";
import TableWithPagination from "../../Components/TableWithPagination";

const Timesheet = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
  const [weeklyData, setWeeklyData] = useState({
    weekStart: getMonday(new Date()).toISOString(),
    weekEnd: getSunday(new Date()).toISOString(),
    timesheets: [],
    weeklyTotal: 0,
    remainingHours: 40
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calendarRef = useRef(null);

  // Helper functions for week calculations
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getSunday(date) {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  function formatDate(date) {
    // Handle both Date objects and string dates
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatWeekRange(start, end) {
    // Convert strings to Date objects if needed
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return "Invalid Date Range";
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  // Function to ensure date is a Date object
  const ensureDate = (date) => {
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  useEffect(() => {
    fetchWeeklyTimesheets();
  }, [selectedWeekStart]);

  const fetchWeeklyTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure selectedWeekStart is a Date object and format it
      const weekStartDate = ensureDate(selectedWeekStart);
      const weekStartStr = weekStartDate.toISOString().split('T')[0];

      const response = await timesheetApi.getWeeklyTimesheets(weekStartStr);

      // Process the response to ensure dates are properly handled
      const processedResponse = {
        ...response,
        weekStart: response.weekStart ? new Date(response.weekStart) : getMonday(new Date()),
        weekEnd: response.weekEnd ? new Date(response.weekEnd) : getSunday(new Date()),
        timesheets: response.timesheets?.map(timesheet => ({
          ...timesheet,
          date: timesheet.date ? new Date(timesheet.date) : null
        })) || []
      };

      setWeeklyData(processedResponse);
    } catch (error) {
      console.error("Error loading weekly timesheets:", error);
      setError(error.response?.data?.message || "Failed to load timesheets");
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

  const downloadAttachment = async (timesheetId, attachmentId, filename) => {
    try {
      // First, get the timesheet to get the attachment URL
      const timesheet = await timesheetApi.getTimesheetById(timesheetId);
      const attachment = timesheet.attachments?.find(att => att._id === attachmentId);

      if (attachment?.url) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = filename || attachment.originalname;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloading ${filename || attachment.originalname}`);
      } else {
        toast.error("Attachment not found");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    }
  };

  // Safely format timesheet date for display
  const formatTimesheetDate = (date) => {
    const dateObj = ensureDate(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

   const timesheetColumns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-slate-700 font-medium">
          {formatTimesheetDate(row.date)}
        </span>
      )
    },
    {
      key: "name",
      label: "Timesheet Name",
      sortable: true,
      render: (row) => (
        <span className="text-slate-700 font-medium">{row.name || "Unnamed"}</span>
      )
    },
    {
      key: "submittedHours",
      label: "Submitted Hours",
      sortable: true,
      render: (row) => (
        <span className="text-slate-700 font-medium">
          {(row.submittedHours || 0).toFixed(1)}
        </span>
      )
    },
    {
      key: "approvedHours",
      label: "Approved Hours",
      sortable: true,
      render: (row) => (
        <span className="text-slate-700 font-medium">
          {(row.approvedHours || 0).toFixed(1)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${row.status === "Approved"
              ? "bg-green-100 text-green-800"
              : row.status === "Rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
        >
          {row.status || "Pending"}
        </span>
      )
    },
    {
      key: "attachments",
      label: "Attachments",
      sortable: false,
      render: (row) => {
        if (!row.attachments?.length) {
          return <span className="text-slate-400 text-xs">No attachments</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {row.attachments.map((attachment, idx) => (
              <button
                key={attachment._id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAttachment(row._id, attachment._id, attachment.originalname);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                title={`Download ${attachment.originalname}`}
              >
                <IoDownloadOutline size={12} />
                <span className="truncate max-w-[80px]">
                  {attachment.originalname?.split('.').pop().toUpperCase() || "FILE"}
                </span>
              </button>
            ))}
          </div>
        );
      }
    }
  ];

  // In the component return, replace the table with:
  {!loading && !error && (
    <TableWithPagination
      columns={timesheetColumns}
      data={weeklyData.timesheets || []}
      loading={loading}
      error={error}
      emptyMessage={`No timesheets for ${formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}`}
      rowsPerPage={5}
    />
  )}

  return (
    <>
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-2 relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
            Weekly Timesheets
          </h2>

          <div className="flex flex-row items-center gap-3 ">
            <button
              onClick={navigateToPreviousWeek}
              className="p-2.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
              title="Previous Week"
              disabled={loading}
            >
              <FaAngleLeft size={18} />
            </button>

            <div className="relative" ref={calendarRef}>
              <button
                className="px-3 py-2 text-blue-800 bg-blue-100 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition shadow-sm text-sm font-medium"
                onClick={() => setShowCalendar(!showCalendar)}
                disabled={loading}
              >
                <IoCalendarNumberOutline size={18} />
                <span className="text-sm font-medium">
                  {formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}
                </span>
              </button>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 mt-2 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-white/50"
                  >
                    <DatePicker
                      selected={ensureDate(selectedWeekStart)}
                      onChange={handleWeekSelect}
                      dateFormat="MM/dd/yyyy"
                      inline
                      calendarClassName="week-selector"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={navigateToNextWeek}
              className="p-2.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
              title="Next Week"
              disabled={loading}
            >
              <FaAngleRight size={18} />
            </button>


          </div>

          {/* Weekly Hours Summary */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="bg-blue-50 px-3 py-2 rounded-lg shadow-sm">
              <span className="text-xs font-medium text-slate-800">
                Total: <span className="font-bold">{weeklyData.weeklyTotal?.toFixed(1) || 0}h</span>
              </span>
            </div>
            <div className={`px-3 py-2 rounded-lg shadow-sm ${(weeklyData.remainingHours || 0) > 10 ? 'bg-green-50' :
                (weeklyData.remainingHours || 0) > 0 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
              <span className="text-xs font-medium text-slate-800">
                Remaining: <span className="font-bold">{(weeklyData.remainingHours || 0).toFixed(1)}h</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Timesheet Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWeekStart?.getTime?.() || 'default'}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading && (
              <div className="text-center p-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">
                  Loading weekly timesheets...
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-500 p-4 text-center text-sm bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <table className="min-w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                      {[
                        "Date",
                        "Timesheet Name",
                        "Submitted Hours",
                        "Approved Hours",
                        "Status",
                        "Attachments",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="p-4 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.timesheets?.length ? (
                      weeklyData.timesheets.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 text-slate-700 font-medium">
                            {formatTimesheetDate(item.date)}
                          </td>
                          <td className="p-4 text-slate-700 font-medium">{item.name || "Unnamed"}</td>
                          <td className="p-4 text-slate-700 font-medium">
                            {(item.submittedHours || 0).toFixed(1)}
                          </td>
                          <td className="p-4 text-slate-700 font-medium">
                            {(item.approvedHours || 0).toFixed(1)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${item.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              {item.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-4">
                            {item.attachments?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {item.attachments.map((attachment, idx) => (
                                  <button
                                    key={attachment._id || idx}
                                    onClick={() => downloadAttachment(
                                      item._id,
                                      attachment._id,
                                      attachment.originalname
                                    )}
                                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                                    title={`Download ${attachment.originalname}`}
                                    disabled={loading}
                                  >
                                    <IoDownloadOutline size={12} />
                                    <span className="truncate max-w-[100px]">
                                      {attachment.originalname?.split('.').pop().toUpperCase() || "FILE"}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">No attachments</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-500 text-sm"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                            <p className="text-sm font-medium text-slate-500">
                              No timesheets for this week
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default Timesheet;