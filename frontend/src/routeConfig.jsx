import { PAGE_ICONS } from "./config/pageIcons";

// People Module
const peopleLinks = [
 { name: "Home", path: "/people/home", icon: PAGE_ICONS["/people/home"], roles: ["All"] },
 { name: "Profile", path: "/people/profile", icon: PAGE_ICONS["/people/profile"], roles: ["All"] },
 { name: "Attendance", path: "/people/attendance", icon: PAGE_ICONS["/people/attendance"], roles: ["All"] },
 { name: "Time Tracker", path: "/people/timetracker", icon: PAGE_ICONS["/people/timetracker"], roles: ["All"] },
 { name: "Leave Tracker", path: "/people/summary", icon: PAGE_ICONS["/people/summary"], roles: ["All"] },
  { name: "Raise a Ticket", path: "/people/raise", icon: PAGE_ICONS["/people/raise"], roles: ["All"] },

 {
 name: "Assigned Tickets",
 path: "/people/assigned-tickets",
 icon: PAGE_ICONS["/people/assigned-tickets"],
 technicianOnly: true
 },


 {
 name: "Org Chart",
 path: "/people/org-chart",
 icon: PAGE_ICONS["/people/org-chart"],
 roles: ["All"]
 },

 // --- MOVED TO LAST POSITION ---

];

// Admin Module
export const adminLinks = [
 { name: "Dashboard", path: "/admin/dashboard", icon: PAGE_ICONS["/admin/dashboard"], roles: ["Super Admin", "Admin", "HR", "Global Reader"] },
 { name: "User Management", path: "/admin/userManagement", icon: PAGE_ICONS["/admin/userManagement"], roles: ["Super Admin", "Admin", "HR", "Global Reader"] },
 { name: "Attendance", path: "/admin/attendance", icon: PAGE_ICONS["/admin/attendance"], roles: ["Super Admin", "Admin", "HR", "Global Reader"] },
 { name: "Leaves", path: "/admin/leaveManagement", icon: PAGE_ICONS["/admin/leaveManagement"], roles: ["Super Admin", "Admin", "HR", "Global Reader"] },
 { name: "Time Sheets", path: "/admin/timesheet", icon: PAGE_ICONS["/admin/timesheet"], roles: ["Super Admin", "Admin", "HR", "Global Reader"] },

 // Assign Ticket remains Admin/Super Admin (and Tech Managers) only
  {
    name: "Assign Ticket",
    path: "/admin/assign-ticket",
    icon: PAGE_ICONS["/admin/assign-ticket"],
    roles: ["Super Admin", "Admin"]
  },
 {
 name: "Tenant Management",
 path: "/admin/tenantManagement",
 icon: PAGE_ICONS["/admin/tenantManagement"],
 roles: ["Super Admin", "Admin"]
 }
];

export const moduleConfigs = {
 people: {
 links: peopleLinks,
 },

 leave: {
 links: peopleLinks,
 },
 file: {
 links: peopleLinks,
 },
 faq: {
 links: peopleLinks,
 },
  project: {
    links: [
      { name: "Project DashBoard", path: "/project/projectDashboard", icon: PAGE_ICONS["/project/projectDashboard"], roles: ["All"] },
      { name: "Projects", path: "/project/projects", icon: PAGE_ICONS["/project/projects"], roles: ["All"] },
      { name: "My Tasks", path: "/project/myTasks", icon: PAGE_ICONS["/project/myTasks"], roles: ["All"] },
      { name: "Project Groups", path: "/project/projectGroups", icon: PAGE_ICONS["/project/projectGroups"], roles: ["All"] },
    ],
  },

 admin: {
 links: [
 { name: "Admin DashBoard", path: "/admin/dashboard", icon: PAGE_ICONS["/admin/dashboard"] },
 { name: "Attendance", path: "/admin/attendance", icon: PAGE_ICONS["/admin/attendance"] },
 { name: "User Management", path: "/admin/userManagement", icon: PAGE_ICONS["/admin/userManagement"] },
 { name: "Leave Management", path: "/admin/leaveTrackerAdmin", icon: PAGE_ICONS["/admin/leaveTrackerAdmin"] },
 { name: "Approve Time Sheets", path: "/admin/approve", icon: PAGE_ICONS["/admin/approve"] },
  { name: "Assign Ticket", path: "/admin/assign-ticket", icon: PAGE_ICONS["/admin/assign-ticket"] },
 { name: "Tenant Management", path: "/admin/tenantManagement", icon: PAGE_ICONS["/admin/tenantManagement"] },

 ],
 },
};
