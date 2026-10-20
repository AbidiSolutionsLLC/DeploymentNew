import React, { useState, useEffect } from "react";
import {
  FaAdjust,
  FaAngleLeft,
  FaAngleRight,
  FaCalendarDay,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaRegCalendarAlt,
  FaTimesCircle,
} from "react-icons/fa";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../axios";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import GlassButton from "../../components/ui/GlassButton";
import GlassModal from "../../components/ui/GlassModal";
import { formatDisplayDate } from "../../utils/dateUtils";
import "../../styles/attendancePage.css";

const STATUS_ACCENT = {
  Present: { color: "#10B981" },
  Absent: { color: "#F43F5E" },
  "Half Day": { color: "#F59E0B" },
  Leave: { color: "#8B5CF6" },
  Upcoming: { color: "#0EA5E9" },
  Holiday: { color: "#06B6D4" },
  Weekend: { color: "#64748B" },
};

const LEGEND = ["Present", "Half Day", "Absent", "Leave", "Upcoming", "Holiday", "Weekend"];

const formatTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

const LiveTimer = ({ startTime, className = "" }) => {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      if (diff < 0) return setDuration("00:00:00");
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className={`font-mono font-bold tracking-wider tabular-nums ${className}`}>
      {duration}
    </span>
  );
};

const Attendance = () => {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const start = new Date(today);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
  });

  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAbsentDay, setSelectedAbsentDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAttendanceData = async (startDate) => {
    try {
      setLoading(true);

      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear();

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();

      const response1 = await api.get(
        `/timetrackers/attendance/${startMonth}/${startYear}`
      );
      let allData = response1.data?.data || response1.data;

      if (startMonth !== endMonth || startYear !== endYear) {
        const response2 = await api.get(
          `/timetrackers/attendance/${endMonth}/${endYear}`
        );
        const data2 = response2.data?.data || response2.data;
        allData = [...allData, ...data2];
      }

      setAttendanceData(allData);
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(weekStart);
  }, [weekStart]);

  const generateWeeklyData = (startOfWeek) => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      day.setHours(0, 0, 0, 0);

      const dayData = attendanceData.find((d) => {
        const recordDate = new Date(d.date);
        return (
          recordDate.getUTCFullYear() === day.getFullYear() &&
          recordDate.getUTCMonth() === day.getMonth() &&
          recordDate.getUTCDate() === day.getDate()
        );
      });

      const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;

      if (dayData && (!isWeekendDay || (dayData.status && dayData.status !== "Absent"))) {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          isoDate: day.toISOString().split("T")[0],
          status: isWeekendDay && dayData.status === "Absent" ? "Weekend" : dayData.status,
          checkIn: formatTime(dayData.checkInTime),
          checkOut: formatTime(dayData.checkOutTime),
          checkInRaw: dayData.checkInTime,
          checkOutRaw: dayData.checkOutTime,
          totalHours: dayData.totalHours || 0,
          notes: dayData.notes,
          isToday: day.toDateString() === today.toDateString(),
        });
      } else if (isWeekendDay) {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          isoDate: day.toISOString().split("T")[0],
          status: "Weekend",
          checkIn: null,
          checkOut: null,
          checkInRaw: null,
          checkOutRaw: null,
          totalHours: 0,
          notes: "Weekend",
          isToday: day.toDateString() === today.toDateString(),
        });
      } else if (day > now) {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          isoDate: day.toISOString().split("T")[0],
          status: "Upcoming",
          checkIn: null,
          checkOut: null,
          checkInRaw: null,
          checkOutRaw: null,
          totalHours: 0,
          notes: null,
          isToday: day.toDateString() === today.toDateString(),
        });
      } else {
        days.push({
          date: day.getDate(),
          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: day.toDateString(),
          isoDate: day.toISOString().split("T")[0],
          status: "Absent",
          checkIn: null,
          checkOut: null,
          checkInRaw: null,
          checkOutRaw: null,
          totalHours: 0,
          notes: "No attendance record",
          isToday: day.toDateString() === today.toDateString(),
        });
      }
    }
    return days;
  };

  const weeklyData = generateWeeklyData(weekStart);

  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const navigateToPreviousPeriod = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
    setSelectedDay(null);
  };

  const navigateToNextPeriod = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
    setSelectedDay(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const newStart = new Date(date);
    newStart.setDate(diff);
    setWeekStart(newStart);
  };

  const toggleDayDetails = (index, day) => {
    if (day.status === "Absent") {
      setSelectedAbsentDay(day);
      setIsModalOpen(true);
    }
    setSelectedDay(selectedDay === index ? null : index);
  };

  /* ============ WEEK STATS ============ */
  const counts = {
    present: weeklyData.filter((d) => d.status === "Present").length,
    absent: weeklyData.filter((d) => d.status === "Absent").length,
    halfDay: weeklyData.filter((d) => d.status === "Half Day").length,
    leave: weeklyData.filter((d) => d.status === "Leave").length,
  };
  const totalHours = weeklyData.reduce((sum, d) => sum + (d.totalHours || 0), 0);
  const workDays = counts.present + counts.halfDay + counts.leave;
  const attendancePct =
    workDays + counts.absent > 0
      ? Math.round((workDays / (workDays + counts.absent)) * 100)
      : 0;

  const activeDay =
    selectedDay != null ? weeklyData[selectedDay] : weeklyData.find((d) => d.isToday) || weeklyData[0];

  const activeAccent = STATUS_ACCENT[activeDay?.status] || STATUS_ACCENT.Upcoming;
  const weekNo = getWeekNumber(weekStart);

  const readoutCells = [
    { label: "Present", value: counts.present, color: STATUS_ACCENT.Present.color, icon: FaCheckCircle },
    { label: "Half day", value: counts.halfDay, color: STATUS_ACCENT["Half Day"].color, icon: FaAdjust },
    { label: "Absent", value: counts.absent, color: STATUS_ACCENT.Absent.color, icon: FaTimesCircle },
    { label: "On leave", value: counts.leave, color: STATUS_ACCENT.Leave.color, icon: FaCalendarDay },
    { label: "Total hours", value: totalHours.toFixed(1), color: "#3B82F6", icon: FaClock },
  ];

  /* Same KPI icon tile as every other page (StatCard → .lm-kpi-icon):
     gradient fill, rotating dashed emblem ring + conic glow, tinted
     by the cell's status colour. */
  const kpiTileStyle = (color) => {
    const accent = color || "var(--color-brand-primary)";
    return {
      "--att-cell-accent": accent,
      "--lm-accent": accent,
      "--lm-grad": `linear-gradient(135deg, color-mix(in srgb, ${accent} 70%, #ffffff) 0%, ${accent} 100%)`,
    };
  };

  return (
    <>
      <PageContainer isCard={false} loading={loading}>
        <div className="flex flex-col gap-4 w-full">
          {/* ============ HERO (kept as-is) ============ */}
          <PortalHero
              label="Attendance overview"
            title="My Attendance"
            description="Your weekly check-ins, working hours and leave days — laid out clearly, day by day."
            chips={[
              { icon: FaCheckCircle, value: counts.present, label: " present" },
              { icon: FaClock, value: `${totalHours.toFixed(1)}h`, label: " logged" },
              { pulse: true, value: `${attendancePct}%`, label: " attendance" },
            ]}
          />

          <div className="att-page">
            {/* ============ TOOLBAR ============ */}
            <div className="att-toolbar att-fade">
              <div className="att-toolbar__kicker">
                <span>Week {String(weekNo).padStart(2, "0")} / {weekStart.getFullYear()}</span>
                <span className="att-kicker__rule" />
                <span className="att-range">{formatWeekRange()}</span>
              </div>

              <div className="att-ctrl">
                <button
                  type="button"
                  className="att-btn"
                  aria-pressed={expandedView}
                  onClick={() => setExpandedView(!expandedView)}
                >
                  {expandedView ? "Compact" : "Detailed"}
                </button>
                <span className="att-btn-wrap">
                  <button
                    type="button"
                    className="att-btn"
                    onClick={() => setShowCalendar(!showCalendar)}
                    aria-expanded={showCalendar}
                  >
                    <span className="cal-chip" aria-hidden="true">
                      <FaRegCalendarAlt />
                    </span>
                    Jump to
                  </button>
                  {showCalendar && (
                    <div className="att-pop">
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        open={showCalendar}
                        onClickOutside={() => setShowCalendar(false)}
                        inline
                      />
                    </div>
                  )}
                </span>
                <button
                  type="button"
                  className="att-btn att-btn--icon"
                  onClick={navigateToPreviousPeriod}
                  aria-label="Previous week"
                >
                  <FaAngleLeft />
                </button>
                <button
                  type="button"
                  className="att-btn att-btn--icon"
                  onClick={navigateToNextPeriod}
                  aria-label="Next week"
                >
                  <FaAngleRight />
                </button>
              </div>
            </div>

            {/* ============ READOUT STRIP (no stat cards) ============ */}
            <section
              className="att-readout att-fade"
              style={{ animationDelay: "70ms" }}
              aria-label="Weekly summary"
            >
              {readoutCells.map((cell) => (
                <div
                  className="att-cell"
                  key={cell.label}
                  style={kpiTileStyle(cell.color)}
                >
                  <div className="att-cell__row">
                    <div className="min-w-0 flex-1">
                      <p className="att-cell__label">{cell.label}</p>
                      <p className="att-cell__value">{cell.value}</p>
                    </div>
                    <span className="lm-kpi-icon">
                      <span className="lm-glow" aria-hidden="true" />
                      <cell.icon size={18} />
                    </span>
                  </div>
                </div>
              ))}
              <div className="att-cell att-cell--pct" style={kpiTileStyle("#14B8A6")}>
                <div className="att-cell__row">
                  <div className="min-w-0 flex-1">
                    <p className="att-cell__label">Attendance</p>
                    <p className="att-cell__value">{attendancePct}%</p>
                  </div>
                  <span className="lm-kpi-icon">
                    <span className="lm-glow" aria-hidden="true" />
                    <FaChartLine size={18} />
                  </span>
                </div>
                <div className="att-segbar" aria-hidden="true">
                  {weeklyData.map((d, i) => (
                    <span
                      key={i}
                      className="att-seg"
                      title={`${d.dayName}: ${d.status}`}
                      style={{
                        background: (STATUS_ACCENT[d.status] || STATUS_ACCENT.Upcoming).color,
                        opacity: d.status === "Upcoming" ? 0.35 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* ============ LEDGER TIMELINE (no day cards) ============ */}
            <section className="att-ledger att-fade" style={{ animationDelay: "140ms" }}>
              <div className="att-ledger__bar">
                <div className="att-ledger__title">
                  Week ledger
                  <span className="att-ledger__range att-mono">{formatWeekRange()}</span>
                </div>
                <div className="att-legend">
                  {LEGEND.map((s) => (
                    <span key={s}>
                      <i style={{ background: STATUS_ACCENT[s].color }} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <ol className="att-rail">
                {weeklyData.map((day, index) => {
                  const accent = STATUS_ACCENT[day.status] || STATUS_ACCENT.Upcoming;
                  const isSelected = selectedDay === index;
                  const isWeekend = day.dayName === "Sat" || day.dayName === "Sun";

                  return (
                    <li key={index}>
                      <button
                        type="button"
                        className="att-row"
                        onClick={() => toggleDayDetails(index, day)}
                        data-selected={isSelected ? "true" : "false"}
                        data-today={day.isToday ? "true" : "false"}
                        data-weekend={isWeekend ? "true" : "false"}
                        style={{ "--att-status": accent.color }}
                        aria-pressed={isSelected}
                      >
                        <span className="att-row__date">
                          <span className="att-row__dow">{day.dayName}</span>
                          <span className="att-row__num">
                            {String(day.date).padStart(2, "0")}
                          </span>
                        </span>

                        <span className="att-row__rail" aria-hidden="true">
                          <span className="att-row__dot" />
                        </span>

                        <span className="att-row__main">
                          <span className="att-row__status">
                            <i />
                            {day.status}
                          </span>
                          <span className="att-row__meta">
                            {day.checkIn ? (
                              <>
                                <span>
                                  <em>In</em>
                                  <b>{day.checkIn}</b>
                                </span>
                                <span>
                                  <em>Out</em>
                                  <b>{day.checkOut || "Active"}</b>
                                </span>
                                {!day.checkOut && (
                                  <span>
                                    <em>Running</em>
                                    <LiveTimer
                                      startTime={day.checkInRaw}
                                      className="text-brand-text"
                                    />
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="att-row__flag">
                                {day.status === "Upcoming"
                                  ? "Scheduled"
                                  : day.status === "Weekend"
                                  ? "Weekend"
                                  : "No check-in"}
                              </span>
                            )}
                          </span>
                          {expandedView && day.notes && (
                            <span className="att-row__note">{day.notes}</span>
                          )}
                          {expandedView && !day.notes && day.status === "Present" && (
                            <span className="att-row__note">Regular working day</span>
                          )}
                          {expandedView && day.status === "Upcoming" && (
                            <span className="att-row__note">Day not yet reached</span>
                          )}
                          {expandedView && day.status === "Weekend" && (
                            <span className="att-row__note">Non-working weekend</span>
                          )}
                        </span>

                        <span className="att-row__right">
                          {day.isToday && <span className="att-row__today">Today</span>}
                          {day.totalHours > 0 && (
                            <span className="att-row__hours">
                              {Math.floor(day.totalHours)}h{" "}
                              {Math.round((day.totalHours % 1) * 60)}m
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* ============ DAY LOG CONSOLE ============ */}
            {activeDay && (
              <section
                key={activeDay.fullDate}
                className="att-console att-fade"
                style={{
                  "--att-status": activeAccent.color,
                  animationDelay: "210ms",
                }}
              >
                <div className="att-console__bar">
                  <span className="att-console__label">Day log</span>
                  <span className="att-console__chip">{activeDay.status}</span>
                </div>

                <div className="att-console__body">
                  <div className="att-console__head">
                    <div>
                      <h3 className="att-console__date">
                        {formatDisplayDate(activeDay.isoDate, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h3>
                      <p className="att-console__sub">
                        {activeDay.status === "Upcoming"
                          ? "This day is in the future"
                          : activeDay.status === "Weekend"
                          ? "Weekend — non-working day"
                          : activeDay.checkIn
                          ? "Attendance recorded"
                          : "No attendance record for this day"}
                      </p>
                    </div>
                    <span className="att-console__meta att-mono">
                      WK {String(weekNo).padStart(2, "0")} · {activeDay.dayName}{" "}
                      {String(activeDay.date).padStart(2, "0")}
                    </span>
                  </div>

                  {activeDay.status === "Absent" && (
                    <div className="att-state">
                      <div className="att-state__hero">
                        <span className="att-state__icon">
                          <FaTimesCircle size={26} />
                        </span>
                        <div className="att-state__text">
                          <h4 className="att-state__title">
                            No check-in recorded
                          </h4>
                          <p className="att-state__sub">
                            You were marked absent on this day — no check-in was
                            captured, so no hours were logged.
                          </p>
                        </div>
                      </div>

                      <div className="att-state__stats">
                        <span className="att-state__stat">
                          <em>Check in</em>
                          <b>—</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Check out</em>
                          <b>—</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Hours logged</em>
                          <b>0h 0m</b>
                        </span>
                      </div>

                      {activeDay.notes && (
                        <div className="att-state__reason">
                          <label>Reason / note</label>
                          <p>{activeDay.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDay.status === "Upcoming" && (
                    <div className="att-state">
                      <div className="att-state__hero">
                        <span className="att-state__icon">
                          <FaRegCalendarAlt size={26} />
                        </span>
                        <div className="att-state__text">
                          <h4 className="att-state__title">Day scheduled</h4>
                          <p className="att-state__sub">
                            This day is still ahead. Your check-in, check-out and
                            logged hours will appear here automatically on the
                            day.
                          </p>
                        </div>
                      </div>

                      <div className="att-state__stats">
                        <span className="att-state__stat">
                          <em>Check in</em>
                          <b>Pending</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Check out</em>
                          <b>Pending</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Hours logged</em>
                          <b>—</b>
                        </span>
                      </div>
                    </div>
                  )}

                  {activeDay.status === "Weekend" && (
                    <div className="att-state">
                      <div className="att-state__hero">
                        <span className="att-state__icon">
                          <FaCalendarDay size={26} />
                        </span>
                        <div className="att-state__text">
                          <h4 className="att-state__title">Weekend</h4>
                          <p className="att-state__sub">
                            This is a scheduled weekend day. No work or check-in
                            is required.
                          </p>
                        </div>
                      </div>

                      <div className="att-state__stats">
                        <span className="att-state__stat">
                          <em>Status</em>
                          <b>Weekend</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Check in</em>
                          <b>Non-working day</b>
                        </span>
                        <span className="att-state__stat">
                          <em>Hours logged</em>
                          <b>0h 0m</b>
                        </span>
                      </div>
                    </div>
                  )}

                  {activeDay.status !== "Absent" &&
                    activeDay.status !== "Upcoming" &&
                    activeDay.status !== "Weekend" && (
                      <>
                        <div className="att-console__grid">
                          <div className="att-readout-box">
                            <label>Check in</label>
                            <span
                              className={`val ${
                                activeDay.checkIn ? "val--accent" : "val--dim"
                              }`}
                            >
                              {activeDay.checkIn || "--:--"}
                            </span>
                          </div>
                          <div className="att-readout-box">
                            <label>Check out</label>
                            <span
                              className={`val ${
                                activeDay.checkOut
                                  ? "val--accent"
                                  : activeDay.checkIn
                                  ? ""
                                  : "val--dim"
                              }`}
                            >
                              {activeDay.checkOut ||
                                (activeDay.checkIn ? "Active" : "--:--")}
                            </span>
                          </div>
                          <div className="att-readout-box">
                            <label>Duration</label>
                            <span
                              className={`val ${
                                activeDay.checkIn && !activeDay.checkOut
                                  ? "val--accent"
                                  : activeDay.totalHours > 0
                                  ? ""
                                  : "val--dim"
                              }`}
                            >
                              {activeDay.checkIn && !activeDay.checkOut ? (
                                <LiveTimer startTime={activeDay.checkInRaw} />
                              ) : activeDay.totalHours > 0 ? (
                                <>
                                  {Math.floor(activeDay.totalHours)}h{" "}
                                  {Math.floor((activeDay.totalHours % 1) * 60)}m
                                </>
                              ) : (
                                "--"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="att-details">
                          <p className="att-details__title">Summary</p>
                          <div className="att-details__list">
                            <div className="att-details__row">
                              <span className="att-details__key">Status</span>
                              <span className="att-details__val">
                                {activeDay.status}
                              </span>
                            </div>
                            {activeDay.checkIn && (
                              <div className="att-details__row">
                                <span className="att-details__key">
                                  Checked in at
                                </span>
                                <span className="att-details__val">
                                  {activeDay.checkIn}
                                </span>
                              </div>
                            )}
                            {activeDay.checkIn && !activeDay.checkOut && (
                              <div className="att-details__row">
                                <span className="att-details__key">Session</span>
                                <span className="att-details__val att-details__val--running">
                                  In progress
                                  <span className="att-cursor" aria-hidden="true" />
                                </span>
                              </div>
                            )}
                            {activeDay.checkOut && (
                              <div className="att-details__row">
                                <span className="att-details__key">
                                  Checked out at
                                </span>
                                <span className="att-details__val">
                                  {activeDay.checkOut}
                                </span>
                              </div>
                            )}
                            {activeDay.totalHours > 0 && (
                              <div className="att-details__row">
                                <span className="att-details__key">
                                  Total duration
                                </span>
                                <span className="att-details__val">
                                  {Math.floor(activeDay.totalHours)}h{" "}
                                  {Math.floor((activeDay.totalHours % 1) * 60)}m
                                </span>
                              </div>
                            )}
                            {activeDay.notes && (
                              <div className="att-details__row">
                                <span className="att-details__key">Note</span>
                                <span className="att-details__val att-details__val--note">
                                  {activeDay.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </section>
            )}
          </div>
        </div>
      </PageContainer>

      {isModalOpen && selectedAbsentDay && (
        <GlassModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          maxWidth="max-w-sm"
          title={
            <h3 className="text-sm font-black text-danger uppercase tracking-widest flex items-center gap-2">
              <FaTimesCircle /> Absence Reason
            </h3>
          }
          footer={
            <GlassButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Close
            </GlassButton>
          }
        >
          <div className="mb-5">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
              Date
            </p>
            <p className="text-sm font-bold text-heading">{selectedAbsentDay.fullDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
              Reason / Notes
            </p>
            <div className="bg-danger-bg border border-danger-border rounded-xl p-4 text-sm text-danger font-medium whitespace-pre-wrap shadow-sm">
              {selectedAbsentDay.notes || "No reason specified."}
            </div>
          </div>
        </GlassModal>
      )}
    </>
  );
};

export default Attendance;
