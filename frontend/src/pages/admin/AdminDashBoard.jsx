import React, { useEffect, useState, useRef } from 'react';
import { 
 FaUsers, 
 FaProjectDiagram, 
 FaClipboardList, 
 FaTicketAlt, 
 FaCalendarCheck,
 FaClock,
 FaCalendarDay,
 FaChartBar,
FaExclamationCircle,
  FaArrowRight,
  FaBolt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import adminDashboardApi from '../../api/adminDashboardApi';
import api from '../../axios'; // Added to fetch user role
import { toast } from 'react-toastify';
import PageContainer from '../../components/ui/PageContainer';
import Loader from '../../components/ui/Loader';
import '../../styles/adminPortal.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const EASE = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

const GOLD_PALETTE = ['#D4AF37', '#B8860B', '#E8C766', '#A67C00', '#F3E5AB', '#C9A227', '#8C6D1F'];

/* Animated odometer for the KPI numbers */
const CountUp = ({ value, duration = 1100 }) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let raf;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(from + (to - from) * eased);
      fromRef.current = current;
      setDisplay(current);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
};

const AdminDashBoard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          adminDashboardApi.getAdminDashboardStats(),
          api.get("/auth/me")
        ]);
        setData(statsRes);
        setUser(userRes.data.user || userRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface z-50">
      <div className="text-center">
        <Loader size="xl" text="Loading analytics..." />
      </div>
    </div>
  );

  if (!data || !user) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4 float-slow">
          <FaExclamationCircle className="text-muted text-2xl" />
        </div>
        <p className="text-muted text-sm font-medium">No analytics data available</p>
      </div>
    </div>
  );

  // RBAC UI Flags
  const isHR = user.role === 'HR';
  const showTickets = !isHR; // HR has "None" for Ticketing 
  const totalEmployees = data.summary.totalEmployees || 0;

  // --- Greeting / time helpers ---
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const rawName =
    typeof user?.name === 'string' ? user.name
      : typeof user?.fullName === 'string' ? user.fullName
        : '';
  const firstName = rawName.split(' ')[0] || user?.firstName || (user?.email ? user.email.split('@')[0] : 'Admin');
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // --- Chart Configurations ---
  const attendanceChartData = {
    labels: ['Present', 'Absent', 'On Leave'],
    datasets: [{
      data: [data.attendance.Present, data.attendance.Absent, data.attendance.Leave],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      hoverBackgroundColor: ['#34D399', '#F87171', '#FBBF24'],
      borderColor: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)'],
      borderWidth: 3,
      hoverOffset: 10,
      cutout: '72%',
    }]
  };

  const deptChartData = {
    labels: data.charts.departments.labels,
    datasets: [{
      label: 'Staff Count',
      data: data.charts.departments.data,
      backgroundColor: data.charts.departments.labels.map((_, i) => GOLD_PALETTE[i % GOLD_PALETTE.length]),
      hoverBackgroundColor: data.charts.departments.labels.map((_, i) => GOLD_PALETTE[(i + 2) % GOLD_PALETTE.length]),
      borderRadius: 10,
      borderSkipped: false,
      barThickness: 26,
      maxBarThickness: 34,
    }]
  };

  const chartAnimation = { duration: 1200, easing: 'easeOutQuart' };
  const presentRate = Math.round((data.attendance.Present / (totalEmployees || 1)) * 100);

  // --- KPI definitions ---
  // `accent` + `grad` drive the whole card: top hairline, icon chip,
  // hover wash and lift shadow all derive from them via --lm-accent/--lm-grad.
  const stats = [
    {
      key: 'employees',
      title: 'Total Employees',
      value: data.summary.totalEmployees,
      icon: <FaUsers size={19} />,
      accent: '#F59E0B',
      grad: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
      subtext: 'Across all departments',
    },
    {
      key: 'projects',
      title: 'Active Projects',
      value: data.summary.activeProjects,
      icon: <FaProjectDiagram size={19} />,
      accent: '#6366F1',
      grad: 'linear-gradient(135deg, #818CF8 0%, #7C3AED 100%)',
      subtext: 'In delivery right now',
    },
    {
      key: 'pending',
      title: 'Pending Actions',
      value: data.summary.pendingApprovals,
      icon: <FaClipboardList size={19} />,
      accent: '#0EA5E9',
      grad: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
      subtext: isHR ? 'Leaves Oversight' : 'Leaves & Timesheets',
    },
    // Requirement: Hide Tickets for HR
    ...(showTickets ? [{
      key: 'tickets',
      title: 'Support Tickets',
      value: data.summary.openTickets,
      icon: <FaTicketAlt size={19} />,
      accent: '#F43F5E',
      grad: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
      subtext: 'Awaiting a response',
    }] : []),
  ];

  const actionItems = [
    {
      label: 'Leave Requests',
      count: data.actionItems.leaves,
      icon: <FaCalendarDay size={16} />,
      accent: '#F59E0B',
      to: '/admin/leaveTrackerAdmin',
      show: true,
    },
    // Requirement: Only show Timesheets if not HR (HR is "own" only)
    {
      label: 'Timesheet Approvals',
      count: data.actionItems.timesheets,
      icon: <FaClipboardList size={16} />,
      accent: '#0EA5E9',
      to: '/admin/approve',
      show: !isHR,
    },
    // Requirement: Hide Tickets in Action Center for HR
    {
      label: 'Open Tickets',
      count: data.actionItems.tickets,
      icon: <FaTicketAlt size={16} />,
      accent: '#F43F5E',
      to: '/admin/assign-ticket',
      show: showTickets,
    },
  ].filter((a) => a.show);

  const attendanceLegend = [
    { label: 'Present', value: data.attendance.Present, dot: 'bg-emerald-500', bar: 'linear-gradient(90deg,#34D399,#059669)' },
    { label: 'Absent', value: data.attendance.Absent, dot: 'bg-rose-500', bar: 'linear-gradient(90deg,#FB7185,#E11D48)' },
    { label: 'On Leave', value: data.attendance.Leave, dot: 'bg-amber-500', bar: 'linear-gradient(90deg,#FCD34D,#D97706)' },
  ];

  const summaryStats = [
    { label: 'Active', value: `${totalEmployees} users`, dot: 'bg-emerald-500' },
    { label: 'Pending', value: `${data.summary.pendingApprovals} actions`, dot: 'bg-sky-500' },
    { label: 'Projects', value: `${data.summary.activeProjects} active`, dot: 'bg-indigo-500' },
    // Requirement: Hide Footer Stat for HR
    ...(showTickets ? [{ label: 'Tickets', value: `${data.summary.openTickets} open`, dot: 'bg-rose-500' }] : []),
  ];

  return (
    <PageContainer isCard={false}>
      <Motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">

        {/* ══════ HERO BANNER ══════ */}
        <Motion.section
          variants={item}
          className="lm-card"
          style={{ '--lm-accent': '#D4AF37' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 p-6 md:p-7">
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-text">
                {isHR ? 'Human Resources' : 'Administration'}
              </p>

              <h2 className="mt-2 text-[1.75rem] md:text-[2.1rem] font-black leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-600">
                {greeting}, {firstName}
              </h2>

              <p className="mt-2.5 text-sm text-muted font-medium leading-relaxed max-w-xl">
                Everything that needs your attention today — approvals, attendance and workforce signals, all in one place.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl">
                {[
                  { icon: FaCalendarCheck, label: dateString, tone: 'text-brand-text' },
                  { icon: FaBolt, label: 'All systems operational', tone: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: FaUsers, label: `${totalEmployees} members`, tone: 'text-indigo-500' },
                ].map(({ icon: Icon, label, tone }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-subtle bg-surface/60 min-w-0"
                  >
                    {React.createElement(Icon, { className: `text-sm shrink-0 ${tone}` })}
                    <span className="text-xs font-semibold text-main truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live clock */}
            <div className="shrink-0 lg:w-[15rem] flex lg:flex-col justify-center gap-2 rounded-2xl p-5 border border-border-accent bg-surface/70 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted">Local Time</p>
              <p className="text-[2.4rem] leading-none font-black text-heading tabular-nums tracking-tight">
                {timeString}
              </p>
              <div className="mt-1 h-[3px] w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${((now.getMinutes() * 60 + now.getSeconds()) / 3600) * 100}%`,
                    background: 'linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-accent))',
                  }}
                />
              </div>
            </div>
          </div>
        </Motion.section>

        {/* ══════ KEY METRICS ══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Motion.div
              key={s.key}
              variants={item}
              className="lm-card lm-card-lift"
              style={{ '--lm-accent': s.accent, '--lm-grad': s.grad }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">{s.title}</p>
                    <h3 className="lm-kpi-value mt-2.5">
                      <CountUp value={s.value} />
                    </h3>
                    {s.subtext && (
                      <p className="mt-2 text-xs font-medium text-muted leading-snug">{s.subtext}</p>
                    )}
                  </div>

                  <span className="lm-kpi-icon">
                    <span className="lm-glow" aria-hidden="true" />
                    {s.icon}
                  </span>
                </div>
              </div>
              <span className="lm-kpi-bar" aria-hidden />
            </Motion.div>
          ))}
        </div>

        {/* ══════ ATTENDANCE + ACTION CENTER ══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Attendance Chart Card */}
          <Motion.div
            variants={item}
            className="lm-card lg:col-span-2"
            style={{ '--lm-accent': '#10B981' }}
          >
            <div className="lm-card-head">
              <span className="lm-ico-chip"><FaClock size={15} /></span>
              <div className="min-w-0">
                <h3 className="lm-card-title">Today's Attendance</h3>
                <p className="lm-card-sub">Live snapshot of the current day</p>
              </div>
              <span className="lm-card-meta text-[11px] font-bold uppercase tracking-wider text-muted">
                {presentRate}% present
              </span>
            </div>

            <div className="lm-card-body flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-52 w-52 shrink-0 flex items-center justify-center">
                <Doughnut
                  data={attendanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    animation: { ...chartAnimation, animateRotate: true, animateScale: true },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(15,23,42,0.95)',
                        padding: 10,
                        cornerRadius: 10,
                        titleFont: { weight: '700' },
                        displayColors: true,
                      },
                    },
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-[2.25rem] leading-none font-black text-heading tabular-nums">{presentRate}%</span>
                  <span className="text-[10px] text-muted font-black uppercase tracking-[0.18em] mt-1.5">Present</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2.5">
                {attendanceLegend.map((l) => {
                  const pct = totalEmployees ? Math.round((l.value / totalEmployees) * 100) : 0;
                  return (
                    <div
                      key={l.label}
                      className="lm-row flex-col items-stretch gap-2"
                      style={{ '--lm-accent': l.bar }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-main">
                          <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
                          {l.label}
                        </span>
                        <span className="text-xs font-black text-heading tabular-nums">
                          {l.value} <span className="text-muted font-semibold">({pct}%)</span>
                        </span>
                      </div>
                      <div className="lm-meter">
                        <span style={{ width: `${pct}%`, backgroundImage: l.bar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Motion.div>

          {/* Action Center Card */}
          <Motion.div
            variants={item}
            className="lm-card"
            style={{ '--lm-accent': '#F43F5E' }}
          >
            <div className="lm-card-head">
              <span className="lm-ico-chip"><FaExclamationCircle size={15} /></span>
              <div className="min-w-0">
                <h3 className="lm-card-title">Action Center</h3>
                <p className="lm-card-sub">Items waiting on a decision</p>
              </div>
              <span className="lm-card-meta text-[11px] font-black tabular-nums px-2.5 py-1 rounded-full border border-border-accent text-brand-text">
                {actionItems.reduce((sum, a) => sum + (Number(a.count) || 0), 0)} pending
              </span>
            </div>

            <div className="lm-card-body space-y-2.5">
              <AnimatePresence mode="popLayout">
                {actionItems.map((a) => (
                  <Motion.button
                    key={a.label}
                    layout
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 14 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(a.to)}
                    className="lm-row w-full cursor-pointer text-left group/item"
                    style={{ '--lm-accent': a.accent }}
                  >
                    <span
                      className="p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover/item:-rotate-6 group-hover/item:scale-110"
                      style={{
                        color: a.accent,
                        backgroundColor: `color-mix(in srgb, ${a.accent} 14%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${a.accent} 26%, transparent)`,
                      }}
                    >
                      {a.icon}
                    </span>

                    <span className="text-sm font-bold text-main truncate">{a.label}</span>

                    <span className="ml-auto flex items-center gap-2 shrink-0">
                      <span
                        className="min-w-[2rem] text-center px-2 py-0.5 rounded-full text-[11px] font-black tabular-nums"
                        style={{
                          color: a.accent,
                          backgroundColor: `color-mix(in srgb, ${a.accent} 14%, transparent)`,
                        }}
                      >
                        {a.count}
                      </span>
                      <FaArrowRight
                        className="text-muted opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"
                        size={12}
                      />
                    </span>
                  </Motion.button>
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {data.holiday && (
                <Motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
                  className="mx-5 mb-5 rounded-2xl p-4 border border-indigo-500/25 bg-indigo-500/[0.07]"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-xl bg-indigo-500/15 text-indigo-500 shrink-0">
                      <FaCalendarCheck size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.18em]">Upcoming Holiday</p>
                      <p className="font-black text-heading text-sm truncate">{data.holiday.holidayName}</p>
                      <p className="text-xs text-muted font-semibold">
                        {new Date(data.holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </Motion.div>
        </div>

        {/* ══════ WORKFORCE DISTRIBUTION ══════ */}
        <Motion.div variants={item} className="lm-card" style={{ '--lm-accent': '#6366F1' }}>
          <div className="lm-card-head">
            <span className="lm-ico-chip"><FaChartBar size={15} /></span>
            <div className="min-w-0">
              <h3 className="lm-card-title">Workforce Distribution</h3>
              <p className="lm-card-sub">Head count grouped by department</p>
            </div>
            <span className="lm-card-meta text-xs font-bold text-muted">
              Total: <span className="font-black text-heading">{totalEmployees}</span> employees
            </span>
          </div>

          <div className="lm-card-body h-64">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: chartAnimation,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    padding: 10,
                    cornerRadius: 10,
                    titleFont: { weight: '700' },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(212,175,55,0.12)', drawBorder: false },
                    ticks: { font: { size: 11, weight: '600' }, color: '#64748b', precision: 0 },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: '600' }, color: '#64748b' },
                  },
                },
              }}
            />
          </div>
        </Motion.div>

        {/* ══════ SUMMARY FOOTER ══════ */}
        <Motion.div variants={item} className="lm-card" style={{ '--lm-accent': '#D4AF37' }}>
          <div className="lm-stat-strip grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((s) => (
              <div key={s.label} className="lm-stat">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                    {s.label}
                  </span>
                  <span className="block text-sm font-black text-heading tabular-nums">{s.value}</span>
                </span>
              </div>
            ))}
          </div>
        </Motion.div>

      </Motion.div>
    </PageContainer>
  );
}

export default AdminDashBoard;
