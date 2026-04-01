import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoCalendarNumberOutline, IoDownloadOutline } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight, FaEye, FaCommentDots } from "react-icons/fa";
import { downloadFile } from "../../utils/downloadFile";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import { toast } from "react-toastify";
import TableWithPagination from "../../Components/TableWithPagination";
import ViewTimesheetModal from "../../Components/ViewTimesheetModal";
import { moment, TIMEZONE } from "../../utils/dateUtils";

const Timesheet = ({ refreshTrigger }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function getSunday(date) {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

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
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatWeekRange(start, end) {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
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
  }, [selectedWeekStart, refreshTrigger]);

  const fetchWeeklyTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Send correct EST string
      const weekStartDate = ensureDate(selectedWeekStart);
      const weekStartStr = moment(weekStartDate).format('YYYY-MM-DD');

      // Backend now returns strictly personal scope by default
      const response = await timesheetApi.getWeeklyTimesheets(weekStartStr);

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
      const timesheet = await timesheetApi.getTimesheetById(timesheetId);
      const attachment = timesheet.attachments?.find(att => att._id === attachmentId);

      if (attachment) {
        // Use the secure download utility with blobName priority
        await downloadFile(
          attachment.blobName || attachment.url || attachment.path, 
          filename || attachment.originalname
        );
      } else {
        toast.error("Attachment not found");
      }
    } catch (error) {
      console.error("Download failed:", error);
      // toast error is handled inside downloadFile
    }
  };

  const handleViewDetails = async (timesheet) => {
    try {
      const detailedTimesheet = await timesheetApi.getTimesheetById(timesheet._id);
      setSelectedTimesheet(detailedTimesheet);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to fetch timesheet details:", error);
      toast.error("Failed to load details");
    }
  };

  const handleCommentAdded = (updatedTimesheet) => {
    // Update the timesheet in the list
    setWeeklyData(prev => ({
      ...prev,
      timesheets: prev.timesheets.map(ts => 
        ts._id === updatedTimesheet._id ? updatedTimesheet : ts
      )
    }));
  };

  // FIX: Display date as UTC to match backend storage
  const formatTimesheetDate = (date) => {
    const dateObj = ensureDate(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
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
      key: "comments",
      label: "Comments",
      sortable: false,
      render: (row) => {
        const commentCount = row.comments?.length || 0;
        if (commentCount === 0) {
          return <span className="text-slate-400 text-xs">No comments</span>;
        }
        return (
          <div className="flex items-center justify-center text gap-1 text-blue-600">
            <FaCommentDots size={14} />
            <span className="text-xs font-medium">{commentCount} {commentCount !== 1 ? 's' : ''}</span>
          </div>
        );
      }
    }
  ];

  const tableActions = [
    {
      icon: <FaEye size={14} />,
      title: "View Details",
      className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      onClick: (row) => handleViewDetails(row)
    }
  ];

  return (
    <>
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
                          className="absolute z-50 mt-2    rounded-xl"
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

      <div>
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
              <TableWithPagination
                columns={timesheetColumns}
                data={weeklyData.timesheets || []}
                loading={loading}
                error={error}
                emptyMessage={`No timesheets for ${formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}`}
                rowsPerPage={5}
                actions={tableActions}
                onRowClick={(row) => handleViewDetails(row)}
                renderTable={(data) => (
                  <table className="min-w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                        {timesheetColumns.map((col) => (
                          <th key={col.key} className="p-4 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          {timesheetColumns.map((col) => (
                            <td key={col.key} className="p-4">
                              {col.render ? col.render(item) : item[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              />
            )}
            
   
          </motion.div>
        </AnimatePresence>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedTimesheet && (
        <ViewTimesheetModal
          timesheet={selectedTimesheet}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTimesheet(null);
          }}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </>
  );
};

export default Timesheet;
