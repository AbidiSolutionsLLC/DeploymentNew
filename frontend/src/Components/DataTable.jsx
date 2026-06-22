import React, { useState } from 'react';
import { 
 ChevronUp, 
 ChevronDown, 
 MoreVertical, 
 SearchX 
} from 'lucide-react';

const DataTable = ({
 columns,
 data,
 loading,
 pagination,
 onRowClick,
 emptyMessage = "No records found",
 rowActions,
}) => {
 const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
 const [activeMenu, setActiveMenu] = useState(null);

 const handleSort = (key) => {
 let direction = 'asc';
 if (sortConfig.key === key && sortConfig.direction === 'asc') {
 direction = 'desc';
 } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
 direction = null;
 key = null;
 }
 setSortConfig({ key, direction });
 };

 const sortedData = React.useMemo(() => {
 if (!sortConfig.key) return data;
 return [...data].sort((a, b) => {
 if (a[sortConfig.key] < b[sortConfig.key]) {
 return sortConfig.direction === 'asc' ? -1 : 1;
 }
 if (a[sortConfig.key] > b[sortConfig.key]) {
 return sortConfig.direction === 'asc' ? 1 : -1;
 }
 return 0;
 });
 }, [data, sortConfig]);

 const toggleMenu = (e, rowIndex) => {
 e.stopPropagation();
 setActiveMenu(activeMenu === rowIndex ? null : rowIndex);
 };

 return (
 <div className="w-full">
 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto rounded-[1.2rem] border border-subtle/60 shadow-md bg-surface">
 <table className="min-w-full text-left border-collapse">
 <thead className="bg-app/80 border-b border-subtle sticky top-0 z-10">
 <tr>
 {columns.map((col, idx) => (
 <th 
 key={idx} 
 className={`p-4 text-xs font-bold text-muted uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-app transition-colors' : ''}`}
 style={{ width: col.width || 'auto' }}
 onClick={() => col.sortable && handleSort(col.key)}
 >
 <div className="flex items-center gap-1">
 {col.label}
 {col.sortable && (
 <span className="flex flex-col">
 <ChevronUp className={`w-3 h-3 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-amber-600' : 'text-slate-300'}`} />
 <ChevronDown className={`w-3 h-3 -mt-1 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-amber-600' : 'text-slate-300'}`} />
 </span>
 )}
 </div>
 </th>
 ))}
 {rowActions && rowActions.length > 0 && (
 <th className="p-4 w-12"></th>
 )}
 </tr>
 </thead>
 <tbody className="bg-surface">
 {loading ? (
 [...Array(5)].map((_, index) => (
 <tr key={index} className="border-b border-slate-100 odd:bg-app">
 {columns.map((__, colIndex) => (
 <td key={colIndex} className="p-4">
 <div className="h-5 bg-slate-200/70 rounded animate-pulse w-3/4" />
 </td>
 ))}
 {rowActions && <td className="p-4"></td>}
 </tr>
 ))
 ) : sortedData?.length > 0 ? (
 sortedData.map((row, index) => (
 <tr 
 key={row._id || row.id || index} 
 className={`border-b border-slate-100 last:border-0 hover:bg-app/80 transition-colors duration-200 ${index % 2 !== 0 ? 'bg-app/30' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
 onClick={() => onRowClick && onRowClick(row)}
 >
 {columns.map((col, colIndex) => (
 <td key={colIndex} className="p-4 text-sm text-muted">
 {col.render ? col.render(row[col.key], row) : row[col.key]}
 </td>
 ))}
 {rowActions && rowActions.length > 0 && (
 <td className="p-4 text-right relative">
 <button 
 onClick={(e) => toggleMenu(e, index)}
 className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-app text-muted hover:text-muted transition-all"
 >
 <MoreVertical className="w-4 h-4" />
 </button>
 {activeMenu === index && (
 <div className="absolute right-8 top-10 z-50 w-52 bg-surface rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200">
 {rowActions.map((action, actionIdx) => (
 <button
 key={actionIdx}
 onClick={(e) => {
 e.stopPropagation();
 setActiveMenu(null);
 action.onClick(row);
 }}
 className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
 action.variant === 'danger' 
 ? 'text-red-600 hover:bg-red-50' 
 : 'text-main hover:bg-app'
 }`}
 >
 {action.icon && <span className="w-4 h-4 flex items-center justify-center">{action.icon}</span>}
 {action.label}
 </button>
 ))}
 </div>
 )}
 </td>
 )}
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-8 text-center">
 <div className="flex flex-col items-center justify-center text-muted">
 <SearchX className="w-12 h-12 mb-2 text-slate-300" />
 <p className="text-sm font-medium">{emptyMessage}</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile Card View */}
 <div className="md:hidden space-y-4">
 {loading ? (
 [...Array(3)].map((_, index) => (
 <div key={index} className="bg-surface border border-subtle rounded-xl p-4 shadow-sm animate-pulse">
 <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
 <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
 <div className="h-4 bg-slate-200 rounded w-1/4"></div>
 </div>
 ))
 ) : sortedData?.length > 0 ? (
 sortedData.map((row, index) => (
 <div 
 key={row._id || row.id || index}
 className="bg-surface border border-subtle rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
 onClick={() => onRowClick && onRowClick(row)}
 >
 {columns.map((col, colIndex) => (
 <div key={colIndex} className="flex justify-between items-start mb-2 last:mb-0">
 <span className="text-xs font-semibold text-muted uppercase">{col.label}</span>
 <div className="text-sm text-main text-right max-w-[60%] break-words">
 {col.render ? col.render(row[col.key], row) : row[col.key]}
 </div>
 </div>
 ))}
 
 {rowActions && rowActions.length > 0 && (
 <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
 {rowActions.map((action, actionIdx) => (
 <button
 key={actionIdx}
 onClick={(e) => {
 e.stopPropagation();
 action.onClick(row);
 }}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border ${
 action.variant === 'danger' 
 ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' 
 : 'border-subtle text-muted bg-surface hover:bg-app'
 }`}
 >
 {action.icon && React.cloneElement(action.icon, { className: 'w-3 h-3' })}
 {action.label}
 </button>
 ))}
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="bg-surface border border-subtle rounded-xl p-8 text-center text-muted">
 <SearchX className="w-10 h-10 mb-2 mx-auto text-slate-300" />
 <p className="text-sm font-medium">{emptyMessage}</p>
 </div>
 )}
 </div>

 {/* Pagination Controls */}
 {pagination && !loading && data?.length > 0 && (
 <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-[1.2rem] border border-white/50 shadow-md">
 <div className="text-sm text-muted">
 Showing <span className="font-semibold text-main">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-main">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-main">{pagination.total}</span> results
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => pagination.onChange(pagination.page - 1, pagination.limit)}
 disabled={pagination.page === 1}
 className="px-4 py-2 bg-app border border-subtle rounded-xl text-xs font-black text-muted hover:text-amber-600 hover:border-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
 >
 Previous
 </button>
 <div className="flex items-center gap-1">
 {[...Array(Math.ceil(pagination.total / pagination.limit))].map((_, i) => {
 const pageNum = i + 1;
 // Simple logic to show current page and neighbors
 if (
 pageNum === 1 || 
 pageNum === Math.ceil(pagination.total / pagination.limit) || 
 Math.abs(pageNum - pagination.page) <= 1
 ) {
 return (
 <button
 key={pageNum}
 onClick={() => pagination.onChange(pageNum, pagination.limit)}
 className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
 pagination.page === pageNum
 ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
 : 'text-muted hover:bg-app hover:text-muted'
 }`}
 >
 {pageNum}
 </button>
 );
 }
 if (Math.abs(pageNum - pagination.page) === 2) {
 return <span key={`ellipsis-${pageNum}`} className="text-muted">...</span>;
 }
 return null;
 })}
 </div>
 <button
 onClick={() => pagination.onChange(pagination.page + 1, pagination.limit)}
 disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
 className="px-4 py-2 bg-app border border-subtle rounded-xl text-xs font-black text-muted hover:text-amber-600 hover:border-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 );
};

export default DataTable;
