import React, { useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Navbar, MobileNav, IconButton, Button , Collapse} from "@material-tailwind/react";
import { CalendarDaysIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { moduleConfigs } from "../routeConfig";
import { useTimeLog } from "../Pages/People/TimeLogContext";
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from "react-toastify";
import { setError } from "../slices/attendanceTimer";
import { useDispatch, useSelector } from "react-redux";
import AddTimeLogModal from "../Pages/People/AddTimeLogModal";

const SubNavbar = ({ onAddTimeLog, activeTab, onCreateTimesheet }) => {
  const [openNav, setOpenNav] = useState(false);
  const { start, checkIn, checkOut, loading, error } = useTimeLog();
  const [isAddTimeLogModalOpen, setIsAddTimeLogModalOpen] = useState(false);
  const checkedIn = Boolean(start);
  const { pathname } = useLocation();
  const moduleKey = pathname.split("/")[2];
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.user);
  const userId = userInfo?._id || userInfo?.id;

  const config = moduleConfigs[pathname.split("/")[1]];
  const links = config?.links || [];

  useEffect(() => {
    error && (() => {
      setTimeout(() => {
        dispatch(setError(null));
      }, 1000);
    })()
  }, [error]);

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCheckIn = () => {
    checkIn();
  };

  const handleCheckOut = () => {
    checkOut();
  };

  const navLinks = (
    <ul className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6 text-sm font-medium">
      {links.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
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
    <Navbar className="fixed top-12 z-10 max-w-full rounded-nonemy-2 px-4 my-4 py-2 lg:px-8 lg:py-4 bg-background shadow-none border-none">
      <div className="flex items-center justify-between text-blue-gray-900">
        {/* Check In/Out Button */}
        <Button
          size="lg"
          className={`my-2 py-2 w-full max-w-[140px] font-semibold shadow transition ${checkedIn ? "bg-red-400 text-red-800" : "bg-green-400 text-green-800"
            } ${loading || !userId ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={checkedIn ? handleCheckOut : handleCheckIn}
          disabled={loading || !userId}
        >
          {loading ? <CircularProgress size={15} color="primary" /> : checkedIn ? "Check Out" : "Check In"}
        </Button>

        {/* Nav Links Center */}
        <div className="hidden lg:block">{navLinks}</div>

        {/* Right side: conditionally show Add Time Log or Create Timesheet */}
        <div className="hidden lg:flex items-center space-x-4">
          {moduleKey === "history" && activeTab === 1 ? (
            <Button
              className="bg-primary text-heading hover:bg-primary-dark text-white"
              onClick={onCreateTimesheet}
            >
              Create Timesheet
            </Button>
          ) : moduleKey === "history" ? (
            <Button
              className="bg-primary text-heading hover:bg-primary-dark text-white"
              onClick={onAddTimeLog}
            >
              Add Time Log
            </Button>
          ) : (
            <>
              <PhoneIcon className="w-5 h-5 text-text hover:text-teal-700 cursor-pointer" />
              <CalendarDaysIcon className="w-5 h-5 text-text hover:text-teal-700 cursor-pointer" />
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <IconButton
          variant="text"
          className="ml-auto h-6 w-6 lg:hidden"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </IconButton>
      </div>

      <AddTimeLogModal
        isOpen={isAddTimeLogModalOpen}
        onClose={() => setIsAddTimeLogModalOpen(false)}
        onSave={(data) => {
          console.log("Saving time log:", data);
          setIsAddTimeLogModalOpen(false);
        }}
      />

      <Collapse open={openNav}>
        <div className="flex flex-col gap-4 mt-5">
          {navLinks}
          <div className="items-center space-x-4">
            {moduleKey === "history" && activeTab === 1 ? (
              <Button
                className="bg-primary text-heading hover:bg-primary-dark text-white"
                onClick={onCreateTimesheet}
              >
                Create Timesheet
              </Button>
            ) : moduleKey === "history" ? (
              <Button
                className="bg-primary text-heading hover:bg-primary-dark text-white"
                onClick={onAddTimeLog}
              >
                Add Time Log
              </Button>
            ) : (
              <>
                <PhoneIcon className="w-5 h-5 text-text hover:text-teal-700 cursor-pointer" />
                <CalendarDaysIcon className="w-5 h-5 text-text hover:text-teal-700 cursor-pointer" />
              </>
            )}
          </div>
        </div>
      </Collapse>
    </Navbar>
  );
};

export default SubNavbar;