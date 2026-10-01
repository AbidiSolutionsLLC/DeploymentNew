import React, { useState, useEffect } from "react";
import { FaAngleLeft, FaAngleRight, FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import Loader from "./ui/Loader";

// ==========================================
// PROTOTYPE SWITCHER & MAIN EXPORT
// ==========================================

const PrototypeSwitcher = ({ currentVariant, setVariant }) => {
  const variants = ['Original', 'Minimal', 'Enterprise'];
  const currentIndex = variants.indexOf(currentVariant) >= 0 ? variants.indexOf(currentVariant) : 0;
  
  const goNext = () => setVariant(variants[(currentIndex + 1) % variants.length]);
  const goPrev = () => setVariant(variants[(currentIndex - 1 + variants.length) % variants.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, variants, setVariant]);
  
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-4 py-2 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700">
      <button onClick={goPrev} className="p-2 hover:bg-slate-700 rounded-full transition-colors">&larr;</button>
      <span className="font-semibold text-sm w-32 text-center tracking-wide">{currentVariant}</span>
      <button onClick={goNext} className="p-2 hover:bg-slate-700 rounded-full transition-colors">&rarr;</button>
    </div>
  );
};

export default function TableWithPagination(props) {
  const [variant, setVariantState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('variant') || 'Original';
  });

  const setVariant = (v) => {
    const url = new URL(window.location);
    url.searchParams.set('variant', v);
    window.history.pushState({}, '', url);
    setVariantState(v);
  };

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setVariantState(params.get('variant') || 'Original');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  let TableComponent = TableWithPaginationOriginal;
  if (variant === 'Minimal') TableComponent = TableWithPaginationMinimal;
  if (variant === 'Enterprise') TableComponent = TableWithPaginationEnterprise;

  return (
    <>
      <TableComponent {...props} />
      <PrototypeSwitcher currentVariant={variant} setVariant={setVariant} />
    </>
  );
}

// ==========================================
// SHARED LOGIC HOOK
// ==========================================
function useTableLogic({ data, rowsPerPage, defaultSort }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage);
  
  useEffect(() => {
    setLocalRowsPerPage(rowsPerPage);
  }, [rowsPerPage]);

  const [sortConfig, setSortConfig] = useState(defaultSort);
  const effectiveRowsPerPage = localRowsPerPage;

  const totalPages = Math.ceil(data.length * 1.0 / effectiveRowsPerPage);
  const startIndex = (currentPage - 1) * effectiveRowsPerPage;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

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

  const currentData = sortedData.slice(startIndex, startIndex + effectiveRowsPerPage);
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return {
    currentPage, localRowsPerPage, setLocalRowsPerPage, sortConfig, effectiveRowsPerPage,
    totalPages, startIndex, handleSort, currentData, goToPage, setCurrentPage
  };
}

// ==========================================
// VARIANT A: ORIGINAL
// ==========================================
const TableWithPaginationOriginal = ({ columns, data = [], loading, error, emptyMessage = "No data found", rowsPerPage = 5, onRowsPerPageChange, onRowClick, actions = [], defaultSort = { key: null, direction: 'asc' } }) => {
  const { currentPage, localRowsPerPage, setLocalRowsPerPage, sortConfig, effectiveRowsPerPage, totalPages, startIndex, handleSort, currentData, goToPage, setCurrentPage } = useTableLogic({ data, rowsPerPage, defaultSort });

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button key={i} onClick={() => goToPage(i)} className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${currentPage === i ? "bg-brand text-on-brand shadow-md shadow-brand/20 border border-transparent" : "bg-surface text-main border border-border-subtle hover:bg-card-hover hover:border-brand/30 shadow-sm"}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  if (loading) return <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border-subtle shadow-sm min-h-[300px]"><Loader size="lg" text="Loading data..." /></div>;
  if (error) return <div className="bg-error-bg border border-error-border rounded-2xl p-6 text-center text-error text-sm font-semibold shadow-sm">{error}</div>;

  return (
    <div className="w-full bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-card border-b border-border-subtle">
              {columns.map((column) => (
                <th key={column.key} className={`px-6 py-4 font-semibold text-xs text-muted uppercase tracking-wider whitespace-nowrap ${column.align === 'right' ? 'text-center' : 'text-left'} ${column.sortable !== false ? 'cursor-pointer hover:text-heading transition-colors group' : ''}`} onClick={() => column.sortable !== false && handleSort(column.key)}>
                  <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-center' : ''}`}>
                    {column.label}
                    {column.sortable !== false && (
                      <span className={`inline-flex flex-col items-center justify-center text-[10px] leading-[0.5] ${sortConfig.key === column.key ? 'text-brand' : 'text-muted/30 group-hover:text-muted/70 transition-colors'}`}>
                        <span className={sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'text-brand' : 'text-inherit'}>▲</span>
                        <span className={sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'text-brand mt-[2px]' : 'text-inherit mt-[2px]'}>▼</span>
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th className="px-6 py-4 font-semibold text-xs text-muted uppercase tracking-wider text-right whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {currentData.length > 0 ? currentData.map((row, rowIndex) => (
              <tr key={row.id || row._id || (startIndex + rowIndex)} className={`group hover:bg-card-hover transition-colors duration-200 ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((column) => <td key={column.key} className="px-6 py-4 text-main font-medium whitespace-nowrap">{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity duration-200">
                      {actions.map((action, idx) => (
                        <button key={idx} onClick={(e) => { e.stopPropagation(); action.onClick(row); }} className={`p-2 rounded-lg transition-all ${typeof action.className === 'function' ? action.className(row) : action.className || 'text-muted hover:bg-brand/10 hover:text-brand'}`} title={action.title}>
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            )) : <tr><td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-16 text-center bg-surface">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-card border-t border-border-subtle">
          <div className="text-sm text-muted font-medium">Showing <span className="text-heading font-semibold">{startIndex + 1}</span> to <span className="text-heading font-semibold">{Math.min(startIndex + effectiveRowsPerPage, data.length)}</span> of <span className="text-heading font-semibold">{data.length}</span> results</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-surface text-main border border-border-subtle hover:bg-card-hover disabled:opacity-50 transition-all shadow-sm"><FaAnglesLeft size={14} /></button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-surface text-main border border-border-subtle hover:bg-card-hover disabled:opacity-50 transition-all shadow-sm"><FaAngleLeft size={14} /></button>
            <div className="flex gap-1.5 px-2">{renderPageNumbers()}</div>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-surface text-main border border-border-subtle hover:bg-card-hover disabled:opacity-50 transition-all shadow-sm"><FaAngleRight size={14} /></button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-surface text-main border border-border-subtle hover:bg-card-hover disabled:opacity-50 transition-all shadow-sm"><FaAnglesRight size={14} /></button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Rows per page</span>
            <select
              value={localRowsPerPage}
              onChange={(e) => {
                const newRowsPerPage = parseInt(e.target.value);
                setLocalRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
                if (onRowsPerPageChange) onRowsPerPageChange(newRowsPerPage);
              }}
              className="text-sm border border-border-subtle rounded-lg px-3 py-1.5 bg-surface font-semibold text-heading outline-none focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer shadow-sm hover:border-brand/30 appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
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

// ==========================================
// VARIANT B: MINIMAL (Modern SaaS)
// ==========================================
const TableWithPaginationMinimal = ({ columns, data = [], loading, error, emptyMessage = "No data found", rowsPerPage = 5, onRowsPerPageChange, onRowClick, actions = [], defaultSort = { key: null, direction: 'asc' } }) => {
  const { currentPage, localRowsPerPage, setLocalRowsPerPage, sortConfig, effectiveRowsPerPage, totalPages, startIndex, handleSort, currentData, goToPage, setCurrentPage } = useTableLogic({ data, rowsPerPage, defaultSort });

  if (loading) return <div className="py-12 text-center"><Loader size="lg" text="Loading..." /></div>;
  if (error) return <div className="py-6 text-center text-red-500">{error}</div>;

  return (
    <div className="w-full flex flex-col font-sans bg-transparent">
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-800">
              {columns.map((column) => (
                <th key={column.key} className={`py-4 pr-6 font-medium text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap ${column.align === 'right' ? 'text-right' : 'text-left'} ${column.sortable !== false ? 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-200' : ''}`} onClick={() => column.sortable !== false && handleSort(column.key)}>
                  <div className={`flex items-center gap-1.5 ${column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.label}
                    {column.sortable !== false && (
                      <span className="text-[10px]">
                        {sortConfig.key === column.key ? (sortConfig.direction === 'asc' ? '↓' : '↑') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th className="py-4 font-medium text-gray-500 dark:text-gray-400 text-sm text-right whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {currentData.length > 0 ? currentData.map((row, rowIndex) => (
              <tr key={row.id || row._id || (startIndex + rowIndex)} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((column) => <td key={column.key} className="py-4 pr-6 text-gray-700 dark:text-gray-300 whitespace-nowrap">{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}
                {actions.length > 0 && (
                  <td className="py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      {actions.map((action, idx) => (
                        <button key={idx} onClick={(e) => { e.stopPropagation(); action.onClick(row); }} className="hover:text-blue-500 transition-colors" title={action.title}>
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            )) : <tr><td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="py-12 text-center text-gray-400">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="flex items-center justify-between pt-6 pb-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{startIndex + 1}-{Math.min(startIndex + effectiveRowsPerPage, data.length)} of {data.length}</div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors font-medium">Previous</button>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors font-medium">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// VARIANT C: ENTERPRISE DENSE (Data Heavy)
// ==========================================
const TableWithPaginationEnterprise = ({ columns, data = [], loading, error, emptyMessage = "No data found", rowsPerPage = 5, onRowsPerPageChange, onRowClick, actions = [], defaultSort = { key: null, direction: 'asc' } }) => {
  const { currentPage, localRowsPerPage, setLocalRowsPerPage, sortConfig, effectiveRowsPerPage, totalPages, startIndex, handleSort, currentData, goToPage, setCurrentPage } = useTableLogic({ data, rowsPerPage, defaultSort });

  if (loading) return <div className="border border-gray-300 p-8 text-center bg-gray-50 dark:bg-gray-900 dark:border-gray-700"><Loader size="md" /></div>;
  if (error) return <div className="border border-red-300 p-4 text-red-700 bg-red-50 text-xs font-bold">{error}</div>;

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 shadow-sm rounded-sm flex flex-col text-[13px] font-sans">
      <div className="w-full overflow-x-auto bg-white dark:bg-slate-900">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-2 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 last:border-r-0 whitespace-nowrap ${column.align === 'right' ? 'text-right' : 'text-left'} ${column.sortable !== false ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700' : ''}`} onClick={() => column.sortable !== false && handleSort(column.key)}>
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.label}
                    {column.sortable !== false && (
                      <span className="text-[9px] text-slate-400">
                        {sortConfig.key === column.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap border-l border-slate-300 dark:border-slate-700 text-center">Act</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentData.length > 0 ? currentData.map((row, rowIndex) => (
              <tr key={row.id || row._id || (startIndex + rowIndex)} className={`even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-none ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((column) => <td key={column.key} className="px-3 py-1.5 text-slate-800 dark:text-slate-300 whitespace-nowrap border-r border-slate-200 dark:border-slate-700 last:border-r-0">{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}
                {actions.length > 0 && (
                  <td className="px-3 py-1.5 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center gap-1">
                      {actions.map((action, idx) => (
                        <button key={idx} onClick={(e) => { e.stopPropagation(); action.onClick(row); }} className="p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm" title={action.title}>
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            )) : <tr><td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="p-4 text-center text-slate-500">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700">
          <div className="text-slate-600 dark:text-slate-400 font-semibold">
            {startIndex + 1} - {Math.min(startIndex + effectiveRowsPerPage, data.length)} of {data.length}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-sm disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600">«</button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-sm disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600">‹</button>
            <span className="px-2 text-slate-700 dark:text-slate-300 font-bold">{currentPage} / {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-sm disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600">›</button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-sm disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600">»</button>
          </div>
        </div>
      )}
    </div>
  );
};