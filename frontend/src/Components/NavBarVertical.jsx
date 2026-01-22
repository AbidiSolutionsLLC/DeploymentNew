import { NavLink } from "react-router-dom";
import { 
  UserGroupIcon, 
  SquaresPlusIcon, 
  AdjustmentsHorizontalIcon 
} from "@heroicons/react/24/solid";


import { useState } from "react";
const NavBarVertical = () => {
  const [hoveredItem, setHoveredItem] = useState(null);



const navLinks = [
  { name: "People", to: "/people", icon: UserGroupIcon },
  { name: "Project", to: "/project", icon: SquaresPlusIcon },
  { name: "Admin", to: "/admin", icon: AdjustmentsHorizontalIcon },
];

  return (
    <nav className="w-[2.75rem] flex flex-col items-end gap-2 mt-8 bg-transparent z-20">
      {navLinks.map(({ name, to, icon: Icon }) => (
        <div key={name} className="relative">
          <NavLink
            to={to}
            onMouseEnter={() => setHoveredItem(name)}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) =>
              `relative flex items-center justify-center w-[3rem] h-[3rem] transition-all duration-300 ${isActive
                ? "bg-white/80 text-black rounded-l-3xl translate-x-[1px] shadow-[-2px_0_8px_rgba(0,0,0,0.08)]"
                : "text-slate-500 hover:text-white hover:bg-white/10 rounded-l-2xl"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-6 h-6" />

                {isActive && (
                  <>
                    {/* Decorative scoop curves - commented out but available */}
                    {/* <div className="absolute -top-3 right-0 w-3 h-3 bg-transparent rounded-br-xl shadow-[3px_3px_0_0_#fff]" />
                    <div className="absolute -bottom-3 right-0 w-3 h-3 bg-transparent rounded-tr-xl shadow-[3px_-3px_0_0_#fff]" /> */}
                  </>
                )}
              </>
            )}
          </NavLink>

          {/* Tooltip on hover */}
          {hoveredItem === name && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 
    bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg 
    whitespace-nowrap z-[9999] animate-fadeIn pointer-events-none">

              {name}

              {/* Arrow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full 
      w-0 h-0 border-l-4 border-r-4 border-b-4 
      border-transparent border-b-slate-800">
              </div>
            </div>
          )}

        </div>
      ))}
    </nav>
  );
};

export default NavBarVertical;