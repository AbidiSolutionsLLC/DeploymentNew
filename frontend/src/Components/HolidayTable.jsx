import { useEffect, useState } from 'react';
import holidayApi from '../api/holidayApi';
import TableWithPagination from './TableWithPagination';

const HolidayTable = ({ holidays: propHolidays, searchTerm = "", refreshKey = 0 }) => {
 const [holidays, setHolidays] = useState(propHolidays || []);
 const [loading, setLoading] = useState(!propHolidays);
 const [errorMsg, setErrorMsg] = useState("");

 useEffect(() => {
 // If holidays are passed as prop, use them
 if (propHolidays) {
 setHolidays(propHolidays);
 setLoading(false);
 } else {
 // Otherwise fetch from API
 fetchHolidays();
 }
 }, [propHolidays, refreshKey]);

 const fetchHolidays = async () => {
 try {
 setLoading(true);
 const data = await holidayApi.getAllHolidays();
 setHolidays(data);
 setErrorMsg("");
 } catch (error) {
 console.error("Error fetching holidays:", error);
 setErrorMsg("Failed to load holidays");
 } finally {
 setLoading(false);
 }
 };

 const today = new Date();
 today.setHours(0, 0, 0, 0);
 
 const extractDate = (dateString) => {
 if (!dateString) return new Date();
 const datePart = dateString.split('T')[0];
 if (datePart.includes('-')) {
 const [year, month, day] = datePart.split('-');
 return new Date(year, month - 1, day);
 }
 return new Date(dateString);
 };
 
 const isMatch = (holiday) => {
 const s = searchTerm.toLowerCase();
 return (
 holiday.holidayName.toLowerCase().includes(s) ||
 holiday.day.toLowerCase().includes(s) ||
 extractDate(holiday.date).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 }).toLowerCase().includes(s) ||
 (holiday.holidayType && holiday.holidayType.toLowerCase().includes(s))
 );
 };

 const upcomingHolidays = holidays
 .filter(h => extractDate(h.date) >= today)
 .filter(isMatch)
 .sort((a, b) => extractDate(a.date) - extractDate(b.date));

 const pastHolidays = holidays
 .filter(h => extractDate(h.date) < today)
 .filter(isMatch)
 .sort((a, b) => extractDate(a.date) - extractDate(b.date))
 .slice(0, 5);

  const getColumns = (isUpcoming) => [
  { 
    key: "date", 
    label: "Date",
    render: (_, row) => {
      const holidayDate = extractDate(row.date);
      return holidayDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
    }
  },
  { key: "day", label: "Day" },
  { 
    key: "holidayName", 
    label: "Holiday Name",
    render: (_, row) => (
      <span className="truncate max-w-[200px]" title={row.holidayName}>
        {row.holidayName}
      </span>
    )
  },
  { 
    key: "holidayType", 
    label: "Type",
    render: (_, row) => (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface border border-border-subtle text-muted shadow-sm">
        {row.holidayType || "Holiday"}
      </span>
    )
  },
  { 
    key: "daysCount", 
    label: isUpcoming ? "Days Until" : "Days Ago",
    render: (_, row) => {
      const holidayDate = extractDate(row.date);
      let daysCount;
      let statusClass;

      if (isUpcoming) {
        daysCount = Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
        statusClass = daysCount === 0
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      } else {
        daysCount = Math.ceil((today - holidayDate) / (1000 * 60 * 60 * 24));
        statusClass = "bg-surface text-muted border border-border-subtle";
      }

      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${statusClass}`}>
          {daysCount === 0 ? 'Today' : `${daysCount} day${daysCount !== 1 ? 's' : ''} ${isUpcoming ? '' : 'ago'}`}
        </span>
      );
    }
  }
  ];

  const renderTable = (title, data, isUpcoming = true) => {
  return (
    <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-main uppercase tracking-wide flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      {title} ({data.length})
      </h2>
    </div>
    <div className="overflow-x-auto">
      <TableWithPagination
      columns={getColumns(isUpcoming)}
      data={data}
      loading={false}
      emptyMessage={searchTerm ? `No ${title.toLowerCase()} found matching "${searchTerm}"` : `No ${title.toLowerCase()} available`}
      rowsPerPage={isUpcoming ? 10 : 5}
      />
    </div>
    </div>
  );
  };

 if (loading) {
 return (
 <div className="p-4 text-center">
 <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
 <p className="mt-2 text-muted text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
 </div>
 );
 }

 if (errorMsg) {
 return (
 <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm font-medium">
 {errorMsg}
 </div>
 );
 }

 return (
 <div className="w-full">
 {renderTable("Upcoming Holidays", upcomingHolidays, true)}
 {renderTable("Recent Past Holidays", pastHolidays, false)}
 </div>
 );
};

export default HolidayTable;