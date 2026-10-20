import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarDay,
  FaCalendarPlus,
  FaCalendarCheck,
  FaClock,
  FaHistory,
  FaExclamationTriangle,
  FaFileCsv,
  FaPlus,
} from "react-icons/fa";
import holidayApi from "../../api/holidayApi";
import FilterRow from "../ui/FilterRow";
import GlassInput from "../ui/GlassInput";
import ModernSelect from "../ui/ModernSelect";
import GlassButton from "../ui/GlassButton";
import AddHolidayModal from "../AddHolidayModal";
import { getApiError } from "../../utils/validationUtils";
import { formatDisplayDate, parseISOToLocalDate, getTodayESTString } from "../../utils/dateUtils";
import { downloadCsv } from "../../utils/tableUtils";
import StatCard from "../ui/StatCard";
import FilterPanel from "../ui/FilterPanel";
import GlobalTable from "../ui/GlobalTable";
import { TablePill, TableText, TableTitle } from "../ui/TableCells";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Holidays tab — shared by the admin Leave Management portal and the
 * people-portal Leave Tracker.
 *
 * Props:
 *   canManage  → show the "Add Holidays" action + modal (admin only, default true)
 *   title      → filter panel heading
 *   context    → subtitle suffix ("company-wide" by default)
 *   hint       → optional hint line override
 *   refreshKey → bump to force a re-fetch of the holiday list
 */
export default function HolidaysTab({
  showToast,
  canManage = true,
  title = "Holidays & Leave Calendar",
  context = "company-wide",
  hint,
  refreshKey = 0,
}) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timingFilter, setTimingFilter] = useState("all");

  const [isOpen, setIsOpen] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await holidayApi.getAllHolidays();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load holidays:", err);
      setError(true);
      showToast?.(getApiError(err, "Failed to load holidays"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays, refreshKey]);

  const handleHolidayAdded = () => {
    showToast?.("Holiday added successfully");
    fetchHolidays();
    setIsOpen(false);
  };

  /* ---------------- rows ---------------- */
  const rows = useMemo(() => {
    const today = parseISOToLocalDate(getTodayESTString());
    return holidays.map((h) => {
      const holidayDate = parseISOToLocalDate(h.date);
      const daysUntil = Math.round((holidayDate - today) / DAY_MS);
      return {
        ...h,
        id: h._id || h.id,
        name: h.holidayName || "-",
        type: h.holidayType || "Holiday",
        displayDate: formatDisplayDate(h.date, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dayNum: holidayDate.getDate(),
        monthAbbr: holidayDate.toLocaleString("en-US", { month: "short" }),
        daysUntil,
        isUpcoming: daysUntil >= 0,
        isThisMonth:
          holidayDate.getMonth() === today.getMonth() &&
          holidayDate.getFullYear() === today.getFullYear(),
      };
    });
  }, [holidays]);

  /* ---------------- filters ---------------- */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        String(r.day || "").toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.displayDate.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesTiming =
        timingFilter === "all" ||
        (timingFilter === "upcoming" && r.isUpcoming) ||
        (timingFilter === "past" && !r.isUpcoming);
      return matchesSearch && matchesType && matchesTiming;
    });
  }, [rows, search, typeFilter, timingFilter]);

  const typeOptions = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return [
      { value: "all", label: "All Types" },
      ...Object.keys(counts).map((t) => ({ value: t, label: t })),
    ];
  }, [rows]);

  const timingOptions = useMemo(() => {
    return [
      { value: "all", label: "All Holidays" },
      { value: "upcoming", label: "Upcoming" },
      { value: "past", label: "Past" },
    ];
  }, []);

  const hasFilters = search || typeFilter !== "all" || timingFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setTimingFilter("all");
  };

  /* ---------------- KPIs (reflect active filters) ---------------- */
  const kpis = useMemo(
    () => ({
      total: filteredRows.length,
      upcoming: filteredRows.filter((r) => r.isUpcoming).length,
      thisMonth: filteredRows.filter((r) => r.isThisMonth).length,
      past: filteredRows.filter((r) => !r.isUpcoming).length,
    }),
    [filteredRows]
  );

  /* ---------------- CSV export ---------------- */
  const exportCsv = () => {
    const header = ["S.No.", "Holiday Name", "Date", "Day", "Type", "Description", "Recurring", "Timing"];
    const rowsCsv = filteredRows.map((r, i) => [
      i + 1,
      r.name,
      r.date,
      r.day,
      r.type,
      r.description || "",
      r.isRecurring ? "Yes" : "No",
      r.daysUntil === 0 ? "Today" : r.daysUntil > 0 ? `In ${r.daysUntil} days` : `${-r.daysUntil} days ago`,
    ]);
    downloadCsv(`holidays-${new Date().toISOString().slice(0, 10)}.csv`, header, rowsCsv);
    showToast?.("Holidays exported");
  };

  /* ---------------- table ---------------- */
  const columns = useMemo(
    () => [
      {
        key: "__index",
        label: "S.No.",
        sortable: false,
        type: "index",
        className: "text-muted text-xs font-bold",
      },
      {
        key: "date",
        label: "Date",
        render: (_, row) => (
          <TableTitle
            title={row.displayDate}
            maxWidth="min-w-[170px]"
            leading={
              <div className="w-11 h-11 rounded-xl bg-app border border-border-subtle shadow-sm flex flex-col items-center justify-center leading-none flex-shrink-0">
                <span className="text-[15px] font-black text-heading">{row.dayNum}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-brand-text mt-1">
                  {row.monthAbbr}
                </span>
              </div>
            }
          />
        ),
      },
      {
        key: "day",
        label: "Day",
        render: (value) => <TableText value={value} />,
      },
      {
        key: "holidayName",
        label: "Holiday",
        render: (_, row) => (
          <TableTitle
            title={row.name}
            subtitle={row.isRecurring ? "Repeats every year" : row.description || "One-time holiday"}
            maxWidth="max-w-[260px]"
          />
        ),
      },
      {
        key: "holidayType",
        label: "Type",
        render: (_, row) => <TablePill>{row.type}</TablePill>,
      },
      {
        key: "daysUntil",
        label: "Timing",
        align: "center",
        render: (_, row) => {
          const label =
            row.daysUntil === 0
              ? "Today"
              : row.daysUntil > 0
              ? `In ${row.daysUntil} day${row.daysUntil === 1 ? "" : "s"}`
              : `${-row.daysUntil} day${row.daysUntil === -1 ? "" : "s"} ago`;
          return <TablePill>{label}</TablePill>;
        },
      },
    ],
    []
  );

  /* ---------------- render ---------------- */
  if (error) {
    return (
      <div className="glass-card text-center py-14">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
          <FaExclamationTriangle size={22} className="text-danger" />
        </div>
        <p className="text-sm font-bold text-heading">Failed to load holidays</p>
        <p className="text-xs text-muted mt-1 mb-5">
          We couldn't load the holiday calendar. Please try again.
        </p>
        <GlassButton variant="primary" onClick={fetchHolidays}>
          RETRY
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ============ KPI CARDS ============ */}
      <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Holidays"
          value={kpis.total}
          sub="Company-wide calendar"
          icon={FaCalendarDay}
          tone="text-main"
          iconBg="bg-app"
        />
        <StatCard
          title="Upcoming"
          value={kpis.upcoming}
          sub="Today and beyond"
          icon={FaCalendarPlus}
          tone="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-100 dark:bg-amber-900/40"
        />
        <StatCard
          title="This Month"
          value={kpis.thisMonth}
          sub="In the current month"
          icon={FaCalendarCheck}
          tone="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
        />
        <StatCard
          title="Past"
          value={kpis.past}
          sub="Already observed"
          icon={FaHistory}
          tone="text-rose-600 dark:text-rose-400"
          iconBg="bg-rose-100 dark:bg-rose-900/40"
        />
      </div>

      {/* ============ FILTERS ============ */}
      <FilterPanel
        title={title}
        subtitle={`${filteredRows.length} of ${rows.length} holidays · ${context}`}
        hint={hint || "Holidays apply to every employee and are excluded from leave day calculations"}
        actions={
          <>
            {hasFilters && (
              <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                RESET
              </GlassButton>
            )}
            <GlassButton variant="primary" size="sm" icon={FaFileCsv} onClick={exportCsv}>
              EXPORT CSV
            </GlassButton>
            {canManage && (
              <GlassButton variant="primary" size="sm" icon={FaPlus} onClick={() => setIsOpen(true)}>
                ADD HOLIDAYS
              </GlassButton>
            )}
          </>
        }
      >
        <FilterRow>
          <GlassInput
            placeholder="Search holiday name, day, date or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <div className="min-w-[170px]">
            <ModernSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>
          <div className="min-w-[150px]">
            <ModernSelect
              value={timingFilter}
              onChange={(e) => setTimingFilter(e.target.value)}
              options={timingOptions}
              placeholder="All Holidays"
            />
          </div>
        </FilterRow>
      </FilterPanel>

      {/* ============ TABLE ============ */}
      <GlobalTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        emptyMessage={hasFilters ? "No holidays match these filters" : "No holidays scheduled"}
        emptyIcon={<FaClock className="w-7 h-7 text-muted" />}
        onEmptyAction={hasFilters ? resetFilters : undefined}
        emptyActionLabel="Clear all filters"
        rowsPerPage={10}
        defaultSort={{ key: "date", direction: "asc" }}
        countLabel="holidays"
      />

      {/* ============ ADD HOLIDAY MODAL ============ */}
      {canManage && (
        <AddHolidayModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          onHolidayAdded={handleHolidayAdded}
        />
      )}
    </div>
  );
}
