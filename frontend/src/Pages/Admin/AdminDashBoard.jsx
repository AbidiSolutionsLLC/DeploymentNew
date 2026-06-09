import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  ClipboardDocumentCheckIcon, 
  TicketIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  UserPlusIcon,
  BanknotesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { getAdminDashboardStats } from '../../api/adminDashboardApi';
import api from '../../axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AdminDashboardStatCard from '../../Components/AdminDashboardStatCard';
import ActivityFeed from '../../Components/ActivityFeed';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          getAdminDashboardStats(),
          api.get("/auth/me")
        ]);
        setData(statsRes.data);
        setUser(userRes.data.user);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Calibrating Systems...</p>
      </div>
    </div>
  );

  if (!data || !user) return null;

  const isHR = user.role === 'HR';
  const showTickets = !isHR;

  // --- Chart Configurations ---
  const attendanceChartData = {
    labels: ['Present', 'Absent', 'On Leave'],
    datasets: [{
      data: [data.attendance.Present, data.attendance.Absent, data.attendance.Leave],
      backgroundColor: ['#10B981', '#F43F5E', '#F59E0B'],
      borderWidth: 0,
      hoverOffset: 10,
      cutout: '80%',
    }]
  };

  const deptChartData = {
    labels: data.charts.departments.labels,
    datasets: [{
      label: 'Staff Count',
      data: data.charts.departments.data,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderRadius: 12,
      barThickness: 32,
    }]
  };

  const quickActions = [
    { label: 'Add User', icon: UserPlusIcon, path: '/admin/userManagement', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approve Leaves', icon: CalendarDaysIcon, path: '/admin/leaveTrackerAdmin', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expense Board', icon: BanknotesIcon, path: '/admin/ExpenseManagement', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'System Logs', icon: ShieldCheckIcon, path: '/notifications', color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              Intelligence Layer
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
            {isHR ? "Talent Overview" : "Executive Control"}
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg">
            Real-time organizational insights and administrative control panel for Karbexa infrastructure.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="px-4 py-2 text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
            <p className="text-sm font-black text-slate-900">SYSTEMS OPERATIONAL</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <AdminDashboardStatCard 
          title="Total Workforce" 
          value={data.summary.totalEmployees} 
          icon={<UsersIcon className="w-6 h-6" />} 
          gradient="from-blue-600 to-indigo-600"
          trend={{ value: 2.4, isPositive: true }}
          subtext="Active members"
        />
        <AdminDashboardStatCard 
          title="Active Projects" 
          value={data.summary.activeProjects} 
          icon={<BriefcaseIcon className="w-6 h-6" />} 
          gradient="from-emerald-600 to-teal-600"
          trend={{ value: 1.2, isPositive: true }}
          subtext="Running streams"
        />
        <AdminDashboardStatCard 
          title="Pending Actions" 
          value={data.summary.pendingApprovals} 
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} 
          gradient="from-amber-600 to-orange-600"
          trend={{ value: 5, isPositive: false }}
          subtext="Needs attention"
          onClick={() => navigate(isHR ? '/admin/leaveTrackerAdmin' : '/admin/approve')}
        />
        {showTickets && (
          <AdminDashboardStatCard 
            title="Open Tickets" 
            value={data.summary.openTickets} 
            icon={<TicketIcon className="w-6 h-6" />} 
            gradient="from-rose-600 to-pink-600"
            trend={{ value: 0.8, isPositive: true }}
            subtext="Support load"
            onClick={() => navigate('/admin/assign-ticket')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        {/* ATTENDANCE ANALYTICS */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ClockIcon className="w-8 h-8 text-slate-900" />
              Daily Engagement
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-64 h-64 shrink-0">
              <Doughnut 
                data={attendanceChartData} 
                options={{
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                  maintainAspectRatio: false,
                  cutout: '80%',
                  animation: { duration: 2000, easing: 'easeOutQuart' }
                }} 
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  {Math.round((data.attendance.Present / (data.summary.totalEmployees || 1)) * 100)}%
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</span>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-6 w-full">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On Premises</p>
                <p className="text-2xl font-black text-slate-900">{data.attendance.Present}</p>
                <div className="w-full h-1 bg-emerald-500 mt-3 rounded-full opacity-30" />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Away/Leave</p>
                <p className="text-2xl font-black text-slate-900">{data.attendance.Leave}</p>
                <div className="w-full h-1 bg-amber-500 mt-3 rounded-full opacity-30" />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absenteeism</p>
                <p className="text-2xl font-black text-slate-900">{data.attendance.Absent}</p>
                <div className="w-full h-1 bg-rose-500 mt-3 rounded-full opacity-30" />
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex flex-col h-full">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
            <PlusIcon className="w-8 h-8 text-slate-900" />
            Quick Ops
          </h2>
          <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl shadow-slate-200 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full group flex items-center justify-between p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all duration-300 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-white/10 group-hover:bg-slate-900 transition-colors`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">{action.label}</span>
                  </div>
                  <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Command Terminal</p>
              <button className="w-full py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                Generate System Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* DISTRIBUTION */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-slate-900" />
            Unit Distribution
          </h2>
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 h-[400px]">
            <Bar 
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { display: false }, ticks: { font: { size: 10, weight: '900' }, color: '#94a3b8' } },
                  x: { grid: { display: false }, ticks: { font: { size: 10, weight: '900' }, color: '#94a3b8' } }
                }
              }}
            />
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-slate-900" />
            Live Event Log
          </h2>
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <ActivityFeed logs={data.logs} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashBoard;