import { useEffect, useState } from 'react';
import holidayApi from '../api/holidayApi';

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
  
  const isMatch = (holiday) => {
    const s = searchTerm.toLowerCase();
    return (
      holiday.holidayName.toLowerCase().includes(s) ||
      holiday.day.toLowerCase().includes(s) ||
      new Date(holiday.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).toLowerCase().includes(s) ||
      (holiday.holidayType && holiday.holidayType.toLowerCase().includes(s))
    );
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= today)
    .filter(isMatch)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastHolidays = holidays
    .filter(h => new Date(h.date) < today)
    .filter(isMatch)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const renderTable = (title, data, isUpcoming = true) => {
    if (data.length === 0) {
      return (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {title} ({data.length})
            </h2>
          </div>
          <div className="p-6 text-center text-slate-500 text-sm bg-slate-50/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-slate-500">
                {searchTerm
                  ? `No ${title.toLowerCase()} found matching "${searchTerm}"`
                  : `No ${title.toLowerCase()} available`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            {title} ({data.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/80 backdrop-blur-sm text-slate-800">
                {["Date", "Day", "Holiday Name", "Type", isUpcoming ? "Days Until" : "Days Ago"].map((header, index) => (
                  <th
                    key={index}
                    className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-slate-200 text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((holiday, index) => {
                const holidayDate = new Date(holiday.date);
                holidayDate.setHours(0, 0, 0, 0);
                
                let daysCount;
                let statusClass;
                
                if (isUpcoming) {
                  daysCount = Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
                  statusClass = daysCount === 0 
                    ? "bg-green-100 text-green-800" 
                    : "bg-blue-100 text-blue-800";
                } else {
                  daysCount = Math.ceil((today - holidayDate) / (1000 * 60 * 60 * 24));
                  statusClass = "bg-gray-100 text-gray-800";
                }
                
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-700 font-medium">
                      {holidayDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-3 text-slate-600">{holiday.day}</td>
                    <td className="p-3 text-slate-700 font-medium">{holiday.holidayName}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide bg-purple-100 text-purple-800">
                        {holiday.holidayType || "Holiday"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${statusClass}`}>
                        {daysCount === 0 ? 'Today' : `${daysCount} day${daysCount !== 1 ? 's' : ''} ${isUpcoming ? '' : 'ago'}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
        <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
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