import React, { useEffect, useState } from 'react';
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
  FaCheckCircle,
  FaUserClock
} from 'react-icons/fa';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import adminDashboardApi from '../../api/adminDashboardApi';
import api from '../../axios'; // Added to fetch user role
import { toast } from 'react-toastify';
import LogListCard from '../../components/LogsListcard';
import PageContainer from '../../components/ui/PageContainer';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminDashBoard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

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

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600 mx-auto"></div>
        <p className="mt-3 text-muted text-xs font-medium uppercase tracking-wide">Loading analytics...</p>
      </div>
    </div>
  );

  if (!data || !user) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
          <FaExclamationCircle className="text-muted text-2xl" />
        </div>
        <p className="text-muted text-sm font-medium">No analytics data available</p>
      </div>
    </div>
  );

  // RBAC UI Flags
  const isHR = user.role === 'HR';
  const showTickets = !isHR; // HR has "None" for Ticketing 

  // --- Chart Configurations ---
  const attendanceChartData = {
    labels: ['Present', 'Absent', 'On Leave'],
    datasets: [{
      data: [data.attendance.Present, data.attendance.Absent, data.attendance.Leave],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderWidth: 2,
      cutout: '75%',
    }]
  };

  const deptChartData = {
    labels: data.charts.departments.labels,
    datasets: [{
      label: 'Staff Count',
      data: data.charts.departments.data,
      backgroundColor: '#3B82F6',
      borderRadius: 8,
      barThickness: 25,
      borderSkipped: false,
    }]
  };

  // --- Components ---
  const StatCard = ({ title, value, icon, color, subtext }) => (
    <div className="glass-card p-6 flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div>
        <p className="text-muted text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-heading">{value}</h3>
        {subtext && <p className="text-xs text-muted mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-4 rounded-xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  );

  const ActionItem = ({ label, count, colorClass, icon }) => (
    <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 mb-3 transition-all duration-150 hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-20 text-${colorClass.split('-')[2] || 'blue'}-600`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-main">{label}</span>
      </div>
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${colorClass} bg-opacity-20`}>
        {count} Pending
      </span>
    </div>
  );

  return (
    <PageContainer
      title={isHR ? "HR Overview" : "Admin Overview"}
      subtitle="Welcome back, here's what's happening today"
      isCard={false}
      headerActions={
        <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-100 px-4 py-2 rounded-xl backdrop-blur-sm shadow-sm">
          <FaUserClock className="text-amber-600" />
          <span className="text-sm font-medium text-heading">
            Updated: <span className="font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </span>
        </div>
      }
    >
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard 
          title="Total Employees" 
          value={data.summary.totalEmployees} 
          icon={<FaUsers size={24} />} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Active Projects" 
          value={data.summary.activeProjects} 
          icon={<FaProjectDiagram size={24} />} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Pending Actions" 
          value={data.summary.pendingApprovals} 
          icon={<FaClipboardList size={24} />} 
          color="bg-amber-500"
          subtext={isHR ? "Leaves Oversight" : "Leaves & Timesheets"}
        />
        {/* Requirement: Hide Tickets for HR  */}
        {showTickets && (
          <StatCard 
            title="Support Tickets" 
            value={data.summary.openTickets} 
            icon={<FaTicketAlt size={24} />} 
            color="bg-rose-500" 
          />
        )}
      </div>

      {/* Charts and Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        
        {/* Attendance Chart Card */}
        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wide flex items-center gap-2">
              <FaClock className="text-amber-600" />
              Today's Attendance
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-muted">Leave</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-48 flex items-center justify-center">
            <Doughnut 
              data={attendanceChartData} 
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                cutout: '70%',
              }} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-heading">
                {Math.round((data.attendance.Present / (data.summary.totalEmployees || 1)) * 100)}%
              </span>
              <span className="text-xs text-muted font-medium uppercase tracking-wide">Present Rate</span>
            </div>
          </div>
        </div>

        {/* Action Center Card */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-heading uppercase tracking-wide mb-4 flex items-center gap-2">
            <FaExclamationCircle className="text-amber-600" />
            Action Center
          </h3>
          
          <div className="space-y-2">
            <ActionItem 
              label="Leave Requests" 
              count={data.actionItems.leaves} 
              colorClass="bg-amber-100 text-amber-700" 
              icon={<FaCalendarDay size={16} />}
            />
            {/* Requirement: Only show Timesheets if not HR (HR is "own" only)  */}
            {!isHR && (
              <ActionItem 
                label="Timesheet Approvals" 
                count={data.actionItems.timesheets} 
                colorClass="bg-amber-100 text-amber-700" 
                icon={<FaClipboardList size={16} />}
              />
            )}
            {/* Requirement: Hide Tickets in Action Center for HR  */}
            {showTickets && (
              <ActionItem 
                label="Open Tickets" 
                count={data.actionItems.tickets} 
                colorClass="bg-rose-100 text-rose-700" 
                icon={<FaTicketAlt size={16} />}
              />
            )}
          </div>
          
          {data.holiday && (
            <div className="mt-6 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                  <FaCalendarCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide">Upcoming Holiday</p>
                  <p className="font-bold text-heading text-sm">{data.holiday.holidayName}</p>
                  <p className="text-xs text-muted font-medium">
                    {new Date(data.holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Distribution */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-heading uppercase tracking-wide flex items-center gap-2">
            <FaChartBar className="text-indigo-600" />
            Workforce Distribution
          </h3>
          <span className="text-xs font-medium text-muted">
            Total: {data.summary.totalEmployees} employees
          </span>
        </div>
        
        <div className="h-60">
          <Bar 
            data={deptChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
                x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } }
              }
            }}
          />
        </div>
      </div>

      {/* Live System Activity */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-heading uppercase tracking-wide">Live System Activity</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-muted">Live Updates</span>
          </div>
        </div>
        
        <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
          {data.logs.map((log, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 py-3 border-b last:border-0 border-border-subtle group hover:bg-white/40 dark:bg-black/20 px-2 rounded-lg transition-colors"
            >
              <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                log.level === 'error' ? 'bg-red-500' : 
                log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-main font-medium truncate">{log.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted font-medium">{log.time}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    log.level === 'error' ? 'bg-red-50 text-red-600' : 
                    log.level === 'warning' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {data.logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
                <FaCheckCircle className="text-muted text-xl" />
              </div>
              <p className="text-muted text-sm font-medium">No recent activities logged</p>
              <p className="text-muted text-xs mt-1">All systems are stable</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 glass-card p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs font-medium text-heading uppercase tracking-wide">
              Active: <span className="font-bold text-heading">{data.summary.totalEmployees} users</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs font-medium text-heading uppercase tracking-wide">
              Pending: <span className="font-bold text-heading">{data.summary.pendingApprovals} actions</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs font-medium text-heading uppercase tracking-wide">
              Projects: <span className="font-bold text-heading">{data.summary.activeProjects} active</span>
            </span>
          </div>
          {/* Requirement: Hide Footer Stat for HR  */}
          {showTickets && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
              <span className="text-xs font-medium text-heading uppercase tracking-wide">
                Tickets: <span className="font-bold text-heading">{data.summary.openTickets} open</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default AdminDashBoard;