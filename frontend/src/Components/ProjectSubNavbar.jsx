import React, { useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Navbar,
  MobileNav,
  IconButton,
  Button,
} from "@material-tailwind/react";
import {
  CalendarDaysIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { moduleConfigs } from "../routeConfig";
import { useTimeLog } from "../Pages/People/TimeLogContext";
import CircularProgress from '@mui/material/CircularProgress';
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const SubNavbar = () => {
  const [openNav, setOpenNav] = useState(false);
  const { start, checkIn, checkOut, loading } = useTimeLog();
  const checkedIn = Boolean(start);
  const { pathname } = useLocation();
  const moduleKey = pathname.split("/")[1];
  const config = moduleConfigs[moduleKey];
  const links = config?.links || [];
  
  const userInfo = useSelector((state) => state.auth.user);
  const userId = userInfo?._id || userInfo?.id;

  const handleCheckIn = () => {
 
    checkIn();
  };

 const handleCheckOut = () => {
  checkOut();
};

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = (
    <ul className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6 text-sm font-medium">
      {links.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
            end={pathname === link.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md transition-colors duration-100 ${isActive ? "bg-primary text-white" : "text-text hover:text-text"
              }`
            }
          >
            {link.name}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  if (!links.length) return null;

  return (
    <Navbar className="fixed top-16 z-10 w-full rounded-none px-4 py-2 lg:px-8 lg:py-4 bg-background shadow-none border-none">
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Desktop layout: 20% - 60% - 20% */}
        <div className="w-1/5 flex justify-start">
          <Button
            size="lg"
            className={`my-2 py-2 w-full max-w-[140px] font-semibold shadow transition ${checkedIn
                ? "bg-red-400 text-red-800"
                : "bg-green-400 text-green-800"
              }`}
            onClick={checkedIn ? handleCheckOut : handleCheckIn}
            disabled={loading || !userId}
          >
            {loading ? <CircularProgress size={15} color="primary" /> : checkedIn ? "Check Out" : "Check In"}
          </Button>
        </div>

        <div className="w-3/5 flex justify-center">{navLinks}</div>

        <div className="w-1/5 flex justify-end space-x-4">
          <PhoneIcon className="w-5 h-5 text-text hover:text-blue-500 cursor-pointer" />
          <CalendarDaysIcon className="w-5 h-5 text-text hover:text-blue-500 cursor-pointer" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex items-center justify-between lg:hidden w-full">
        <Button
          size="lg"
          className={`w-full max-w-[140px] font-semibold shadow transition ${checkedIn
              ? "bg-red-400 text-red-800"
              : "bg-green-400 text-green-800"
            }`}
          onClick={checkedIn ? handleCheckOut : handleCheckIn}
          disabled={loading || !userId}
        >
          {loading ? <CircularProgress size={15} color="primary" /> : checkedIn ? "Check Out" : "Check In"}
        </Button>

        <IconButton
          variant="text"
          className="ml-auto h-6 w-6"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </IconButton>
      </div>

      <MobileNav open={openNav}>
        <div className="flex flex-col gap-4 mt-5">
          {navLinks}
          <div className="flex items-center gap-4 px-4">
            <PhoneIcon className="w-5 h-5 text-gray-600 hover:text-blue-500 cursor-pointer" />
            <CalendarDaysIcon className="w-5 h-5 text-gray-600 hover:text-blue-500 cursor-pointer" />
          </div>
        </div>
      </MobileNav>
    </Navbar>
  );
};

export default SubNavbar;