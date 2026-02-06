import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkInNow, checkOutNow, fetchCurrentStatus } from "../../slices/attendanceTimer";
import { toast } from "react-toastify";

const TimeLogContext = createContext();
export const useTimeLog = () => useContext(TimeLogContext);

export function TimeLogProvider({ children }) {
  const [elapsed, setElapsed] = useState(0);
  const [localStart, setLocalStart] = useState(null);
  const intervalRef = useRef(null);
  const dispatch = useDispatch();
  
  // Select state from Redux
  const data = useSelector((state) => state);
  const { user } = data?.auth;
  const userId = user?.id || user?._id;

  const { checkInn, checkOut: checkout, loading, error } = data?.attendanceTimer;

  const start = localStart;

  // 1. Fetch current session status on initial load
  useEffect(() => {
    if (userId) {
      dispatch(fetchCurrentStatus());
    }
  }, [userId, dispatch]);

  // 2. Synchronize the timer with the check-in data
  useEffect(() => {
    // If a session is active (has a start time but no end time)
    if (checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) {
      setLocalStart(new Date(checkInn.log.checkInTime).getTime());
    } else {
      // Clear timer if checked out
      setLocalStart(null);
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [checkInn]);

  // 3. Live Timer Loop
  useEffect(() => {
    if (!start) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
      return;
    }

    // Update the elapsed state every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const difference = Math.floor((now - start) / 1000);
      setElapsed(difference > 0 ? difference : 0);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [start]);

  // Actions for the UI components
  const checkIn = () => {
    if (!start) {
      dispatch(checkInNow());
    }
  };

  const checkOut = () => {
    if (start) {
      dispatch(checkOutNow());
    }
  };

  // 4. Handle successful checkout feedback
  useEffect(() => {
    if (checkout) {
      setLocalStart(null);
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      if (checkout.message) {
        toast.success(checkout.message);
      }
    }
  }, [checkout]);

  return (
    <TimeLogContext.Provider
      value={{ 
        start, 
        elapsed, 
        checkIn, 
        checkOut, 
        loading, 
        error 
      }}
    >
      {children}
    </TimeLogContext.Provider>
  );
}
