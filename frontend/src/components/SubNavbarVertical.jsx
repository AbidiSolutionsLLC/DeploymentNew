import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { moduleConfigs } from "../routeConfig";
import { useDispatch, useSelector } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { logout } from "../slices/authSlice";
import api from "../axios";
import { useTheme } from "../context/ThemeContext";
import {
 HomeIcon, TicketIcon, CalendarDaysIcon, ClockIcon,
 UserCircleIcon, BriefcaseIcon, DocumentIcon, UserGroupIcon,
 Squares2X2Icon, ChartPieIcon, RectangleStackIcon,
 ClipboardDocumentListIcon, ShieldCheckIcon, UsersIcon,
 FolderPlusIcon, CheckBadgeIcon, TicketIcon as AssignTicketIcon,
 Cog6ToothIcon, ArrowRightOnRectangleIcon, SwatchIcon,
 SunIcon, MoonIcon, ComputerDesktopIcon
} from "@heroicons/react/20/solid";
import { DollarSignIcon } from "lucide-react";
import GlassModal from "./ui/GlassModal";

const SubNavbarVertical = () => {
 const { pathname } = useLocation();
 const navigate = useNavigate();
 const authStateUser = useSelector((state) => state.auth.user);
 const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;

 const mainModule = pathname.split("/")[1] || "Menu";
 const rawLinks = moduleConfigs[mainModule]?.links || [];

 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
 const settingsRef = useRef(null);
 const dispatch = useDispatch();
 const { instance } = useMsal();

 // Theme support
 const { themeMode, setThemeMode } = useTheme();

 useEffect(() => {
 function handleClickOutside(event) {
 if (settingsRef.current && !settingsRef.current.contains(event.target)) {
 setIsSettingsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, {
        headers: { _isLogoutRequest: true }
      });
    } catch (err) {
      console.warn("Logout API failed:", err.message);
    } finally {
      dispatch(logout());
      
      const accounts = instance?.getAllAccounts?.();
      if (accounts && accounts.length > 0) {
        instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
      } else {
        navigate("/auth/login");
      }
    }
  };

 // --- RBAC Link Filtering Logic ---
 const filteredLinks = rawLinks.filter(link => {
 if (!user) return false;

 if (link.name === "Assigned Tickets") {
 const isTech = user.isTechnician || user.role === "Technician";
 const isManagerTech = user.role === "Manager" && user.isTechnician;
 return user.role === "Super Admin" || isTech || isManagerTech;
 }
 if (link.name === "Assign Ticket") {
 const isManagerTech = user.role === "Manager" && user.isTechnician;
 return user.role === "Super Admin" || user.role === "Admin" || isManagerTech;
 }
 if (link.name === "User Management") {
 return ["Super Admin", "Admin", "HR"].includes(user.role);
 }
 if (link.name === "Approve Time Sheets") {
 return user.role !== "HR";
 }

 return true;
 });

 const iconMap = {
 "Home": HomeIcon, "Profile": UserCircleIcon, "Attendance": CalendarDaysIcon,
 "Time Tracker": ClockIcon, "Leave Tracker": BriefcaseIcon, "Ticket": TicketIcon,
 "Raise a Ticket": TicketIcon, "Ticket List": TicketIcon, "Shared with me": UserGroupIcon,
 "Shared with Role": UserCircleIcon, "Upload Document": DocumentIcon, "Approve Timelogs": CheckBadgeIcon,
 "Project DashBoard": ChartPieIcon, "Projects": RectangleStackIcon, "My Tasks": ClipboardDocumentListIcon,
 "Admin DashBoard": ShieldCheckIcon, "Leave Management": BriefcaseIcon, "User Management": UsersIcon,
 "File Management": FolderPlusIcon, "Approve Time Sheets": CheckBadgeIcon, "Assign Ticket": AssignTicketIcon,
 "Assigned Tickets": AssignTicketIcon,
 "Expense Tracker": DollarSignIcon,
 "Org Chart": UserGroupIcon,
 "default": Squares2X2Icon
 };

 if (!filteredLinks.length) return null;

 return (
 <>
 {/* ─── Sub Sidebar Panel ─── */}
 <aside
 className="w-[5.5rem] h-full rounded-[2rem] flex flex-col items-center pb-6 z-[70] shadow-sm border relative theme-sidebar-panel"
 >
 {/* ── Logo header ── */}
 <div className="w-full py-4 flex items-center justify-center mb-2 rounded-t-[2rem] theme-sidebar-header">
 <div className="w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md rounded-[6px] theme-brand-badge">
 A
 </div>
 </div>

 {/* ── Module label ── */}
 <div className="flex flex-col items-center mb-2">
 <span className="text-[10px] font-black uppercase tracking-widest block theme-sidebar-label">
 {mainModule}
 </span>
 </div>

 {/* ── Nav Links ── */}
 <div className="flex-1 w-full px-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
 {filteredLinks.map((link) => {
 const Icon = iconMap[link.name] || iconMap["default"];
 return (
 <NavLink
 key={link.name}
 to={link.path}
 className={({ isActive }) =>
 `w-full py-3 flex flex-col items-center justify-center rounded-[1.2rem] theme-sidebar-item${isActive ? " theme-active" : ""}`
 }
 >
 <Icon className="w-5 h-5 mb-1.5" />
 <span className="text-[9px] font-bold uppercase tracking-tight text-center px-1 leading-tight max-w-[70px]">
 {link.name}
 </span>
 </NavLink>
 );
 })}
 </div>

 {/* ── Settings / bottom section ── */}
 <div
 className="pt-1 w-full px-2 flex flex-col items-center flex-shrink-0 relative"
 style={{ borderTop: "1px solid var(--color-border-accent)" }}
 ref={settingsRef}
 >
 <button
 id="settings-toggle-btn"
 onClick={() => setIsSettingsOpen(!isSettingsOpen)}
 className={`w-full py-2 flex flex-col items-center justify-center rounded-[1.2rem] theme-sidebar-item${isSettingsOpen ? " theme-active" : ""}`}
 >
 <Cog6ToothIcon className="h-5 w-5" />
 <span className="text-[9px] font-bold uppercase mt-1">Settings</span>
 </button>

 {/* ── Settings Dropdown ── */}
 {isSettingsOpen && (
 <div
 className="absolute left-full bottom-0 ml-2 w-56 rounded-xl py-1 z-[80] overflow-hidden
 animate-in fade-in slide-in-from-left-2 duration-200 theme-settings-panel"
 >
 {/* Header */}
 <div className="px-4 py-2 theme-settings-header">
 <p className="text-xs font-semibold uppercase tracking-wider">Settings</p>
 </div>

 {/* ── Theme Picker ── */}
 <div
 className="px-4 py-3"
 style={{ borderBottom: "1px solid var(--color-border-accent)" }}
 >
 <div className="flex items-center gap-1.5 mb-2.5">
 <SwatchIcon className="w-3.5 h-3.5" style={{ color: "var(--color-brand-primary)" }} />
 <p className="text-xs font-semibold uppercase tracking-wider theme-settings-header" style={{ border: "none" }}>
 Theme
 </p>
 </div>
 <div className="flex gap-2 flex-wrap">
 {[{id: "light", icon: <SunIcon className="w-4 h-4" />, label: "Light"}, {id: "dark", icon: <MoonIcon className="w-4 h-4" />, label: "Dark"}, {id: "system", icon: <ComputerDesktopIcon className="w-4 h-4" />, label: "System"}].map((t) => {
 const isActive = themeMode === t.id;
 return (
 <button
 key={t.id}
 title={t.label}
 id={`theme-swatch-${t.id}`}
 onClick={() => setThemeMode(t.id)}
 className={`theme-swatch${isActive ? " selected" : ""}`}
 style={{
 backgroundColor: "var(--color-bg-secondary)",
 color: isActive ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
 boxShadow: isActive
 ? `0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-brand-primary)`
 : "0 1px 3px rgba(0,0,0,0.25)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 width: "32px",
 height: "32px",
 borderRadius: "50%"
 }}
 aria-label={`Apply ${t.label} theme`}
 aria-pressed={isActive}
 >
 <span className="text-sm">{t.icon}</span>
 </button>
 );
 })}
 </div>
 {/* Active theme name */}
 <p className="mt-2 text-[10px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
 {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} Mode
 </p>
 </div>

 {/* ── Sign Out ── */}
 <button
 id="settings-signout-btn"
 onClick={() => {
 setIsSettingsOpen(false);
 setIsLogoutModalOpen(true);
 }}
 className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-red-500 hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/20"
 >
 <ArrowRightOnRectangleIcon className="h-4 w-4" />
 Sign out
 </button>
 </div>
 )}
 </div>
 </aside>

      {/* ── Logout Confirm Modal (Portal) ── */}
      {isLogoutModalOpen && (
        <GlassModal
          isOpen={true}
          onClose={() => setIsLogoutModalOpen(false)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--color-text-heading)" }}>
                Confirm Sign Out
              </h3>
            </div>
          }
          footer={
            <div className="flex justify-end gap-3 w-full">
              <button
                id="logout-cancel-btn"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition-colors theme-settings-item"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                Cancel
              </button>
              <button
                id="logout-confirm-btn"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 rounded-xl transition-colors flex items-center gap-2"
              >
                Sign Out
              </button>
            </div>
          }
          maxWidth="max-w-sm"
        >
          <p className="text-sm pl-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Are you sure you want to sign out? You will need to log back in to access your dashboard.
          </p>
        </GlassModal>
      )}
    </>
 );
};

export default SubNavbarVertical;