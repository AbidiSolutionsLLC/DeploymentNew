import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  SquaresPlusIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
} from "@heroicons/react/24/solid";

import { useSelector } from "react-redux";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const EASE = [0.16, 1, 0.3, 1];

const railVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const railItemVariants = {
  hidden: { opacity: 0, x: -18, scale: 0.85 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

const NavbarVertical = () => {
  const { isDark } = useTheme();
  const authStateUser = useSelector((state) => state.auth.user);
  const user = authStateUser?.user || authStateUser?.data?.user || authStateUser || null;
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useSelector((s) => s.notifications?.unreadCount ?? 0);

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    const current = String(user.role).replace(/\s+/g, "").toLowerCase();
    return allowedRoles.map((r) => String(r).replace(/\s+/g, "").toLowerCase()).includes(current);
  };

  const navLinks = [
    { name: "People", to: "/people", icon: UserGroupIcon, show: true },
    {
      name: "Project",
      to: "/project",
      icon: SquaresPlusIcon,
      show: hasRole(["Super Admin", "Admin"]) || Boolean(user?.hasProjectPortalAccess || user?.projectRole),
    },
    {
      name: "Admin",
      to: "/admin",
      icon: AdjustmentsHorizontalIcon,
      show: hasRole(["Super Admin", "Admin", "HR", "Manager", "Global Reader"]),
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
      {/* ── Decorative flowing gold rail line ── */}
      <span
        aria-hidden
        className="rail-line pointer-events-none absolute top-16 bottom-24 right-[3px] w-px rounded-full z-[75] opacity-70 md:hidden"
      />

      {/* ── Notification Bell — bottom-left of sidebar ── */}
      <div className="absolute bottom-8 left-[-5px] z-[80]">
        <div className="relative">
          <Motion.button
            id="nav-notification-bell"
            onClick={handleNotificationToggle}
            aria-label="Notifications"
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: isNotifActive ? 2 : 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
            whileHover={isDark ? undefined : { scale: 1.1, y: -2 }}
            whileTap={isDark ? undefined : { scale: 0.9 }}
            className={`relative w-10 h-10 flex items-center justify-center transition-colors duration-300 shadow-md rounded-xl overflow-visible ${
              isNotifActive
                ? "theme-bell-active shadow-sm"
                : "theme-bell-default"
            }`}
          >
            <BellIcon className="w-5 h-5 relative z-10" />

            {/* Unread badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <Motion.span
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-500 rounded-full leading-none select-none border-2 border-white shadow-[0_4px_12px_rgba(239,68,68,0.6)] z-20"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Motion.span>
              )}
            </AnimatePresence>
          </Motion.button>
        </div>
      </div>

      {/* ── Main nav links ── */}
      <Motion.nav
        variants={railVariants}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-end gap-2 mt-4 md:w-auto md:mt-20 bg-transparent z-[80] relative"
      >
        {navLinks
          .filter((item) => item.show)
          .map((item) => {
            const active = isLinkActive(item);

            return (
              <Motion.div
                key={item.name}
                variants={railItemVariants}
                className="relative"
              >
                <NavLink
                  to={item.to}
                  aria-label={item.name}
                  className="relative flex items-center justify-center w-full md:w-[3rem] md:h-[3rem] transition-all duration-300 theme-sidebar-item rounded-l-2xl"
                >
                  <item.icon className={`w-6 h-6 ${active ? "nav-shine-icon" : ""}`} />
                </NavLink>
              </Motion.div>
            );
          })}
      </Motion.nav>
    </>
  );
};

export default NavbarVertical;
