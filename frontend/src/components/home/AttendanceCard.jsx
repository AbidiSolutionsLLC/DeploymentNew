import React, { useState, useEffect, useRef } from "react";
import { GoGraph } from "react-icons/go";
import api from "../../axios";
import { toast } from "react-toastify";
import EmptyCardState from "./EmptyCardState";
import HomeCardShell from "./HomeCardShell";

const LiveTimer = ({ startTime }) => {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const diff = Math.max(0, new Date().getTime() - start);
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

  return <span>{duration}</span>;
};

const AttendanceCard = ({ onDelete }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxBarHeight = 70;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const getWeekStartDate = () => {
    const today = new Date();
    const start = new Date(today);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStartDate();
      const month = weekStart.getMonth() + 1;
      const year = weekStart.getFullYear();

      const response = await api.get(`/timetrackers/attendance/${month}/${year}`);
      processWeeklyData(response.data, weekStart);
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (attendanceData, weekStart) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);

      const dayData = attendanceData.find((d) => {
        const targetDate = new Date(d.date);
        return (
          targetDate.getUTCFullYear() === currentDay.getFullYear() &&
          targetDate.getUTCMonth() === currentDay.getMonth() &&
          targetDate.getUTCDate() === currentDay.getDate()
        );
      });

      const isWeekendDay = currentDay.getDay() === 0 || currentDay.getDay() === 6;
      let hours = 0;
      let status = isWeekendDay ? "Weekend" : currentDay > today ? "Upcoming" : "Absent";
      let checkInTime = null;
      let checkOutTime = null;

      if (dayData) {
        status = isWeekendDay && dayData.status === "Absent" ? "Weekend" : (dayData.status || status);
        checkInTime = dayData.checkInTime;
        checkOutTime = dayData.checkOutTime;

        if (dayData.totalHours) {
          hours = dayData.totalHours;
        } else if (dayData.checkInTime && dayData.checkOutTime) {
          const checkIn = new Date(dayData.checkInTime);
          const checkOut = new Date(dayData.checkOutTime);
          const diffMs = checkOut - checkIn;
          hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        } else if (dayData.checkInTime && !dayData.checkOutTime) {
          const checkIn = new Date(dayData.checkInTime);
          const diffMs = new Date() - checkIn;
          hours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
        } else if (dayData.status === "Present") {
          hours = 8;
        } else if (dayData.status === "Half Day") {
          hours = 4;
        }
      }

      days.push({
        day: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
        hours: hours,
        date: currentDay.getDate(),
        status: status,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
      });
    }

    setWeeklyData(days);
  };

  useEffect(() => {
    fetchWeeklyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalHours = weeklyData.reduce((sum, val) => sum + val.hours, 0);

  return (
    <HomeCardShell
      title="Weekly Attendance"
      sub={`${totalHours.toFixed(1)} total hours`}
      icon={GoGraph}
      accent="#10B981"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      <div className="bg-app rounded-xl p-3 overflow-auto flex-1 min-h-0">
        {totalHours > 0 || loading ? (
          <div className="flex items-end justify-between h-28 gap-1.5 pt-2">
            {weeklyData.map(({ day, hours, status, checkInTime, checkOutTime }, i) => {
              let color = "bg-slate-300 dark:bg-slate-700";
              if (status === "Absent") color = "bg-rose-500";
              else if (status === "Weekend") color = "bg-slate-400 dark:bg-slate-600";
              else if (status === "Present" && hours >= 7) color = "bg-emerald-500";
              else if (status === "Half Day") color = "bg-amber-500";
              else if (status === "Present") color = "bg-amber-400";
              else if (status === "Upcoming") color = "bg-slate-300 dark:bg-slate-700";

              const barHeight = Math.min((hours / 10) * maxBarHeight, maxBarHeight);

              return (
                <div key={i} className="flex flex-col items-center justify-end flex-1">
                  <div
                    className={`w-2 ${color} rounded transition-all duration-300`}
                    style={{ height: `${barHeight}px` }}
                  ></div>
                  <div className="mt-1 text-center leading-tight">
                    <span className="block text-[9px] font-semibold text-main mb-0.5">
                      {day}
                    </span>
                    <span className="block text-[8px] text-muted whitespace-nowrap">
                      {status === "Upcoming" || status === "Weekend"
                        ? "-"
                        : checkInTime && !checkOutTime
                        ? <LiveTimer startTime={checkInTime} />
                        : checkInTime && checkOutTime
                        ? `${Math.floor(hours)}h ${Math.round((hours - Math.floor(hours)) * 60)}m`
                        : `${hours}h`}
                    </span>
                    {checkInTime && (
                      <span className="block text-[7px] text-brand-text mt-0.5 whitespace-nowrap">
                        {new Date(checkInTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyCardState message="You haven't added anything yet" />
        )}
      </div>
    </HomeCardShell>
  );
};

export default AttendanceCard;
