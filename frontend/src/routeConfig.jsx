import {
  HomeIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  BriefcaseIcon,
  TicketIcon,
  ClipboardDocumentCheckIcon, // <--- Correct Icon
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

// People Module
const peopleLinks = [
  { name: "Home", path: "/people/home", icon: HomeIcon, roles: ["All"] },
  { name: "Profile", path: "/people/profile", icon: UserCircleIcon, roles: ["All"] },
  { name: "Attendance", path: "/people/attendance", icon: CalendarDaysIcon, roles: ["All"] },
  
  // --- TECHNICIAN ONLY LINK (Correct Icon) ---
  { 
    name: "Assigned Tickets", 
    path: "/people/assigned-tickets", 
    icon: ClipboardDocumentCheckIcon, // Matches Header
    technicianOnly: true 
  },
  // ------------------------------------------

  { name: "Time Tracker", path: "/people/timetracker", icon: ClockIcon, roles: ["All"] },
  { name: "Leave Tracker", path: "/leave/summary", icon: BriefcaseIcon, roles: ["All"] },
  { name: "Raise a Ticket", path: "/people/raise", icon: TicketIcon, roles: ["All"] },
];

// Admin Module
const adminLinks = [
  { name: "Dashboard", path: "/admin/dashboard", icon: ChartBarIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "User Management", path: "/admin/userManagement", icon: UsersIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Attendance", path: "/admin/attendance", icon: CalendarDaysIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Leaves", path: "/admin/leaveManagement", icon: BriefcaseIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Time Sheets", path: "/admin/timesheet", icon: ClockIcon, roles: ["Super Admin", "Admin", "HR"] },
  
  // --- HIDE FROM HR ---
  { 
    name: "Ticketing", 
    path: "/admin/assign-ticket", 
    icon: TicketIcon, 
    roles: ["Super Admin", "Admin"] // HR Removed
  },
];

export const moduleConfigs = {
  people: {
    links: peopleLinks,
  },
  
  // --- FIX: Add these keys so the sidebar doesn't crash on these paths ---
  leave: {
    links: peopleLinks, // Show "People" sidebar when on Leave pages
  },
  file: {
    links: peopleLinks, // Show "People" sidebar when on File pages
  },
  faq: {
    links: peopleLinks, // Show "People" sidebar when on FAQ pages
  },
  // -----------------------------------------------------------------------

  // project: {
  //   links: [
  //     { name: "Project DashBoard", path: "/project/projectDashboard", icon: ChartPieIcon },
  //     { name: "Projects", path: "/project/projects", icon: RectangleStackIcon },
  //     { name: "My Tasks", path: "/project/mytasks", icon: ClipboardDocumentListIcon },
  //   ],
  // },
  admin: {
    links: [
      { name: "Admin DashBoard", path: "/admin/adminDashboard", icon: ShieldCheckIcon },
      { name: "Attendance", path: "/admin/attendance", icon: CalendarDaysIcon },
      { name: "User Management", path: "/admin/userManagement", icon: UsersIcon },
      { name: "Leave Management", path: "/admin/leaveTrackerAdmin", icon: BriefcaseIcon },
      { name: "Approve Time Sheets", path: "/admin/approve", icon: CheckBadgeIcon },
      { name: "Assign Ticket", path: "/admin/assign-ticket", icon: TicketIcon },
      { name: "Org Chart", path: "/admin/org-chart", icon: UserGroupIcon },
    ],
  },
};