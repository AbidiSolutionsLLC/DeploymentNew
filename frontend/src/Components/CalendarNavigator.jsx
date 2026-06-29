import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

const CalendarNavigator = () => {
 const [selectedDate, setSelectedDate] = useState(new Date());
 const [showPopup, setShowPopup] = useState(false);

 const formatDate = (date) => date.toDateString();

 const handlePrev = () => {
 updateDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
 };

 const handleNext = () => {
 updateDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
 };

 const updateDate = (newDate) => {
 setSelectedDate(newDate);
 setShowPopup(true);
 setTimeout(() => setShowPopup(false), 1500);
 };

 return (
 <div className="flex items-center gap-1 group">
 {/* Navigation & Calendar */}
 <div className="flex items-center bg-surface border border-border-subtle rounded-xl shadow-sm py-1 relative md:py-1 md:px-1 gap-1">
 <button onClick={handlePrev} className="p-1.5 rounded-full border border-border-subtle text-muted hover:text-main hover:bg-app transition-colors active:scale-95">
 <FiChevronLeft className="w-4 h-4" />
 </button>

 <DatePicker
 selected={selectedDate}
 onChange={(date) => updateDate(date)}
 customInput={
 <button className="p-1.5 rounded-full bg-amber-500/10 text-brand-text hover:bg-amber-500/20 transition-colors active:scale-95">
 <FiCalendar className="w-4 h-4" />
 </button>
 }
 popperPlacement="bottom-start"
 popperClassName="z-50"
 portalId="root-portal"
 />

 <button onClick={handleNext} className="p-1.5 rounded-full border border-border-subtle text-muted hover:text-main hover:bg-app transition-colors active:scale-95">
 <FiChevronRight className="w-4 h-4" />
 </button>

 {/* Popup on date change */}
 {/* {showPopup && ( */}
 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 opacity-0 group-hover:opacity-100 transition-opacity md:hidden duration-200 bg-app text-sm text-main px-2 py-1 rounded shadow">
 {formatDate(selectedDate)}
 </div>
 {/* )} */}
 </div>

 {/* Full date only on hover */}
 <span className="hidden md:block text-xs font-bold text-main uppercase tracking-widest px-2">
 {formatDate(selectedDate)}
 </span>
 </div>
 );
};

export default CalendarNavigator;
