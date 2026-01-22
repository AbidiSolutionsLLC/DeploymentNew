import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { moduleConfigs } from "../routeConfig";
import { 
  HomeIcon, 
  TicketIcon, 
  CalendarDaysIcon, 
  ClockIcon,
  UserCircleIcon, 
  BriefcaseIcon,
  DocumentIcon,
  UserGroupIcon,
  Squares2X2Icon,
  // New Icons for Project & Admin Flow
  ChartPieIcon,        // Project Dashboard
  RectangleStackIcon,  // Projects list
  ClipboardDocumentListIcon, // Tasks
  ShieldCheckIcon,     // Admin Dashboard
  UsersIcon,           // User Management
  FolderPlusIcon,      // File Management
  CheckBadgeIcon,      // Approve Time Sheets
  TicketIcon as AssignTicketIcon // Assign Ticket
} from "@heroicons/react/20/solid";

const SubNavbarVertical = () => {
  const { pathname } = useLocation();
  const mainModule = pathname.split("/")[1] || "Menu";
  const links = moduleConfigs[mainModule]?.links || [];

  const iconMap = { 
    // People Flow
    "Home": HomeIcon,
    "Profile": UserCircleIcon, 
    "Attendance": CalendarDaysIcon,
    "Time Tracker": ClockIcon,
    "Leave Tracker": BriefcaseIcon,
    "Ticket": TicketIcon,
    "Raise a Ticket": TicketIcon,
    "Ticket List": TicketIcon,

    // File Flow
    "Shared with me": UserGroupIcon,
    "Shared with Role": UserCircleIcon,
    "Upload Document": DocumentIcon,

    // Time Flow
    "Approve Timelogs": CheckBadgeIcon,

    // Project Flow
    "Project DashBoard": ChartPieIcon,
    "Projects": RectangleStackIcon,
    "My Tasks": ClipboardDocumentListIcon,

    // Admin Flow
    "Admin DashBoard": ShieldCheckIcon,
    "Leave Management": BriefcaseIcon,
    "User Management": UsersIcon,
    "File Management": FolderPlusIcon,
    "Approve Time Sheets": CheckBadgeIcon,
    "Assign Ticket": AssignTicketIcon,

    "default": Squares2X2Icon
  };

  if (!links.length) return null;

  return (
    <aside className="w-[5.5rem] h-[85vh] bg-white/90 backdrop-blur-sm rounded-[1.8rem] flex flex-col items-center py-6 z-10 shadow-sm border border-white/50">
      <div className="mb-5">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
          {mainModule}
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full px-2 overflow-y-auto no-scrollbar">
        {links.map((link) => {
          const Icon = iconMap[link.name] || iconMap["default"];
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `w-full py-3 flex flex-col items-center justify-center rounded-[1.2rem] transition-all duration-300 ${
                  isActive 
                    ? "bg-[#E0E5EA] text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-center px-1 leading-tight max-w-[70px]">
                {link.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default SubNavbarVertical;