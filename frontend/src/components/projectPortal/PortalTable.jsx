import { useMemo, useState } from "react";
import Loader from "../ui/Loader";
import EmptyState from "./EmptyState";
import { compareValues } from "./helpers";

/**
 * Project Portal — the data table (DESIGN §6.8).
 *
 * columns: [{ key, label, render?, sortable?, hideBelow?('sm'|'md'|'lg'|'xl'), align?('right'|'left'), cellClass? }]
 * sort/onSortChange: controlled pair (omit both → internal state seeded by defaultSort)
 * actions: [{ title, icon, danger?, onClick(row) }] — icon buttons, always stopPropagation
 *
 * Guarantees: real <table> inside overflow-x-auto (the ONLY horizontal scroll),
 * column prioritization via hideBelow, client pagination, loading/empty/error states.
 */
const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export default function PortalTable({
  columns = [],
  data = [],
  sort,
  onSortChange,
  defaultSort,
  loading = false,
  error = null,
  onRowClick,
  actions,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 20, 50, 100],
  emptyTitle = "Nothing here yet",
  emptyHint,
  footerNote,
}) {
  const controlled = typeof onSortChange === "function";
  const [internalSort, setInternalSort] = useState(defaultSort || null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(rowsPerPage);

  const activeSort = controlled ? sort || null : internalSort;

  const handleSort = (key) => {
    const next =
      activeSort && activeSort.key === key
        ? { key, direction: activeSort.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" };
    if (controlled) onSortChange(next);
    else setInternalSort(next);
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!activeSort || !activeSort.key) return data;
    const sign = activeSort.direction === "desc" ? -1 : 1;
    return [...data].sort((a, b) => sign * compareValues(a?.[activeSort.key], b?.[activeSort.key]));
  }, [data, activeSort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  const showBody = !loading && !error;
  const hasRows = showBody && pageRows.length > 0;

  return (
    <div className="glass-card !p-0 overflow-hidden">
      {error && (
        <div className="m-4 text-sm text-danger bg-danger-bg border border-danger-border rounded-xl px-4 py-3">
          {String(error)}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-16">
          <Loader text="Loading..." size="md" />
        </div>
      )}

      {showBody && total === 0 && <EmptyState title={emptyTitle} hint={emptyHint} />}

      {hasRows && (
        <div className="overflow-x-auto">
          <table className="w-full text-left align-middle">
            <thead>
              <tr className="bg-card text-[10px] font-black uppercase tracking-widest text-muted">
                {columns.map((col) => {
                  const sortable = col.sortable !== false && !!activeSort?.key;
                  const isActive = activeSort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={`px-4 py-3 whitespace-nowrap ${col.hideBelow ? HIDE[col.hideBelow] : ""} ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          title={`Sort by ${col.label}`}
                          className={`inline-flex items-center gap-1 uppercase transition-colors hover:text-brand-text ${
                            isActive ? "text-brand" : ""
                          }`}
                        >
                          {col.label}
                          <span className="text-[9px]">{isActive ? (activeSort.direction === "asc" ? "▲" : "▼") : "↕"}</span>
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
                {actions && actions.length > 0 && (
                  <th scope="col" className="px-2 py-3 text-right whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-t border-border-subtle hover:bg-amber-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${col.hideBelow ? HIDE[col.hideBelow] : ""} ${
                        col.align === "right" ? "text-right" : ""
                      } ${col.cellClass || ""}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {actions.map((act) => {
                          const ActIcon = act.icon;
                          return (
                            <button
                              key={act.title}
                              type="button"
                              title={act.title}
                              aria-label={act.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                act.onClick(row);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                act.danger
                                  ? "text-danger hover:bg-danger-bg"
                                  : "text-muted hover:bg-card-hover hover:text-heading"
                              }`}
                            >
                              <ActIcon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasRows && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border-subtle bg-card">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
            Showing {start + 1}–{Math.min(start + perPage, total)} of {total}
            {footerNote && <span className="ml-2 text-brand-text normal-case tracking-normal">{footerNote}</span>}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted">
              Per page
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
                className="rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-[11px] font-bold text-heading outline-none focus:border-brand cursor-pointer"
              >
                {rowsPerPageOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="px-3 py-2 rounded-lg border border-border-subtle bg-surface text-xs font-black text-heading transition-colors hover:border-border-accent disabled:opacity-40 disabled:hover:border-border-subtle"
              >
                Prev
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-text tabular-nums">
                {safePage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="px-3 py-2 rounded-lg border border-border-subtle bg-surface text-xs font-black text-heading transition-colors hover:border-border-accent disabled:opacity-40 disabled:hover:border-border-subtle"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
