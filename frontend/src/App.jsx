import { Routes, Route, Navigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";

// Layouts
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";

// Pages
import ThemeSelector from "./pages/ThemeSelector";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Home from "./pages/people/Home";
import TimeTracker from "./pages/people/TimeTracker";
import Files from "./pages/people/Files";
import Profile from "./pages/people/Profile";
import Attendance from "./pages/people/Attendance";
import EditProfile from "./pages/people/EditProfile";
import LeaveTracker from "./pages/people/LeaveTracker";
import LeaveTrackerAdmin from "./pages/people/LeaveTrackerAdmin";
import FileTabs from "./pages/people/FileTabs";
import ProjectDashBoard from "./pages/projects/ProjectDashBoard";
import Projects from "./pages/projects/Projects";
import Project from "./pages/projects/Project";
import UserManagement from "./pages/admin/UserManagement";
import LeaveRequest from "./pages/people/LeaveRequest";
import ApproveTimesheets from "./pages/people/ApproveTimesheets";
import { ToastContainer } from "react-toastify";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import "react-toastify/dist/ReactToastify.css";
import Ticket from "./pages/tickets/Ticket";
import AdminTickets from "./pages/tickets/AdminTickets";
import AdminDashBoard from "./pages/admin/AdminDashBoard";
import ActivityLogs from "./pages/admin/ActivityLogs";
import MyTask from "./pages/projects/MyTask";
import useAutoLogin from "./hooks/useAutoLogin";
import { TimeLogProvider } from "../src/pages/people/TimeLogContext";
import Role from "./pages/people/SharedWithRole";
import UploadDocument from "./pages/people/UploadDocument";
import FAQs from "./pages/people/FAQ";
import AssignTicket from "./pages/tickets/AssignTickets";
import ProjectDetail from "./pages/projects/ProjectDetail";
import ComingSoon from "./pages/projects/ComingSoon";
import OrgChartPage from "./pages/admin/OrgChart";
import AssignedTickets from "./pages/people/AssignedTickets";
import AdminAttendance from "./pages/admin/AdminAttendance";
import ExpenseManagement from "./pages/admin/ExpenseManagement";
import PayrollManagement from "./pages/admin/PayrollManagement";
import TenantManagement from "./pages/admin/TenantManagement";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import { useNotificationSSE } from "./hooks/useNotificationSSE";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MobileBlock from "./components/MobileBlock";
import GlassModal from "./components/ui/GlassModal";
import GlassButton from "./components/ui/GlassButton";

function App() {
 useAutoLogin();

 const [isMobileDevice, setIsMobileDevice] = useState(false);
 const [isReadOnlyOpen, setIsReadOnlyOpen] = useState(false);

 useEffect(() => {
   const handler = () => setIsReadOnlyOpen(true);
   window.addEventListener('showReadOnlyModal', handler);
   return () => window.removeEventListener('showReadOnlyModal', handler);
 }, []);

 useEffect(() => {
  const checkMobile = () => {
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // 1. Check for pointer: coarse (Primary indicator for touch devices)
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  
  // 2. Check for touch points (survives "Desktop site" mode)
  const hasTouchPoints = navigator.maxTouchPoints > 0;

  // 3. Screen width check to prevent touch-enabled laptops from being blocked
  const isSmallScreen = window.innerWidth <= 1024;

  // Block if it's a known mobile user agent, OR if it has touch capabilities AND a small screen
  setIsMobileDevice(isMobileUA || ((isCoarsePointer || hasTouchPoints) && isSmallScreen));
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
  }, []);

 // Activate real-time notification stream (uses MSAL token internally)
 const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
 const authStateUser = useSelector((s) => s.auth.user);
 const dispatch = useDispatch();

 // PERMANENT FIX: Auto-normalize cached nested user objects from Redux Persist
 useEffect(() => {
 if (authStateUser && (authStateUser.data?.user || authStateUser.user)) {
 const normalizedUser = authStateUser.data?.user || authStateUser.user;
 dispatch({ type: 'auth/setAuthUser', payload: normalizedUser });
 console.log("Auto-normalized Redux Persist user object structure");
 }
 }, [authStateUser, dispatch]);

 useNotificationSSE(isAuthenticated);

 if (isMobileDevice) {
 return <MobileBlock />;
 }

 return (

 <>
 <ToastContainer
 position="top-right"
 autoClose={3000}
 hideProgressBar={true}
 newestOnTop
 closeOnClick
 pauseOnHover
 draggable
 theme="light"
 limit={1}
 className="!z-[99999999]"
 style={{ zIndex: 99999999 }}
 />

 <GlassModal
 isOpen={isReadOnlyOpen}
 onClose={() => setIsReadOnlyOpen(false)}
 title="Read-Only Access"
 maxWidth="max-w-md"
 footer={
 <GlassButton variant="primary" onClick={() => setIsReadOnlyOpen(false)}>
 Understood
 </GlassButton>
 }
 >
 <div className="p-4">
 <p className="text-muted dark:text-muted">
 As a <strong>Global Reader</strong>, you can explore the features but you do not have permission to modify data or perform this action.
 </p>
 </div>
 </GlassModal>

 <Routes>
 <Route path="/" element={<Navigate to="/auth/login" />} />

 <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route index path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
        </Route>

 <Route path="/theme-selector" element={<ThemeSelector />} />

 {/* --- GLOBAL PORTAL LAYOUT --- */}
 <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>

 {/* --- PEOPLE PORTAL --- */}
 <Route path="/people/*">
 <Route index element={<Navigate to="/people/home" />} />
 <Route path='home' element={<Home />} />
 <Route path="timetracker" element={<TimeTracker />} />
 <Route index path="summary" element={<LeaveTracker />} />
 <Route index path="shared" element={<Files />} />
 <Route index path="raise" element={<Ticket />} />
 <Route path="assigned-tickets" element={<PrivateRoute requiredPermission="tickets:assign"><AssignedTickets /></PrivateRoute>} />
 <Route index path="history" element={<TimeTracker />} />
 <Route path="attendance" element={<Attendance />} />
 <Route path="edit-profile" element={<EditProfile />} />
 <Route path="FAQs" element={<FAQs />} />
 <Route path="profile" element={<Profile />} />
 <Route path="profile/:id" element={<Profile />} />
 <Route path="org-chart" element={<OrgChartPage />} />
 </Route>

 <Route path="/leave/*">
 <Route index element={<Navigate to="/people/summary" />} />
 <Route path="request" element={<LeaveRequest />} />
 <Route path="leaveTrackerAdmin" element={<LeaveTrackerAdmin />} />
 </Route>

 <Route path="/file/*">
 <Route index element={<Navigate to="/file/shared" />} />
 <Route index path="shared" element={<Files />} />
 <Route path="role" element={<Role />} />
 <Route path="upload" element={<UploadDocument />} />
 </Route>

 <Route path="/project/*">
 <Route index element={<ComingSoon />} />
 <Route path="projectDashboard" element={<ComingSoon />} />
 <Route path="projects" element={<ComingSoon />} />
 <Route path="projectDetailed/:id" element={<ComingSoon />} />
 </Route>

 <Route path="/faq/*">
 <Route index element={<FAQs />} />
 </Route>

 <Route path="/admin/*">
 <Route index element={<Navigate to="dashboard" replace />} />
 <Route index path="dashboard" element={<AdminDashBoard />} />
 <Route path="leaveTrackerAdmin" element={<PrivateRoute requiredPermission="leaves:approve"><LeaveTrackerAdmin /></PrivateRoute>} />
 <Route path="upload" element={<PrivateRoute requiredPermission="files:manage"><UploadDocument /></PrivateRoute>} />
 <Route path="userManagement" element={<PrivateRoute requiredPermission="users:read"><UserManagement /></PrivateRoute>} />
 <Route path="approve" element={<PrivateRoute requiredPermission="timesheets:approve"><ApproveTimesheets /></PrivateRoute>} />
 <Route path="assign-ticket" element={<PrivateRoute requiredPermission="tickets:assign"><AdminTickets /></PrivateRoute>} />
 <Route path="assign-ticket/:ticketId" element={<PrivateRoute requiredPermission="tickets:assign"><AssignTicket /></PrivateRoute>} />
 <Route path="attendance" element={<PrivateRoute requiredPermission="attendance:read:team"><AdminAttendance /></PrivateRoute>} />
 <Route path="ExpenseManagement" element={<PrivateRoute requiredPermission="expenses:approve"><ExpenseManagement /></PrivateRoute>} />
 <Route path="payroll" element={<PrivateRoute requiredPermission="payroll:manage"><PayrollManagement /></PrivateRoute>} />
 <Route path="tenantManagement" element={<PrivateRoute requiredPermission="tenant:manage"><TenantManagement /></PrivateRoute>} />
 </Route>

 {/* Notifications Page */}
 <Route path="/notifications" element={<NotificationsPage />} />

 {/* Catch-all 404 Route for broken links */}
 <Route path="*" element={
 <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
 <h1 className="text-6xl font-black text-amber-500 mb-4">404</h1>
 <h2 className="text-2xl font-bold text-heading mb-2">Page Not Found</h2>
 <p className="text-muted mb-6">The page or feature you are looking for doesn't exist or has been removed.</p>
 </div>
 } />
 </Route>
 </Routes>
 </>
 );
}

export default App;