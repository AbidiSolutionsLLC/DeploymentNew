import React, { useState } from "react";
import { FaAngleLeft, FaAngleRight, FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";

const TableWithPagination = ({
 columns,
 data,
 loading,
 error,
 emptyMessage = "No data found",
 rowsPerPage = 5,
 onRowsPerPageChange,
 onRowClick,
 actions = []
}) => {
 const [currentPage, setCurrentPage] = useState(1);
 const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage);
 
 React.useEffect(() => {
 setLocalRowsPerPage(rowsPerPage);
 }, [rowsPerPage]);

 const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

 const effectiveRowsPerPage = localRowsPerPage;

 // Calculate pagination
 const totalPages = Math.ceil(data.length * 1.0 / effectiveRowsPerPage);
 const startIndex = (currentPage - 1) * effectiveRowsPerPage;
 const paginatedData = data.slice(startIndex, startIndex + effectiveRowsPerPage);

 // Handle sort
 const handleSort = (key) => {
 let direction = 'asc';
 if (sortConfig.key === key && sortConfig.direction === 'asc') {
 direction = 'desc';
 }
 setSortConfig({ key, direction });
 };

 // Sort data if sortConfig is set
 const sortedData = [...data];
 if (sortConfig.key) {
 sortedData.sort((a, b) => {
 const aValue = a[sortConfig.key];
 const bValue = b[sortConfig.key];
 
 if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
 if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
 return 0;
 });
 }

 // Pagination controls
 const goToPage = (page) => {
 if (page >= 1 && page <= totalPages) {
 setCurrentPage(page);
 }
 };

 const renderPageNumbers = () => {
 const pages = [];
 const maxPagesToShow = 5;
 
 let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
 let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
 
 if (endPage - startPage + 1 < maxPagesToShow) {
 startPage = Math.max(1, endPage - maxPagesToShow + 1);
 }
 
 for (let i = startPage; i <= endPage; i++) {
 pages.push(
 <button
 key={i}
 onClick={() => goToPage(i)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${currentPage === i
 ? "bg-amber-500/20 text-amber-900 border-amber-500/30 shadow-inner"
 : "bg-surface text-amber-800 hover:bg-surface border-white/60 hover:shadow-md"
 }`}
 >
 {i}
 </button>
 );
 }
 
 return pages;
 };

 if (loading) {
 return (
 <div className="text-center p-6 bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
 <p className="mt-3 text-amber-900 text-xs font-bold uppercase tracking-wide">Loading...</p>
 </div>
 );
 }

 if (error) {
 return (
 <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-center text-red-700 text-sm font-semibold">
 {error}
 </div>
 );
 }

 return (
 <div className="w-full overflow-x-auto custom-scrollbar">
 <table className="min-w-full text-sm border-separate border-spacing-0">
 <thead>
 <tr className="bg-surface text-amber-900">
 {columns.map((column, idx) => (
 <th
 key={column.key}
 className={`p-4 font-black text-[10px] uppercase tracking-widest border-b border-white/50 text-left ${column.sortable !== false ? 'cursor-pointer hover:bg-surface transition-colors' : ''} ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === columns.length - 1 && actions.length === 0 ? 'rounded-tr-xl' : ''}`}
 onClick={() => column.sortable !== false && handleSort(column.key)}
 >
 <div className="flex items-center gap-1">
 {column.label}
 {column.sortable !== false && sortConfig.key === column.key && (
 <span className="text-amber-600 font-bold">
 {sortConfig.direction === 'asc' ? '↑' : '↓'}
 </span>
 )}
 </div>
 </th>
 ))}
 {actions.length > 0 && (
 <th className="p-4 font-black text-[10px] uppercase tracking-widest border-b border-white/50 text-left rounded-tr-xl">
 Actions
 </th>
 )}
 </tr>
 </thead>
 <tbody className="bg-surface ">
 {paginatedData.length > 0 ? (
 sortedData.slice(startIndex, startIndex + effectiveRowsPerPage).map((row, rowIndex) => (
 <tr
 key={row._id || rowIndex}
 className={`border-b border-white/30 hover:bg-surface transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
 onClick={() => onRowClick && onRowClick(row)}
 >
 {columns.map((column) => (
 <td key={column.key} className="p-4 border-b border-white/30 text-main font-medium">
 {column.render ? column.render(row[column.key], row) : row[column.key]}
 </td>
 ))}
 {actions.length > 0 && (
 <td className="p-4 border-b border-white/30">
 <div className="flex gap-2">
 {actions.map((action, idx) => (
 <button
 key={idx}
 onClick={(e) => {
 e.stopPropagation();
 action.onClick(row);
 }}
 className={`p-2 rounded-xl transition-all shadow-sm ${typeof action.className === 'function' ? action.className(row) : (action.className || 'bg-surface text-muted hover:bg-surface hover:text-amber-600 hover:shadow-md')}`}
 title={action.title}
 >
 {action.icon}
 </button>
 ))}
 </div>
 </td>
 )}
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="p-12 text-center text-amber-700/60 text-sm bg-surface ">
 <div className="flex flex-col items-center gap-3">
 <div className="p-4 bg-surface rounded-full shadow-inner">
 <svg className="w-8 h-8 text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
 </svg>
 </div>
 <p className="text-sm font-bold text-amber-800/60 uppercase tracking-widest">{emptyMessage}</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>

 {/* Pagination Controls */}
 {data.length > effectiveRowsPerPage && (
 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 bg-surface rounded-xl border border-white/60 shadow-sm">
 <div className="text-xs text-amber-900 font-bold tracking-wide">
 Showing {startIndex + 1} to {Math.min(startIndex + effectiveRowsPerPage, data.length)} of {data.length} entries
 </div>
 
 <div className="flex items-center gap-2">
 <button
 onClick={() => goToPage(1)}
 disabled={currentPage === 1}
 className="p-2 rounded-xl bg-surface text-amber-800 hover:bg-surface hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 title="First Page"
 >
 <FaAnglesLeft size={14} />
 </button>
 
 <button
 onClick={() => goToPage(currentPage - 1)}
 disabled={currentPage === 1}
 className="p-2 rounded-xl bg-surface text-amber-800 hover:bg-surface hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 title="Previous Page"
 >
 <FaAngleLeft size={14} />
 </button>
 
 <div className="flex gap-1">
 {renderPageNumbers()}
 </div>
 
 <button
 onClick={() => goToPage(currentPage + 1)}
 disabled={currentPage === totalPages}
 className="p-2 rounded-xl bg-surface text-amber-800 hover:bg-surface hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 title="Next Page"
 >
 <FaAngleRight size={14} />
 </button>
 
 <button
 onClick={() => goToPage(totalPages)}
 disabled={currentPage === totalPages}
 className="p-2 rounded-xl bg-surface text-amber-800 hover:bg-surface hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 title="Last Page"
 >
 <FaAnglesRight size={14} />
 </button>
 </div>
 
 <div className="flex items-center gap-2">
 <span className="text-[10px] uppercase tracking-widest font-black text-amber-700">Rows per page:</span>
 <select
 value={localRowsPerPage}
 onChange={(e) => {
 const newRowsPerPage = parseInt(e.target.value);
 setLocalRowsPerPage(newRowsPerPage);
 setCurrentPage(1);
 if (onRowsPerPageChange) onRowsPerPageChange(newRowsPerPage);
 }}
 className="text-xs border border-white/60 rounded-xl px-3 py-1.5 bg-surface font-bold text-amber-900 outline-none focus:ring-2 focus:ring-amber-200 transition-all cursor-pointer shadow-sm hover:bg-surface"
 >
 {[5, 10, 20, 50, 100].map(num => (
 <option key={num} value={num}>{num}</option>
 ))}
 </select>
 </div>
 </div>
 )}
 </div>
 );
};

export default TableWithPagination;