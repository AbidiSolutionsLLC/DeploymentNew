import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { moduleConfigs } from "../routeConfig";
import { useSelector } from "react-redux";
import {
  HomeIcon, TicketIcon, CalendarDaysIcon, ClockIcon,
  UserCircleIcon, BriefcaseIcon, DocumentIcon, UserGroupIcon,
  Squares2X2Icon, ChartPieIcon, RectangleStackIcon,
  ClipboardDocumentListIcon, ShieldCheckIcon, UsersIcon,
  FolderPlusIcon, CheckBadgeIcon,
  UserPlusIcon, ClipboardDocumentCheckIcon,
  Cog6ToothIcon, SquaresPlusIcon
} from "@heroicons/react/20/solid";
import { DollarSignIcon } from "lucide-react";
import { FaSitemap } from "react-icons/fa";
import { motion as Motion } from "framer-motion";
import SettingsModal from "./SettingsModal";

const EASE = [0.16, 1, 0.3, 1];

const SubNavbarVertical = () => {
  const { pathname } = useLocation();
  const { hasPermission } = usePermission();
  const authStateUser = useSelector((state) => state.auth.user);
  const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;

  const mainModule = pathname.split("/")[1] || "Menu";
  const rawLinks = moduleConfigs[mainModule]?.links || [];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- RBAC Link Filtering Logic ---
  const filteredLinks = rawLinks.filter(link => {
    if (!user) return false;

    const permMap = {
      "User Management": "users:read",
      "Approve Time Sheets": "timesheets:approve",
      "Assign Ticket": "tickets:admin_assign",
      "Assigned Tickets": "tickets:assign",
      "Expense Tracker": "expenses:approve",
      "Expense Management": "expenses:approve",
      "Payroll": "payroll:manage",
      "Tenant Management": "tenant:manage",
      "Leave Management": "leaves:approve",
      "Leave Tracker Admin": "leaves:approve",
      "Upload Document": "files:manage",
      "File Management": "files:manage"
    };

    if (link.name === "Tenant Management") {
      return user?.company?.isMasterTenant === true && hasPermission("tenant:manage");
    }

    const requiredPerm = permMap[link.name];
    if (requiredPerm) {
      return hasPermission(requiredPerm);
    }

    return true;
  });

  const iconMap = {
    "Home": HomeIcon, "Profile": UserCircleIcon, "Attendance": CalendarDaysIcon,
    "Time Tracker": ClockIcon, "Leave Tracker": BriefcaseIcon, "Ticket": TicketIcon,
    "Raise a Ticket": TicketIcon, "Ticket List": TicketIcon, "Shared with me": UserGroupIcon,
    "Shared with Role": UserCircleIcon, "Upload Document": DocumentIcon, "Approve Timelogs": CheckBadgeIcon,
    "Project Portal": SquaresPlusIcon,
    "Project DashBoard": ChartPieIcon, "Project Dashboard": ChartPieIcon, "Projects": RectangleStackIcon, "My Tasks": ClipboardDocumentListIcon, "Project Groups": FolderPlusIcon,
    "Admin DashBoard": ShieldCheckIcon, "Leave Management": BriefcaseIcon, "User Management": UsersIcon,
    "File Management": FolderPlusIcon, "Approve Time Sheets": CheckBadgeIcon,
    "Assign Ticket": UserPlusIcon,
    "Assigned Tickets": ClipboardDocumentCheckIcon,
    "Tenant Management": Squares2X2Icon,
    "Expense Tracker": DollarSignIcon,
    "Payroll": DollarSignIcon,
    "Org Chart": FaSitemap,
    "default": Squares2X2Icon
  };

  if (!filteredLinks.length) return null;

  return (
    <>
      {/* ─── Sub Sidebar Panel ─── */}
      <aside
        className="w-full sm:w-[5.5rem] h-full rounded-[2rem] flex flex-col items-center pb-6 z-[70] shadow-sm border relative overflow-visible theme-sidebar-panel glimmer-border"
      >
        {/* ── Drifting gold aura ── */}
        <span aria-hidden className="glam-aura">
          <i
            style={{
              top: "-8%", left: "-35%", width: "130%", height: "34%",
              background: "radial-gradient(circle, rgba(212,175,55,0.55), transparent 70%)",
            }}
          />
          <i
            style={{
              bottom: "4%", right: "-45%", width: "120%", height: "30%",
              background: "radial-gradient(circle, rgba(184,134,11,0.4), transparent 70%)",
              animationDelay: "-6s",
            }}
          />
        </span>

        {/* ── Logo header ── */}
        <div className="w-full py-4 flex items-center justify-center mb-2 rounded-t-[2rem] relative z-10 theme-sidebar-header">
          <div className="relative">
            <div className="w-7 h-7 flex items-center justify-center text-xs font-black shadow-[0_6px_18px_rgba(212,175,55,0.55)] rounded-[9px] theme-brand-badge">
              K
            </div>
          </div>
        </div>

        {/* ── Module label ── */}
        <Motion.div
          key={mainModule}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center mb-3 relative z-10"
        >
          <span className="text-[10px] font-black uppercase tracking-widest block gradient-anim-text">
            {mainModule}
          </span>
          <span
            aria-hidden
            className="mt-1 h-[2px] w-6 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-brand-primary), transparent)",
            }}
          />
        </Motion.div>

        {/* ── Nav Links ── */}
        <div className="flex-1 w-full px-1 overflow-y-auto no-scrollbar flex flex-col gap-2 relative z-10">
          {filteredLinks.map((link, index) => {
            const Icon = link.icon || iconMap[link.name] || iconMap["default"];
            return (
              <Motion.div
                key={link.name}
                initial={{ opacity: 0, x: -16, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.06 + index * 0.05, ease: EASE }}
              >
                <NavLink
                  to={link.path}
                  className={({ isActive }) => {
                    const isCurrentActive =
                      isActive ||
                      (link.path === "/project/projects" &&
                        (pathname.startsWith("/project/projectDetailed") || pathname.startsWith("/project/projects/")));
                    return `relative w-full py-3 flex flex-col items-center justify-center rounded-[1.2rem] overflow-visible transition-shadow duration-300 theme-sidebar-item ${
                      isCurrentActive ? "theme-active" : ""
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const isCurrentActive =
                      isActive ||
                      (link.path === "/project/projects" &&
                        (pathname.startsWith("/project/projectDetailed") || pathname.startsWith("/project/projects/")));
                    return (
                      <>
                        <Motion.span className="relative z-10 mb-1.5 flex items-center justify-center">
                          <Icon
                            className={`w-5 h-5 ${
                              isCurrentActive
                                ? "nav-shine-icon"
                                : "drop-shadow-[0_2px_6px_rgba(212,175,55,0.25)]"
                            }`}
                          />
                        </Motion.span>

                        <span
                          className={`relative z-10 text-[9px] font-bold uppercase tracking-tight text-center px-1 leading-tight max-w-[70px] ${
                            isCurrentActive ? "nav-shine-text" : ""
                          }`}
                        >
                          {link.name}
                        </span>
                      </>
                    );
                  }}
                </NavLink>
              </Motion.div>
            );
          })}
        </div>

        {/* ── Settings trigger ── */}
        <div
          className="pt-2 w-full px-2 flex flex-col items-center flex-shrink-0 relative z-10"
          style={{ borderTop: "1px solid var(--color-border-accent)" }}
        >
          <Motion.button
            id="settings-toggle-btn"
            onClick={() => setIsSettingsOpen(true)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="relative w-full py-2 flex flex-col items-center justify-center rounded-[1.2rem] transition-colors duration-300 theme-sidebar-item"
          >
            <Motion.span
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex items-center justify-center"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Motion.span>
            <span className="text-[9px] font-bold uppercase mt-1">Settings</span>
          </Motion.button>
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default SubNavbarVertical;
