import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { logout } from "../slices/authSlice";

import NavbarVertical from "../components/NavbarVertical";
import SubNavbarVertical from "../components/SubNavbarVertical";
import RightSidebar from "../components/RightSidebar";
import {
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import NotificationModal from "../components/Notification";

const AppLayout = () => {
  const [isRightBarOpen, setRightBarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const settingsRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const location = useLocation();

  // --- THE FIX IS HERE ---
  const isPeoplePortal = ["/people", "/leave", "/file", "/faq"].some(path =>
  location.pathname.startsWith(path)
  );
  // -----------------------

  const dispatch = useDispatch();
  const { instance } = useMsal();

  // Always start each page at the top of the scroll area
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
      scrollAreaRef.current.scrollLeft = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
  function handleClickOutside(event) {
  if (settingsRef.current && !settingsRef.current.contains(event.target)) {
  // Close logic if needed
  }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
  dispatch(logout());
  instance.logoutRedirect({
  postLogoutRedirectUri: window.location.origin,
  }).catch(e => {
  console.error("Logout error:", e);
  });
  };

  return (
  <div className="flex flex-col h-screen w-full bg-transparent font-sans overflow-hidden text-main">
  <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
  {/* --- MOBILE HEADER --- */}
  <div className="md:hidden flex items-center justify-between px-3 py-2.5 bg-transparent z-50 shrink-0 min-w-0">
  <div className="flex items-center gap-2 min-w-0">
  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-md theme-brand-badge flex-shrink-0">
  K
  </div>
  <span className="text-xs font-bold tracking-tight uppercase theme-mobile-label truncate">
  Karbexa
  </span>
  </div>
  <button
  onClick={() => setIsMobileMenuOpen(true)}
  className="p-1.5 rounded-lg shadow-sm theme-bell-default flex-shrink-0"
  >
  <Bars3Icon className="h-5 w-5" />
  </button>
  </div>

  {/* --- MAIN LAYOUT CONTAINER --- */}
  <div className="flex flex-1 w-full h-full relative overflow-hidden min-w-0">

  {/* --- MOBILE OVERLAY --- */}
  {isMobileMenuOpen && (
  <div
  className="fixed inset-0 bg-app z-[60] md:hidden "
  onClick={() => setIsMobileMenuOpen(false)}
  />
  )}

  {/* --- LEFT SIDEBAR --- */}
  <aside className={`
  absolute inset-y-0 left-0 z-[70] h-full pl-2 py-2 flex transition-transform duration-300 ease-in-out
  ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
  md:relative md:translate-x-0 md:flex md:h-full md:py-3 md:pl-3
  lg:py-4 lg:pl-4
  `}>
  <div className="flex items-stretch h-full gap-0 relative z-10 min-w-0">

  <button
  onClick={() => setIsMobileMenuOpen(false)}
  className="md:hidden absolute -right-9 top-1.5 p-1.5 bg-surface text-main rounded-full shadow-lg z-10"
  >
  <XMarkIcon className="h-4 w-4" />
  </button>

  {/* NavbarVertical */}
  <div className="flex items-center h-full relative z-10 min-w-0">
    <NavbarVertical onNotificationClick={() => setIsNotificationOpen(true)} />
  </div>

  {/* SubNavbarVertical */}
  <div className="flex items-center h-full relative z-10 min-w-0">
    <SubNavbarVertical />
  </div>
  </div>
  </aside>

  {/* --- MAIN CONTENT AREA --- */}
  <main className="flex-1 m-1.5 md:m-3 lg:m-4 rounded-[1.25rem] lg:rounded-[1.5rem] xl:rounded-[2rem] bg-surface dark:bg-app shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 dark:border-[#FFD700]/20 text-main relative transition-all duration-500 ease-in-out overflow-hidden flex flex-col min-w-0">
  <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-on-hover min-w-0">
    <div className="p-2.5 md:p-3 lg:p-4 xl:p-5 pb-6 md:pb-8 lg:pb-6 xl:pb-8 min-h-full flex flex-col min-w-0">
      <Outlet />
    </div>
  </div>
  </main>

  {/* --- RIGHT SIDEBAR --- */}
  {isPeoplePortal && (
  <div className="hidden md:flex flex-col h-full py-1.5 md:py-3 pr-1.5 md:pr-3">
  <RightSidebar
  isOpen={isRightBarOpen}
  toggleSidebar={() => setRightBarOpen(!isRightBarOpen)}
  />
  </div>
  )}
  </div>
  </div>
  );
};

export default AppLayout;