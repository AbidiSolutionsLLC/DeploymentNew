import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  UserGroupIcon, 
  SquaresPlusIcon, 
  AdjustmentsHorizontalIcon,
  BellIcon,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import api from "../axios"; 

const NavBarVertical = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [user, setUser] = useState(null); 
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useSelector((s) => s.notifications?.unreadCount ?? 0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };
    fetchUser();
  }, []);

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  const navLinks = [
    { 
      name: "People", 
      to: "/people", 
      icon: UserGroupIcon, 
      show: true 
    },
    { 
      name: "Project", 
      to: "/project", 
      icon: SquaresPlusIcon, 
      show: true 
    },
    { 
      name: "Admin", 
      to: "/admin", 
      icon: AdjustmentsHorizontalIcon, 
      // Requirement 1: Employee & Tech won't see this.
      show: hasRole(["Super Admin", "Admin", "HR", "Manager"]) 
    },
  ];

  const isLinkActive = (item) => {
    if (item.name === "People") {
      return ["/people", "/leave", "/file", "/faq"].some(path => 
        location.pathname.startsWith(path)
      );
    }
    return location.pathname.startsWith(item.to);
  };

  const handleNotificationToggle = () => {
    if (location.pathname === '/notifications') {
      // If we are already on notifications, clicking again "closes" it (goes back)
      navigate(-1);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <>
      {/* Notification Bell - Repositioned to Top Left */}
      <div className="absolute bottom-8 left-[-5px] z-30">
        <button
          id="nav-notification-bell"
          onClick={handleNotificationToggle}
          onMouseEnter={() => setHoveredItem('notifications')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Notifications"
          className={`relative w-10 h-10 flex items-center justify-center transition-all duration-300 shadow-md rounded-xl ${
            location.pathname === '/notifications'
              ? 'bg-slate-800 text-white translate-y-[2px] shadow-sm' 
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BellIcon className="w-5 h-5" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none select-none border-2 border-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Tooltip */}
        {hoveredItem === 'notifications' && (
          <div className="absolute top-1/2 left-full -translate-y-1/2 ml-3 px-3 py-1.5
            bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg
            whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none">
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            {/* Tooltip Arrow */}
            <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2
              w-0 h-0 border-t-4 border-b-4 border-r-4
              border-transparent border-r-slate-800">
            </div>
          </div>
        )}
      </div>

      <nav className="w-[2.75rem] flex flex-col items-end gap-2 mt-20 bg-transparent z-20 relative">
        {/* Section Nav Links */}
        {navLinks.filter(item => item.show).map((item) => {
          const active = isLinkActive(item);

          return (
            <div key={item.name} className="relative">
              <NavLink
                to={item.to}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                className={() =>
                  `relative flex items-center justify-center w-[3rem] h-[3rem] transition-all duration-300 ${
                    active
                      ? "bg-white/80 text-black rounded-l-3xl translate-x-[1px] shadow-[-2px_0_8px_rgba(0,0,0,0.08)]"
                      : "text-slate-500 hover:text-white hover:bg-white/10 rounded-l-2xl"
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
              </NavLink>

              {hoveredItem === item.name && (
                <div className="absolute top-1/2 right-full -translate-y-1/2 mr-3 px-3 py-1.5 
                bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg 
                whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none">
                  {item.name}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2
                    w-0 h-0 border-t-4 border-b-4 border-l-4
                    border-transparent border-l-slate-800">
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
};


export default NavBarVertical;