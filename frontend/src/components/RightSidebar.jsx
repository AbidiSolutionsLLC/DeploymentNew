import React, { useEffect, useState, useMemo } from "react";
import {
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  UsersIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { checkInNow, checkOutNow, fetchCurrentStatus } from "../slices/attendanceTimer";
import { toast } from "react-toastify";
import { refreshUserData } from "../slices/userSlice";
import api from "../axios";
import "../styles/adminPortal.css";

const EASE = [0.16, 1, 0.3, 1];

const RightSidebar = ({ isOpen, toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timerInterval, setTimerInterval] = useState(null);

  // Local state to prevent "button flash" by holding data immediately
  const [localLog, setLocalLog] = useState(null);

  // Redux state
  const { checkInn, loading } = useSelector((state) => state.attendanceTimer);
  const { user } = useSelector((state) => state.auth);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    const userId = user?.data?.user?._id || user?.user?._id || user?._id || user?.id;
    if (userId) {
      dispatch(refreshUserData(userId));
    }
  }, [user, dispatch]);

  const currentUser = userInfo || user?.data?.user || user?.user || user;
  const profileImage = currentUser?.avatar || "";
  const firstName = currentUser?.name || "User";

  const manager = currentUser?.reportsTo || null;
  const teamMembers = useMemo(() => {
    if (!currentUser?.department?.members) return [];

    return currentUser.department.members
      .filter((member) => member._id !== currentUser._id)
      .slice(0, 5);
  }, [currentUser]);

  // 1. Initial Redux Fetch
  useEffect(() => {
    dispatch(fetchCurrentStatus());
  }, [dispatch]);

  // 2. Direct API Verification on Mount — guarantees the button state is accurate
  useEffect(() => {
    const verifySessionStatus = async () => {
      if (currentUser?._id) {
        try {
          const { data } = await api.get(`/timetrackers/my/daily/${currentUser._id}`);
          if (data?.log) {
            setLocalLog(data.log);
          }
        } catch (error) {
          console.error("Session verification failed:", error);
        }
      }
    };
    verifySessionStatus();
  }, [currentUser]);

  // MERGE: Local log takes priority to prevent the "flash" bug
  const activeLog = localLog || checkInn?.log;
  const isCheckedIn = Boolean(activeLog?.checkInTime && !activeLog?.checkOutTime);
  const isCheckedOut = Boolean(activeLog?.checkInTime && activeLog?.checkOutTime);

  // Avatar component
  const Avatar = ({ url, name, size = "sm" }) => {
    const sizeClasses =
      size === "lg" ? "w-14 h-14" : size === "md" ? "w-9 h-9" : "w-8 h-8";

    if (url) {
      return (
        <img
          src={url}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-border-subtle shadow-sm shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} rounded-full border border-border-subtle shadow-sm flex items-center justify-center shrink-0`}
        style={{ backgroundColor: "var(--color-bg-active)" }}
      >
        <span
          className={`${size === "lg" ? "text-lg" : "text-xs"} font-black text-brand-text`}
        >
          {name?.charAt(0).toUpperCase() || "U"}
        </span>
      </div>
    );
  };

  const formatTimeFromSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  // Timer logic driven by the merged activeLog
  useEffect(() => {
    if (activeLog?.checkInTime && !activeLog?.checkOutTime) {
      const startTime = new Date(activeLog.checkInTime).getTime();

      const updateElapsed = () => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        setElapsedTime(formatTimeFromSeconds(elapsedSeconds));
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      setTimerInterval(interval);

      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    }
  }, [activeLog]);

  const handleCheckIn = () => {
    dispatch(checkInNow())
      .unwrap()
      .then((res) => {
        setLocalLog(res.log);
        toast.success("Checked in successfully");
      })
      .catch(async (err) => {
        toast.error(err?.message || "Failed to check in");

        // SELF-HEALING: verify with backend if a session already exists
        if (
          err?.message &&
          (err.message.includes("active session") || err.message.includes("checked in"))
        ) {
          try {
            const { data } = await api.get(`/timetrackers/my/daily/${currentUser?._id}`);
            if (data?.log) setLocalLog(data.log);
          } catch (e) {
            console.error("Self-heal failed", e);
          }
        }
      });
  };

  const handleCheckOut = () => {
    dispatch(checkOutNow())
      .unwrap()
      .then((res) => {
        setLocalLog(res.log);
        toast.success("Checked out successfully!");
      })
      .catch((err) => toast.error(err?.message || "Failed to check out"));
  };

  const getButtonState = () => {
    if (!activeLog) {
      return {
        text: "Check In",
        onClick: handleCheckIn,
        className:
          "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.65)]",
        disabled: false,
      };
    }
    if (isCheckedIn) {
      return {
        text: "Check Out",
        onClick: handleCheckOut,
        className:
          "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.6)]",
        disabled: false,
      };
    }
    return {
      text: "Checked Out",
      className:
        "bg-neutral-bg text-muted border border-border-subtle cursor-not-allowed",
      disabled: true,
    };
  };

  const buttonState = getButtonState();

  const statusChip = () => {
    if (isCheckedIn) {
      return (
        <span className="lm-success-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Checked In
        </span>
      );
    }
    if (isCheckedOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-neutral-bg text-neutral border border-border-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral" />
          Checked Out
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-warning-bg text-warning border border-warning-border">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Off Duty
      </span>
    );
  };

  const timerDigits = [
    elapsedTime.hours.toString().padStart(2, "0"),
    elapsedTime.minutes.toString().padStart(2, "0"),
    elapsedTime.seconds.toString().padStart(2, "0"),
  ];

  const stagger = (i) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay: 0.05 * i },
  });

  return (
    <aside
      className={`relative z-50 h-full flex-shrink-0 transition-all duration-500 ease-in-out ${
        isOpen ? "w-[14.5rem]" : "w-10"
      }`}
    >
      {/* Toggle Button — pinned to the panel's left edge */}
      <button
        onClick={toggleSidebar}
        aria-label={isOpen ? "Collapse panel" : "Expand panel"}
        className="absolute -left-3 top-12 z-[70] p-1.5 rounded-full bg-surface border border-border-subtle text-muted shadow-md hover:text-brand hover:bg-card-hover hover:border-border-accent active:scale-90 transition-all"
      >
        {isOpen ? (
          <ChevronRightIcon className="w-3 h-3" />
        ) : (
          <ChevronLeftIcon className="w-3 h-3" />
        )}
      </button>

      <div className="relative h-full w-full">
        {/* Collapsed mini-rail */}
        <AnimatePresence>
          {!isOpen && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-0 rounded-[2rem] bg-surface border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex flex-col items-center py-4 gap-3"
            >
              <button
                onClick={toggleSidebar}
                title={currentUser?.name || "Open panel"}
                className="relative shrink-0"
              >
                <Avatar url={profileImage} name={firstName} />
                {isCheckedIn && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
                )}
              </button>

              <span className="w-6 h-px bg-border-subtle" />

              <button
                onClick={toggleSidebar}
                title="Session timer"
                className={`flex flex-col items-center gap-1 ${
                  isCheckedIn ? "text-brand-text" : "text-muted"
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                {isCheckedIn && (
                  <span className="text-[8px] font-black tabular-nums leading-none">
                    {timerDigits[0]}:{timerDigits[1]}
                  </span>
                )}
              </button>

              <button
                onClick={toggleSidebar}
                title="Reporting manager"
                className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-card-hover transition-colors"
              >
                <UserIcon className="w-4 h-4" />
              </button>

              <button
                onClick={toggleSidebar}
                title="Team overview"
                className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-card-hover transition-colors"
              >
                <UsersIcon className="w-4 h-4" />
              </button>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Expanded panel */}
        <div
          className={`h-full w-full rounded-[2rem] bg-surface border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.05)] glimmer-border flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {/* ── Profile header ── */}
          <header className="relative shrink-0 px-4 pt-5 pb-4 border-b border-border-subtle overflow-hidden">
            <span aria-hidden className="glam-aura">
              <i
                style={{
                  top: "-45%",
                  left: "-25%",
                  width: "150%",
                  height: "80%",
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.35), transparent 70%)",
                }}
              />
            </span>

            <div className="relative z-10 flex flex-col items-center">
              {/* Avatar with gold ring + presence dot */}
              <div className="relative mb-2.5">
                <div
                  className="w-16 h-16 rounded-full p-[3px] shadow-[0_6px_18px_-6px_rgba(212,175,55,0.55)]"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffe19a, var(--color-brand-primary))",
                  }}
                >
                  <div className="w-full h-full rounded-full bg-surface p-[2px] overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-xl font-black text-brand-text"
                        style={{ backgroundColor: "var(--color-bg-active)" }}
                      >
                        {firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {isCheckedIn && (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" />
                )}
              </div>

              <h3 className="text-sm font-bold text-heading text-center leading-tight">
                {currentUser?.name || "- Name -"}
              </h3>
              <p className="text-[9px] font-semibold text-muted uppercase tracking-widest mt-1 text-center">
                {currentUser?.designation || "- Designation -"}
              </p>

              <div className="mt-2.5">{statusChip()}</div>
            </div>
          </header>

          {/* ── Check in / out + live timer ── */}
          <div className="shrink-0 px-4 py-3.5 border-b border-border-subtle">
            <button
              onClick={buttonState.onClick}
              disabled={buttonState.disabled || loading}
              className={`hide-on-mobile-device shine w-full rounded-full py-2.5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:active:scale-100 ${buttonState.className}`}
            >
              {loading ? "Processing..." : buttonState.text}
            </button>

            <AnimatePresence>
              {isCheckedIn && (
                <Motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted text-center mb-2">
                      Current Session
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-lg bg-app border border-border-subtle shadow-inner flex items-center justify-center text-sm font-black tabular-nums text-brand-text">
                        {timerDigits[0]}
                      </div>
                      <span className="text-brand font-bold text-sm">:</span>
                      <div className="w-9 h-9 rounded-lg bg-app border border-border-subtle shadow-inner flex items-center justify-center text-sm font-black tabular-nums text-brand-text">
                        {timerDigits[1]}
                      </div>
                      <span className="text-brand font-bold text-sm">:</span>
                      <div className="w-9 h-9 rounded-lg bg-app border border-border-subtle shadow-inner flex items-center justify-center text-sm font-black tabular-nums text-brand-text">
                        {timerDigits[2]}
                      </div>
                    </div>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-on-hover px-3 py-3 space-y-3">
            {/* Reporting Manager */}
            <Motion.section
              {...stagger(1)}
              className="lm-card lm-card-lift"
              style={{ "--lm-accent": "#D4AF37" }}
            >
              <div className="lm-card-head !py-2.5 !px-3">
                <span className="lm-ico-chip !w-7 !h-7">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="lm-card-title !text-[10px] truncate">
                    Reporting Manager
                  </h3>
                  <p className="lm-card-sub !text-[9px] truncate">
                    Your direct supervisor
                  </p>
                </div>
              </div>

              <div className="p-2.5">
                {manager ? (
                  <div
                    onClick={() => manager._id && navigate(`/people/profile/${manager._id}`)}
                    className="lm-row !px-2.5 !py-2 cursor-pointer"
                  >
                    <Avatar url={manager.avatar} name={manager.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-heading truncate">
                        {manager.name}
                      </p>
                      <p className="text-[9px] text-muted truncate">
                        {manager.designation || "Manager"}
                      </p>
                      <p className="text-[9px] text-brand-text truncate">
                        {manager.email}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-100 to-purple-100 rounded-full blur-sm opacity-70" />
                      <div className="relative bg-surface w-9 h-9 rounded-full flex items-center justify-center shadow-sm border border-border-subtle">
                        <UserCircleIcon className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                    <h4 className="text-[11px] font-bold text-main tracking-wide">
                      No manager assigned
                    </h4>
                    <p className="text-[9px] text-muted font-medium mt-1 uppercase tracking-wide">
                      You're the top level
                    </p>
                  </div>
                )}
              </div>
            </Motion.section>

            {/* Team Overview */}
            <Motion.section
              {...stagger(2)}
              className="lm-card lm-card-lift"
              style={{ "--lm-accent": "#D4AF37" }}
            >
              <div className="lm-card-head !py-2.5 !px-3">
                <span className="lm-ico-chip !w-7 !h-7">
                  <UsersIcon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="lm-card-title !text-[10px] truncate">
                    Team Overview
                  </h3>
                  <p className="lm-card-sub !text-[9px] truncate">
                    People you work with
                  </p>
                </div>
                <span className="lm-badge">{teamMembers.length}</span>
              </div>

              <div className="p-2 space-y-1.5">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div
                      key={member._id}
                      onClick={() => navigate(`/people/profile/${member._id}`)}
                      className="lm-row !px-2.5 !py-2 cursor-pointer"
                    >
                      <Avatar url={member.avatar} name={member.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-heading truncate">
                          {member.name}
                        </p>
                        <p className="text-[9px] text-muted truncate">
                          {member.designation || "Team Member"}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-100 to-purple-100 rounded-full blur-sm opacity-70" />
                      <div className="relative bg-surface w-9 h-9 rounded-full flex items-center justify-center shadow-sm border border-border-subtle">
                        <UsersIcon className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                    <h4 className="text-[11px] font-bold text-main tracking-wide">
                      No team members found
                    </h4>
                    <p className="text-[9px] text-muted font-medium mt-1 uppercase tracking-wide">
                      You'll see team members here
                    </p>
                  </div>
                )}
              </div>
            </Motion.section>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
