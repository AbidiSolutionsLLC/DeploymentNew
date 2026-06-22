import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Download, RotateCcw, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const FilterBar = ({
 filters,
 values,
 onChange,
 onReset,
 onExport,
 totalResults
}) => {
 const [searchTerm, setSearchTerm] = useState(values.search || '');
 const [mobileExpanded, setMobileExpanded] = useState(false);

 // Debounce search
 useEffect(() => {
 const timer = setTimeout(() => {
 if (searchTerm !== values.search) {
 onChange('search', searchTerm);
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [searchTerm, values.search, onChange]);

 // Sync internal state if external value is cleared
 useEffect(() => {
 if (values.search === '' && searchTerm !== '') {
 setSearchTerm('');
 }
 }, [values.search]);

 const activeFilterCount = Object.keys(values).filter(k => 
 k !== 'search' && 
 values[k] !== undefined && 
 values[k] !== '' && 
 values[k] !== null &&
 values[k] !== 'All'
 ).length;

 return (
 <div className="bg-surface p-5 rounded-[1.2rem] shadow-md border border-white/50 mb-6 flex flex-col gap-5 transition-all">
 {/* Top Row: Search & Actions */}
 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
 
 {/* Search Input */}
 {filters.find(f => f.type === 'search') && (
 <div className="relative w-full md:max-w-md group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-500 transition-colors" />
 <input
 type="text"
 placeholder={filters.find(f => f.type === 'search').placeholder || "Search..."}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-11 pr-10 py-2.5 bg-app border border-subtle rounded-xl text-sm font-medium focus:bg-surface focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none"
 />
 {searchTerm && (
 <button 
 onClick={() => setSearchTerm('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-muted hover:bg-slate-200 hover:text-muted transition-all"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 )}

 {/* Actions & Results Count */}
 <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
 {totalResults !== undefined && (
 <div className="px-3 py-1.5 bg-app rounded-lg border border-slate-100 hidden sm:block">
 <span className="text-[10px] font-black text-muted uppercase tracking-widest">
 {totalResults} {totalResults === 1 ? 'Result' : 'Results'}
 </span>
 </div>
 )}

 <div className="flex items-center gap-2">
 <button
 onClick={() => setMobileExpanded(!mobileExpanded)}
 className="md:hidden btn btn-outline gap-2 px-4 py-2"
 >
 <Filter className="w-4 h-4" />
 <span>Filters</span>
 {activeFilterCount > 0 && (
 <span className="bg-amber-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
 {activeFilterCount}
 </span>
 )}
 </button>

 {onExport && (
 <button
 onClick={onExport}
 className="btn btn-outline gap-2 px-4 py-2"
 >
 <Download className="w-4 h-4" />
 <span className="hidden sm:inline">Export</span>
 </button>
 )}

 {activeFilterCount > 0 && onReset && (
 <button
 onClick={() => {
 setSearchTerm('');
 onReset();
 }}
 className="btn btn-ghost gap-2 px-3 text-muted hover:text-rose-500"
 title="Reset all filters"
 >
 <RotateCcw className="w-4 h-4" />
 <span className="hidden lg:inline">Reset</span>
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Expanded Filters */}
 <div className={`md:flex flex-wrap gap-5 items-end ${mobileExpanded ? 'flex animate-slideInUp' : 'hidden'} pt-4 border-t border-slate-50`}>
 {filters.filter(f => f.type !== 'search').map((filter, idx) => {
 if (filter.type === 'select') {
 return (
 <div key={idx} className="flex flex-col gap-2 w-full sm:w-auto min-w-[160px]">
 {filter.label && <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{filter.label}</label>}
 <div className="relative group">
 <select
 value={values[filter.key] || ''}
 onChange={(e) => onChange(filter.key, e.target.value)}
 className="w-full pl-4 pr-10 py-2.5 bg-surface border border-subtle rounded-xl text-sm font-bold text-main focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none cursor-pointer appearance-none"
 >
 {filter.options.map((opt, i) => {
 const val = typeof opt === 'object' ? opt.value : opt;
 const label = typeof opt === 'object' ? opt.label : opt;
 return <option key={i} value={val}>{label}</option>;
 })}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none group-focus-within:text-amber-500 transition-colors" />
 </div>
 </div>
 );
 }
 if (filter.type === 'dateRange') {
 return (
 <div key={idx} className="flex flex-col gap-2 w-full sm:w-auto">
 {filter.label && <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{filter.label}</label>}
 <div className="flex items-center gap-2 bg-surface border border-subtle rounded-xl p-1 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all">
 <DatePicker
 selected={values[`${filter.key}Start`]}
 onChange={(date) => onChange(`${filter.key}Start`, date)}
 selectsStart
 startDate={values[`${filter.key}Start`]}
 endDate={values[`${filter.key}End`]}
 placeholderText="Start Date"
 className="w-[110px] px-3 py-2 bg-transparent text-sm font-bold text-main outline-none"
 />
 <div className="w-px h-6 bg-app" />
 <DatePicker
 selected={values[`${filter.key}End`]}
 onChange={(date) => onChange(`${filter.key}End`, date)}
 selectsEnd
 startDate={values[`${filter.key}Start`]}
 endDate={values[`${filter.key}End`]}
 minDate={values[`${filter.key}Start`]}
 placeholderText="End Date"
 className="w-[110px] px-3 py-2 bg-transparent text-sm font-bold text-main outline-none"
 />
 </div>
 </div>
 );
 }
 return null;
 })}
 </div>
 </div>
 );
};

export default FilterBar;
