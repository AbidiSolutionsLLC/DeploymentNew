import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
 UserGroupIcon,
 SquaresPlusIcon,
 AdjustmentsHorizontalIcon,
 BellIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { useSelector } from "react-redux";

const NavbarVertical = ({ onNotificationClick }) => {
 const [hoveredItem, setHoveredItem] = useState(null);
 const authStateUser = useSelector((state) => state.auth.user);
 const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
 const location = useLocation();
 const navigate = useNavigate();
 const unreadCount = useSelector((s) => s.notifications?.unreadCount ?? 0);

 const hasRole = (allowedRoles) => {
 if (!user || !user.role) return false;
 return allowedRoles.includes(user.role);
 };

 const navLinks = [
 { name: "People", to: "/people", icon: UserGroupIcon, show: true },
 { name: "Project", to: "/project", icon: SquaresPlusIcon, show: true },
 {
 name: "Admin",
 to: "/admin",
 icon: AdjustmentsHorizontalIcon,
 show: hasRole(["Super Admin", "Admin", "HR", "Manager"]),
 },
 ];

 const isLinkActive = (item) => {
 if (item.name === "People") {
 return ["/people", "/leave", "/file", "/faq"].some((path) =>
 location.pathname.startsWith(path)
 );
 }
 return location.pathname.startsWith(item.to);
 };

 const handleNotificationToggle = () => {
 if (location.pathname === "/notifications") {
 navigate("/");
 } else {
 navigate("/notifications");
 }
 };

 const isNotifActive = location.pathname === "/notifications";

 return (
 <>
 {/* ── Notification Bell — bottom-left of sidebar ── */}
 <div className="absolute bottom-8 left-[-5px] z-[80]">
 <button
 id="nav-notification-bell"
 onClick={handleNotificationToggle}
 onMouseEnter={() => setHoveredItem("notifications")}
 onMouseLeave={() => setHoveredItem(null)}
 aria-label="Notifications"
 className={`relative w-10 h-10 flex items-center justify-center transition-all duration-300 shadow-md rounded-xl ${
 isNotifActive ? "theme-bell-active translate-y-[2px] shadow-sm" : "theme-bell-default"
 }`}
 >
 <BellIcon className="w-5 h-5" />

 {/* Unread badge */}
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none select-none border-2 border-white shadow-sm">
 {unreadCount > 99 ? "99+" : unreadCount}
 </span>
 )}
 </button>

 {/* Tooltip */}
 {hoveredItem === "notifications" && (
 <div
 className="absolute top-1/2 left-full -translate-y-1/2 ml-3 px-3 py-1.5
 text-white text-xs font-medium rounded-lg shadow-lg
 whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none theme-tooltip"
 >
 Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
 {/* Arrow */}
 <div
 className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2
 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent"
 style={{ borderRightColor: "var(--color-brand-accent)" }}
 />
 </div>
 )}
 </div>

 {/* ── Main nav links ── */}
 <nav className="w-[2.75rem] flex flex-col items-end gap-2 mt-20 bg-transparent z-[80] relative">
 {navLinks
 .filter((item) => item.show)
 .map((item) => {
 const active = isLinkActive(item);

 return (
 <div key={item.name} className="relative">
 <NavLink
 to={item.to}
 onMouseEnter={() => setHoveredItem(item.name)}
 onMouseLeave={() => setHoveredItem(null)}
 className={() =>
 `relative flex items-center justify-center w-[3rem] h-[3rem] transition-all duration-300 theme-sidebar-item rounded-l-2xl ${
 active
 ? "theme-active rounded-l-3xl translate-x-[1px] shadow-[-2px_0_8px_rgba(0,0,0,0.08)]"
 : ""
 }`
 }
 >
 <item.icon className="w-6 h-6" />
 </NavLink>

 {hoveredItem === item.name && (
 <div
 className="absolute top-1/2 left-full -translate-y-1/2 ml-3 px-3 py-1.5
 text-white text-xs font-medium rounded-lg shadow-lg
 whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none theme-tooltip"
 >
 {item.name}
 {/* Arrow */}
 <div
 className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2
 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent"
 style={{ borderRightColor: "var(--color-brand-accent)" }}
 />
 </div>
 )}
 </div>
 );
 })}
 </nav>
 </>
 );
};

export default NavbarVertical;