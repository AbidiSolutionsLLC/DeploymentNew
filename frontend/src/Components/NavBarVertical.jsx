import { NavLink, useLocation } from "react-router-dom";
import { 
  UserGroupIcon, 
  SquaresPlusIcon, 
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import api from "../axios"; 

const NavBarVertical = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [user, setUser] = useState(null); 
  const location = useLocation();

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

  return (
    <nav className="w-[2.75rem] flex flex-col items-end gap-2 mt-8 bg-transparent z-20">
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
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 
              bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg 
              whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none">
                {item.name}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full 
                w-0 h-0 border-l-4 border-r-4 border-b-4 
                border-transparent border-b-slate-800">
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default NavBarVertical;