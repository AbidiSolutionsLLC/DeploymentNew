import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  UsersIcon,
  Cog6ToothIcon,
  BellIcon,
  ComputerDesktopIcon,
  FolderIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { IoHomeOutline } from "react-icons/io5";
import { IoTicketOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { TbBeach } from "react-icons/tb";
import { GrProjects } from "react-icons/gr";
import api from "../axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { TbUserQuestion } from "react-icons/tb";
import { logout } from "../slices/authSlice";
import NotificationBell from "./NotificationBell";

import { IconButton } from "@material-tailwind/react";

const Navbar = () => {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
 const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
 const navigate = useNavigate();
 const location = useLocation();
 const currentPath = location.pathname;
 const profileDropdownRef = useRef(null);
 const themeDropdownRef = useRef(null);
 const dispatch = useDispatch();
 const [openNav, setOpenNav] = useState(false);

 const { user } = useSelector((state) => state.auth);
 const profileImage = user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e";

 useEffect(() => {
 const savedTheme = localStorage.getItem("theme") || "system";
 applyTheme(savedTheme);

 if (savedTheme === "system") {
 const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
 const handleChange = () => applyTheme("system");
 mediaQuery.addEventListener("change", handleChange);
 return () => mediaQuery.removeEventListener("change", handleChange);
 }
 }, []);

 const applyTheme = (selectedTheme) => {
 const root = document.documentElement;
 root.classList.remove("theme-light", "theme-dark");
 if (selectedTheme === "light") root.classList.add("theme-light");
 else if (selectedTheme === "dark") root.classList.add("theme-dark");
 else {
 const prefersDark = window.matchMedia(
 "(prefers-color-scheme: dark)"
 ).matches;
 root.classList.add(prefersDark ? "theme-dark" : "theme-light");
 }
 };

 useEffect(() => {
 const handleClickOutside = (event) => {
 if (
 profileDropdownRef.current &&
 !profileDropdownRef.current.contains(event.target)
 ) {
 setProfileDropdownOpen(false);
 }
 if (
 themeDropdownRef.current &&
 !themeDropdownRef.current.contains(event.target)
 ) {
 setThemeDropdownOpen(false);
 }
 };

 document.addEventListener("mousedown", handleClickOutside);
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, []);

 const handleLogout = async () => {
 try {
 await api.post("/auth/logout", {}, {
 withCredentials: true,
 _skipAuth: true,
 _isLogoutRequest: true
 });
 dispatch(logout());
 localStorage.removeItem("accessToken");
 navigate("/auth/login");
 toast.success("Logged out successfully");
 } catch (err) {
 console.warn("Logout API failed:", err.message);
 dispatch(logout());
 localStorage.removeItem("accessToken");
 navigate("/auth/login");
 }
 };

  const baseNavLinks = [
    { name: "Peoples", to: "/people", icon: UsersIcon },
    { name: "Projects", to: "/project", icon: FolderIcon },
    { name: "Admin", to: "/admin", icon: Cog6ToothIcon },
  ];

  // Only show Admin portal to specific roles
  const allowedAdminRoles = ["superadmin", "admin", "hr", "manager", "globalreader"];
  const userRole = (user?.role || "").replace(/\s+/g, "").toLowerCase();
  
  const hasProjectAccess = ["superadmin", "admin"].includes(userRole) || Boolean(user?.hasProjectPortalAccess || user?.user?.hasProjectPortalAccess);
  const navLinks = baseNavLinks.filter(link => {
    if (link.name === "Projects" && !hasProjectAccess) {
      return false;
    }
    if (link.name === "Admin" && !allowedAdminRoles.includes(userRole)) {
      return false;
    }
    return true;
  });

 const handleThemeChange = (theme) => {
 localStorage.setItem("theme", theme);
 applyTheme(theme);
 setThemeDropdownOpen(false);
 };

 return (
 <>
 <nav className="fixed top-0 left-0 w-full z-50 shadow-lg bg-primary text-text transition-colors duration-300">
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Left: Logo (20%) */}
 <div className="w-1/5 flex items-center">
 <img
 className="h-8 w-auto"
 src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
 alt="Logo"
 />
 </div>

{/* Center: Nav Links (60%) */}
  <div className="hidden sm:flex w-3/5 justify-center">
  <div className="flex space-x-2">
{navLinks.map(({ name, to, icon: Icon }) => (
          <NavLink
          key={name}
          to={to}
          className={({ isActive }) =>
          isActive
          ? "relative group px-3 py-2 rounded-xl bg-brand/20 text-brand-text border border-brand/30 shadow-[0_0_0_1px_rgba(212,175,55,0.3)]"
          : "relative group px-3 py-2 rounded-xl text-white/80 border-transparent transition-all duration-300"
          }
          >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 transition-transform" />
            <span className="font-semibold text-sm hidden sm:inline">{name}</span>
          </div>
          </NavLink>
          ))}
  </div>
  </div>

{/* Right: Notification Bell, Theme, Profile (20%) */}
  <div className="w-1/5 flex justify-end items-center space-x-2">
  {/* Notification Bell */}
  <NotificationBell />

  {/* Theme selector */}
  <div ref={themeDropdownRef} className="relative hidden sm:block">
  <div className="relative group">
  <button
  onClick={() => navigate("/theme-selector")}
  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 border-transparent transition-all duration-300"
  >
  <ComputerDesktopIcon className="w-5 h-5" />
  </button>
  <span
  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out rounded px-3 py-1 text-xs shadow-lg z-10 bg-surface text-heading border border-border-subtle"
  >
  Theme Selector
  </span>
  </div>

  </div>

  {/* Mobile toggle */}
  <IconButton
  variant="text"
  className="ml-auto h-6 w-6 sm:hidden text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
  onClick={() => setOpenNav(!openNav)}
  >
  {openNav ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
  ) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
  )}
  </IconButton>

  {/* Profile */}
  <div ref={profileDropdownRef} className="relative">
  <button
  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
  className="relative flex rounded-full bg-white/10 text-sm focus:outline-none hover:bg-white/20 transition-all"
  >
  <span className="sr-only">Open user menu</span>
  <img
  className="h-10 w-10 rounded-full ring-2 ring-white/20"
  src={profileImage}
  alt="User"
  />
  </button>
  {profileDropdownOpen && (
  <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-border-subtle dark:border-slate-700 py-1">
  <Link
  to="/people/profile"
  className="block px-4 py-2 text-sm text-main hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mx-1"
  onClick={() => setProfileDropdownOpen(false)}
  >
  Your Profile
  </Link>
  <button
  onClick={handleLogout}
  className="w-full mx-1 px-4 py-2 text-sm text-danger font-semibold hover:bg-danger-bg rounded-lg transition-colors"
  >
  Sign out
  </button>
  </div>
  )}
  </div>
  </div>
 </div>
 </div>

{/* Mobile Menu */}
{openNav && (
    <div className="sm:hidden px-2 pt-2 pb-3 space-y-1 bg-primary/95 backdrop-blur-sm border-t border-white/10">
    {navLinks.map(({ name, to, icon: Icon }) => (
    <Link
    key={name}
    to={to}
    onClick={() => setOpenNav(false)}
    className={`flex items-center space-x-3 rounded-xl px-3 py-2.5 transition-all ${
      currentPath === to
        ? "bg-brand/20 text-brand-text border border-brand/30"
        : "text-white/80"
    }`}
    >
    <Icon className="w-5 h-5" />
    <span className="font-semibold">{name}</span>
    </Link>
    ))}
    </div>
    )}
 </nav>
 </>
 );
};

export default Navbar;