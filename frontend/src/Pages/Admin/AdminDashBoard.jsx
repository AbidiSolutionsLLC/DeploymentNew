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
import { getAdminDashboardStats } from '../../api/adminDashboardApi';
import { toast } from 'react-toastify';
import LogListCard from '../../Components/LogsListcard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminDashBoard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminDashboardStats();
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600 mx-auto"></div>
        <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading analytics...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FaExclamationCircle className="text-slate-400 text-2xl" />
        </div>
        <p className="text-slate-500 text-sm font-medium">No analytics data available</p>
      </div>
    </div>
  );

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
    <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-6 flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
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
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${colorClass} bg-opacity-20`}>
        {count} Pending
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent p-2">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Admin Overview</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">Welcome back, here's what's happening today</p>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
            <FaUserClock className="text-blue-600" />
            <span className="text-sm font-medium text-slate-800">
              Updated: <span className="font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard 
          title="Total Employees" 
          value={data.summary.totalEmployees} 
          icon={<FaUsers size={24} />} 
          color="bg-blue-500" 
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
          subtext="Leaves & Timesheets"
        />
        <StatCard 
          title="Support Tickets" 
          value={data.summary.openTickets} 
          icon={<FaTicketAlt size={24} />} 
          color="bg-rose-500" 
        />
      </div>

      {/* Charts and Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        
        {/* Attendance Chart Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FaClock className="text-blue-600" />
              Today's Attendance
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-slate-600">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-slate-600">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-slate-600">Leave</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-48 flex items-center justify-center">
            <Doughnut 
              data={attendanceChartData} 
              options={{
                plugins: { 
                  legend: { 
                    display: false 
                  } 
                },
                maintainAspectRatio: false,
                cutout: '70%',
              }} 
            />
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">
                {Math.round((data.attendance.Present / (data.summary.totalEmployees || 1)) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Present Rate</span>
            </div>
          </div>
        </div>

        {/* Action Center Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
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
            <ActionItem 
              label="Timesheet Approvals" 
              count={data.actionItems.timesheets} 
              colorClass="bg-blue-100 text-blue-700" 
              icon={<FaClipboardList size={16} />}
            />
            <ActionItem 
              label="Open Tickets" 
              count={data.actionItems.tickets} 
              colorClass="bg-rose-100 text-rose-700" 
              icon={<FaTicketAlt size={16} />}
            />
          </div>
          
          {/* Holiday Widget */}
          {data.holiday && (
            <div className="mt-6 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                  <FaCalendarCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide">Upcoming Holiday</p>
                  <p className="font-bold text-slate-800 text-sm">{data.holiday.holidayName}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(data.holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Distribution */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FaChartBar className="text-indigo-600" />
            Workforce Distribution
          </h3>
          <span className="text-xs font-medium text-slate-500">
            Total: {data.summary.totalEmployees} employees
          </span>
        </div>
        
        <div className="h-60">
          <Bar 
            data={deptChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false } 
              },
              scales: {
                y: { 
                  beginAtZero: true, 
                  grid: { 
                    color: 'rgba(0,0,0,0.05)',
                    drawBorder: false
                  },
                  ticks: {
                    font: {
                      size: 11
                    },
                    color: '#64748b'
                  }
                },
                x: { 
                  grid: { 
                    display: false 
                  },
                  ticks: {
                    font: {
                      size: 11
                    },
                    color: '#64748b'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Live System Activity */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Live System Activity</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-500">Live Updates</span>
          </div>
        </div>
        
        <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
          {data.logs.map((log, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 py-3 border-b last:border-0 border-slate-100 group hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
            >
              <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                log.level === 'error' ? 'bg-red-500' : 
                log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium truncate">{log.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500 font-medium">{log.time}</span>
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
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FaCheckCircle className="text-slate-400 text-xl" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No recent activities logged</p>
              <p className="text-slate-400 text-xs mt-1">All systems are stable</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Active: <span className="font-bold text-slate-800">{data.summary.totalEmployees} users</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Pending: <span className="font-bold text-slate-800">{data.summary.pendingApprovals} actions</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Projects: <span className="font-bold text-slate-800">{data.summary.activeProjects} active</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
              Tickets: <span className="font-bold text-slate-800">{data.summary.openTickets} open</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashBoard;
