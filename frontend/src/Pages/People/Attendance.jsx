import React, { useState, useEffect } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { IoCalendarNumberOutline } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUmbrellaBeach,
  FaRegClock,
  FaBusinessTime,
  FaInfoCircle,
  FaRegCalendarAlt,
  FaTimes
} from "react-icons/fa";
import { STATUS_VARIANTS, resolveStatusVariant } from "../../components/StatusBadge";
import api from "../../axios";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";

const StatusBadge = ({ status }) => {
 const statusConfig = {
 Present: { icon: <FaCheckCircle className="mr-1" /> },
 Absent: { icon: <FaTimesCircle className="mr-1" /> },
 "Half Day": { icon: <FaClock className="mr-1" /> },
 Leave: { icon: <FaUmbrellaBeach className="mr-1" /> },
 Holiday: { icon: <FaBusinessTime className="mr-1" /> }
 };
 const variant = resolveStatusVariant(status);

 return (
 <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${STATUS_VARIANTS[variant]?.badge || "bg-surface text-heading"}`}>
 {statusConfig[status]?.icon || <FaRegClock className="mr-1" />}
 {status}
 </span>
 );
};

const formatTime = (dateString) => {
 if (!dateString) return null;
 const date = new Date(dateString);
 return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Attendance = () => {
 const today = new Date();
 const [weekStart, setWeekStart] = useState(() => {
 const start = new Date(today);
 const dayOfWeek = start.getDay();
 const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
 start.setDate(diff);
 return start;
 });

 const [selectedDate, setSelectedDate] = useState(today);
 const [showCalendar, setShowCalendar] = useState(false);
 const [selectedDay, setSelectedDay] = useState(null);
 const [expandedView, setExpandedView] = useState(false);
 const [attendanceData, setAttendanceData] = useState([]);
 const [loading, setLoading] = useState(false);
 const [selectedAbsentDay, setSelectedAbsentDay] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const fetchAttendanceData = async (startDate) => {
 try {
 setLoading(true);
 
 const startMonth = startDate.getMonth() + 1;
 const startYear = startDate.getFullYear();

 // Find if week ends in a different month
 const endDate = new Date(startDate);
 endDate.setDate(endDate.getDate() + 6);
 
 const endMonth = endDate.getMonth() + 1;
 const endYear = endDate.getFullYear();

 // The backend is now strictly filtered to return ONLY the current user's data
 const response1 = await api.get(`/timetrackers/attendance/${startMonth}/${startYear}`);
 let allData = response1.data?.data || response1.data;

 // If week spans two months, fetch the second month as well and combine
 if (startMonth !== endMonth || startYear !== endYear) {
 const response2 = await api.get(`/timetrackers/attendance/${endMonth}/${endYear}`);
 const data2 = response2.data?.data || response2.data;
 allData = [...allData, ...data2];
 }

 setAttendanceData(allData);
 } catch (error) {
 toast.error("Failed to load attendance data");
 console.error("Error fetching attendance:", error);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchAttendanceData(weekStart);
 }, [weekStart]);

 const generateWeeklyData = (startOfWeek) => {
 const days = [];
 const now = new Date();
 now.setHours(0, 0, 0, 0);

 for (let i = 0; i < 7; i++) {
 const day = new Date(startOfWeek);
 day.setDate(startOfWeek.getDate() + i);
 day.setHours(0, 0, 0, 0);

 const dayData = attendanceData.find(d => {
 const recordDate = new Date(d.date);
 
 // FIX: Removed strict ID check because backend already filters by user.
 // We only need to match the date now.
 return (
 recordDate.getUTCFullYear() === day.getFullYear() &&
 recordDate.getUTCMonth() === day.getMonth() &&
 recordDate.getUTCDate() === day.getDate()
 );
 });

 if (dayData) {
 days.push({
 date: day.getDate(),
 dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
 fullDate: day.toDateString(),
 status: dayData.status,
 checkIn: formatTime(dayData.checkInTime),
 checkOut: formatTime(dayData.checkOutTime),
 totalHours: dayData.totalHours || 0,
 notes: dayData.notes,
 });
 } else if (day > now) {
 days.push({
 date: day.getDate(),
 dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
 fullDate: day.toDateString(),
 status: "Upcoming",
 checkIn: null,
 checkOut: null,
 totalHours: 0,
 notes: null,
 });
 } else {
 days.push({
 date: day.getDate(),
 dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
 fullDate: day.toDateString(),
 status: "Absent",
 checkIn: null,
 checkOut: null,
 totalHours: 0,
 notes: "No attendance record",
 });
 }
 }
 return days;
 };

 const weeklyData = generateWeeklyData(weekStart);

 const formatWeekRange = () => {
 const start = new Date(weekStart);
 const end = new Date(start);
 end.setDate(start.getDate() + 6);
 return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
 };

 const navigateToPreviousPeriod = () => {
 const newStart = new Date(weekStart);
 newStart.setDate(newStart.getDate() - 7);
 setWeekStart(newStart);
 setSelectedDay(null);
 };

 const navigateToNextPeriod = () => {
 const newStart = new Date(weekStart);
 newStart.setDate(newStart.getDate() + 7);
 setWeekStart(newStart);
 setSelectedDay(null);
 };

 const handleDateChange = (date) => {
 setSelectedDate(date);
 setShowCalendar(false);
 const dayOfWeek = date.getDay();
 const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
 const newStart = new Date(date);
 newStart.setDate(diff);
 setWeekStart(newStart);
 };

 const toggleDayDetails = (index, day) => {
 if (day.status === "Absent") {
 setSelectedAbsentDay(day);
 setIsModalOpen(true);
 }
 setSelectedDay(selectedDay === index ? null : index);
 };

 return (
 <>
 <PageContainer
 title="Attendance"
 loading={loading}
 headerActions={
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
 <button
 onClick={() => setExpandedView(!expandedView)}
 className="text-xs text-muted flex items-center gap-1 hover:text-heading transition-colors font-medium mr-4"
 >
 <FaInfoCircle size={14} />
 {expandedView ? "Compact view" : "Detailed view"}
 </button>
 <div className="flex flex-row items-center gap-3">
 <button
 onClick={navigateToPreviousPeriod}
 className="btn-ghost p-2.5 rounded-lg text-muted"
 >
 <FaAngleLeft size={18} />
 </button>

 <div className="relative">
 <button
 className="px-3 bg-surface rounded-lg flex items-center gap-2 hover:bg-hover btn btn-secondary"
 onClick={() => setShowCalendar(!showCalendar)}
 >
 <IoCalendarNumberOutline size={18} className="text-muted" />
 <span className="text-sm font-medium">{formatWeekRange()}</span>
 <FaRegCalendarAlt size={14} className="text-muted" />
 </button>

 {showCalendar && (
 <div className="absolute z-[100] mt-2 right-0 sm:left-0 bg-surface dark:bg-slate-800 shadow-2xl rounded-xl border border-border-subtle p-2">
 <DatePicker
 selected={selectedDate}
 onChange={handleDateChange}
 open={showCalendar}
 onClickOutside={() => setShowCalendar(false)}
 />
 </div>
 )}
 </div>

 <button
 onClick={navigateToNextPeriod}
 className="btn-ghost p-2.5 rounded-lg text-muted"
 >
 <FaAngleRight size={18} />
 </button>
 </div>
 </div>
 }
 bottomWidgets={
 <div className="p-4 flex flex-wrap justify-between items-center gap-4">
 <div className="flex items-center">
 <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
 <span className="text-xs font-medium text-heading uppercase tracking-wide">
 {weeklyData.filter((d) => d.status === "Present").length} Present
 </span>
 </div>
 <div className="flex items-center">
 <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
 <span className="text-xs font-medium text-heading uppercase tracking-wide">
 {weeklyData.filter((d) => d.status === "Absent").length} Absent
 </span>
 </div>
 <div className="flex items-center">
 <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
 <span className="text-xs font-medium text-heading uppercase tracking-wide">
 {weeklyData.filter((d) => d.status === "Half Day").length} Half Day
 </span>
 </div>
 <div className="flex items-center">
 <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
 <span className="text-xs font-medium text-heading uppercase tracking-wide">
 {weeklyData.filter((d) => d.status === "Leave").length} Leave
 </span>
 </div>
 </div>
 }
 >
 <div className="relative p-2 w-full">
 <div className="absolute left-20 top-0 h-full w-0.5 bg-border-subtle transform translate-x-1/2"></div>
 <div className="space-y-4">
 {weeklyData.map((day, index) => (
 <div
 key={index}
 className="relative flex items-start group transition-all duration-150"
 >
 <div className={`absolute left-[66px] top-6 h-4 w-4 rounded-full transform translate-x-1/2 z-10 border-2 border-surface ${
 day.status === "Present" ? "bg-green-500" :
 day.status === "Absent" ? "bg-red-500" :
 day.status === "Half Day" ? "bg-yellow-500" :
 day.status === "Leave" ? "bg-amber-500" : "bg-purple-500"
 } ${new Date(day.fullDate).toDateString() === today.toDateString() ? "animate-pulse shadow-lg" : ""}`}></div>

 <div className="flex-shrink-0 w-20 text-center pt-1">
 <div className={`text-xs text-muted font-medium uppercase tracking-wide ${day.dayName === 'Sat' || day.dayName === 'Sun' ? 'text-amber-600' : ''}`}>
 {day.dayName}
 </div>
 <div className={`text-xl font-bold mt-1 ${day.dayName === 'Sat' || day.dayName === 'Sun' ? 'text-amber-800' : 'text-heading'} ${
 new Date(day.fullDate).toDateString() === today.toDateString() ? "text-amber-600" : ""
 }`}>
 {day.date}
 </div>
 </div>

 <div
 className={`flex-grow ml-8 p-4 bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
 selectedDay === index ? "border-amber-300 shadow-md bg-amber-50/80" : "border-border-subtle hover:border-border-subtle"
 } border`}
 onClick={() => toggleDayDetails(index, day)}
 >
 <div className="flex justify-between items-start">
 <StatusBadge status={day.status} />

 {day.totalHours > 0 && (
 <div className="text-base font-bold text-heading flex items-center">
 <span className="text-xs font-normal text-muted mr-1">Total:</span>
 {day.totalHours} <span className="text-xs font-normal text-muted ml-1">hrs</span>
 </div>
 )}
 </div>

 {(day.checkIn || day.checkOut) && (
 <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-main">
 {day.checkIn && (
 <div className="flex items-center">
 <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
 <span className="font-medium">In:</span> <span className="font-mono ml-1">{day.checkIn}</span>
 </div>
 )}
 {day.checkOut && (
 <div className="flex items-center">
 <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
 <span className="font-medium">Out:</span> <span className="font-mono ml-1">{day.checkOut}</span>
 </div>
 )}
 </div>
 )}

 {expandedView && (
 <div className="mt-3 text-sm text-muted">
 {day.notes && (
 <div className="flex items-start">
 <span className="text-muted mr-2">•</span>
 <span>{day.notes}</span>
 </div>
 )}
 {day.status === "Present" && (
 <div className="flex items-start mt-1">
 <span className="text-muted mr-2">•</span>
 <span>Regular working day</span>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </PageContainer>

  {isModalOpen && selectedAbsentDay && (
    <GlassModal
      isOpen={true}
      onClose={() => setIsModalOpen(false)}
      maxWidth="max-w-sm"
      title={
        <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
          <FaTimesCircle /> Absence Reason
        </h3>
      }
      footer={
        <div className="flex justify-end w-full">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="mb-5">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Date</p>
        <p className="text-sm font-bold text-heading">{selectedAbsentDay.fullDate}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Reason / Notes</p>
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-sm text-rose-800 font-medium whitespace-pre-wrap shadow-sm">
          {selectedAbsentDay.notes || "No reason specified."}
        </div>
      </div>
    </GlassModal>
  )}
 </>
 );
};

export default Attendance;
