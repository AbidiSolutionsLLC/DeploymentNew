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
  const data = useSelector((state) => state);
  const { user } = data?.auth;
  const userId = user?.id || user?._id;

  const { checkInn, checkOut: checkout, loading, error } = data?.attendanceTimer;

  const start = localStart;

  // Fetch current status on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchCurrentStatus());
    }
  }, [userId, dispatch]);

  // Update localStart based on checkInn state from Redux
  useEffect(() => {
    if (checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) {
      setLocalStart(new Date(checkInn.log.checkInTime).getTime());
    } else {
      setLocalStart(null);
      setElapsed(0);
      clearInterval(intervalRef.current);
    }
  }, [checkInn]);

  // Timer interval
  useEffect(() => {
    if (!start) {
      clearInterval(intervalRef.current);
      setElapsed(0);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [start]);

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

  // Handle checkout state changes
  useEffect(() => {
    if (checkout) {
      setLocalStart(null);
      setElapsed(0);
      clearInterval(intervalRef.current);
      if (checkout.message) {
        toast.success(checkout.message);
      }
    }
  }, [checkout]);

  return (
    <TimeLogContext.Provider
      value={{ start, elapsed, checkIn, checkOut, loading, error }}
    >
      {children}
    </TimeLogContext.Provider>
  );
}