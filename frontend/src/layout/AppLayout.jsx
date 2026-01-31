import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux"; 
import { useMsal } from "@azure/msal-react"; 
import { logout } from "../slices/authSlice"; 

import NavBarVertical from "../Components/NavBarVertical";
import SubNavbarVertical from "../Components/SubNavbarVertical";
import RightSidebar from "../Components/RightSidebar"; 
import { 
  Bars3Icon, 
  XMarkIcon  
} from "@heroicons/react/24/solid";

const AppLayout = () => {
  const [isRightBarOpen, setRightBarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const settingsRef = useRef(null); 
  const location = useLocation();

  // --- THE FIX IS HERE ---
  // We treat 'people', 'leave', 'file', and 'faq' as part of the same portal
  const isPeoplePortal = ["/people", "/leave", "/file", "/faq"].some(path => 
    location.pathname.startsWith(path)
  );
  // -----------------------
  
  const dispatch = useDispatch();
  const { instance } = useMsal();

  useEffect(() => {
    setIsMobileMenuOpen(false);
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
    <div className="flex flex-col h-screen w-full bg-[#CDD9EA] font-sans overflow-hidden">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#CDD9EA] z-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
            A
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-800 uppercase">
            Abidi Pro
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-white/60 rounded-lg text-slate-700 shadow-sm"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* --- MAIN LAYOUT CONTAINER --- */}
      <div className="flex flex-1 w-full h-full relative overflow-hidden">
        
        {/* --- MOBILE OVERLAY --- */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* --- LEFT SIDEBAR --- */}
        <aside className={`
          absolute inset-y-0 left-0 z-[70] h-full pl-2 py-2 flex transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:flex md:h-full md:py-4 md:pl-4
        `}>
          <div className="flex items-stretch h-full gap-2 relative">
            
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden absolute -right-10 top-2 p-2 bg-white text-slate-800 rounded-full shadow-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* NavBarVertical */}
            <div className="flex items-center h-full">
              <NavBarVertical />
            </div>
            {/* SubNavbarVertical */}
            <div className="flex items-center h-full">
              <SubNavbarVertical />
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 m-2 md:m-4 md:ml-2 rounded-[1.5rem] md:rounded-[2rem] bg-[#ECF0F3] shadow-lg text-slate-800 relative transition-all duration-500 ease-in-out overflow-hidden flex flex-col">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar">
            <Outlet />
          </div>
        </main>

        {/* --- RIGHT SIDEBAR --- */}
        {isPeoplePortal && (
          <div className="hidden md:block h-full py-4 pr-4">
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