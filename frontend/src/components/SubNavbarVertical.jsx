import { useState, useRef, useEffect } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
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
  FolderPlusIcon, CheckBadgeIcon,
  PlusIcon, UserPlusIcon, ClipboardDocumentCheckIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, SwatchIcon,
  SunIcon, MoonIcon, ComputerDesktopIcon, SquaresPlusIcon
} from "@heroicons/react/20/solid";
import { DollarSignIcon } from "lucide-react";
import { FaSitemap } from "react-icons/fa";
import { motion as Motion, AnimatePresence } from "framer-motion";
import GlassModal from "./ui/GlassModal";

const EASE = [0.16, 1, 0.3, 1];

const SubNavbarVertical = () => {
 const { pathname } = useLocation();
 const navigate = useNavigate();
 const { hasPermission } = usePermission();
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
      "Project DashBoard": ChartPieIcon, "Projects": RectangleStackIcon, "My Tasks": ClipboardDocumentListIcon,
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
          const Icon = iconMap[link.name] || iconMap["default"];
          return (
            <Motion.div
              key={link.name}
              initial={{ opacity: 0, x: -16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.06 + index * 0.05, ease: EASE }}
            >
              <NavLink
                to={link.path}
                className="relative w-full py-3 flex flex-col items-center justify-center rounded-[1.2rem] overflow-visible transition-shadow duration-300 theme-sidebar-item"
              >
                {({ isActive }) => (
                  <>
                    <Motion.span className="relative z-10 mb-1.5 flex items-center justify-center">
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "nav-shine-icon"
                            : "drop-shadow-[0_2px_6px_rgba(212,175,55,0.25)]"
                        }`}
                      />
                    </Motion.span>

                    <span
                      className={`relative z-10 text-[9px] font-bold uppercase tracking-tight text-center px-1 leading-tight max-w-[70px] ${
                        isActive ? "nav-shine-text" : ""
                      }`}
                    >
                      {link.name}
                    </span>
                  </>
                )}
              </NavLink>
            </Motion.div>
          );
        })}
      </div>

      {/* ── Settings / bottom section ── */}
     <div
       className="pt-2 w-full px-2 flex flex-col items-center flex-shrink-0 relative z-10"
       style={{ borderTop: "1px solid var(--color-border-accent)" }}
       ref={settingsRef}
     >
       <Motion.button
         id="settings-toggle-btn"
         onClick={() => setIsSettingsOpen(!isSettingsOpen)}
         whileHover={{ y: -2 }}
         whileTap={{ scale: 0.94 }}
         className={`relative w-full py-2 flex flex-col items-center justify-center rounded-[1.2rem] transition-colors duration-300 theme-sidebar-item${
           isSettingsOpen ? " theme-active" : ""
         }`}
       >
         <Motion.span
           animate={isSettingsOpen ? { rotate: 180 } : { rotate: 0 }}
           transition={{ type: "spring", stiffness: 260, damping: 18 }}
           className="flex items-center justify-center"
         >
           <Cog6ToothIcon className="h-5 w-5" />
         </Motion.span>
         <span className="text-[9px] font-bold uppercase mt-1">Settings</span>
       </Motion.button>

       {/* ── Settings Dropdown ── */}
       <AnimatePresence>
         {isSettingsOpen && (
           <Motion.div
             initial={{ opacity: 0, x: -14, y: 8, scale: 0.94 }}
             animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
             exit={{ opacity: 0, x: -14, y: 8, scale: 0.94 }}
             transition={{ duration: 0.26, ease: EASE }}
             style={{ transformOrigin: "bottom left" }}
             className="absolute left-full bottom-0 ml-2 w-56 rounded-2xl py-1 z-[80] overflow-hidden glimmer-border theme-settings-panel"
           >
           {/* Header */}
           <div className="px-4 py-2.5 theme-settings-header">
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
                   <Motion.button
                     key={t.id}
                     title={t.label}
                     id={`theme-swatch-${t.id}`}
                     onClick={() => setThemeMode(t.id)}
                     whileHover={{ scale: 1.14, y: -2 }}
                     whileTap={{ scale: 0.92 }}
                     className={`theme-swatch${isActive ? " selected" : ""}`}
                     style={{
                       backgroundColor: "var(--color-bg-secondary)",
                       color: isActive ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                       boxShadow: isActive
                         ? `0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-brand-primary), 0 6px 16px rgba(212,175,55,.35)`
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
                   </Motion.button>
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
           </Motion.div>
         )}
       </AnimatePresence>
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
