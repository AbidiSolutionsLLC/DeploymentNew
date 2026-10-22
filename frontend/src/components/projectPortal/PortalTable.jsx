import GlobalTable from "../ui/GlobalTable";

/**
 * Project Portal table.
 *
 * This is a thin ADAPTER over the shared `StyledTable` — the exact component
 * used by Leave Management and every other admin list — so the project
 * portal renders the same table design as the rest of the app (one
 * component, one look). Previously this was a parallel implementation that
 * kept drifting; now there is a single source of truth.
 *
 * Kept API (so project pages need no changes):
 *   columns: [{ key, label, render, sortable, hideBelow, align, cellClass }]
 *   actions: [{ title, icon: component, danger?, onClick(row) }]
 *   sort / onSortChange: optional controlled sort pair
 *   emptyTitle / emptyHint → GlobalTable emptyMessage / emptyHint
 *
 * Row-action icons stay project-native (Pencil / Trash / Eye) — only the
 * table chrome is shared, per design direction.
 */
const DANGER_ACTION =
  "text-danger bg-surface border border-border-subtle hover:bg-danger-bg hover:border-danger-border hover:shadow-sm";

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
  countLabel = "records",
  emptyTitle = "Nothing here yet",
  emptyHint,
}) {
  const mappedColumns = columns.map((col) => ({
    key: col.key,
    label: col.label,
    align: col.align,
    sortable: col.sortable,
    hideBelow: col.hideBelow,
    type: col.type,
    width: col.width,
    group: col.group,
    headerClassName: col.headerClassName,
    className: col.cellClass,
    render: col.render,
  }));

  const mappedActions = (actions || []).map((act) => {
    const Icon = act.icon;
    return {
      title: act.title,
      onClick: act.onClick,
      className: act.danger ? DANGER_ACTION : undefined,
      icon: <Icon className="w-4 h-4" />,
    };
  });

  return (
    <GlobalTable
      columns={mappedColumns}
      data={data}
      loading={loading}
      error={error}
      onRowClick={onRowClick}
      actions={mappedActions}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      countLabel={countLabel}
      defaultSort={defaultSort || sort || { key: null, direction: "asc" }}
      sort={sort}
      onSortChange={onSortChange}
      emptyMessage={emptyTitle}
      emptyHint={emptyHint}
    />
  );
}
