import React, { useState, useEffect } from "react";
import FeedsCard from "../../Components/home/FeedsCard";
import AttendanceCard from "../../Components/home/AttendanceCard";
import HolidaysCard from "../../Components/home/HolidaysCard";
import ToDoCard from "../../Components/home/TodoCard";
import NotesCard from "../../Components/home/NotesCard";
import AddCardMenu from "../../Components/home/AddCardMenu";
import RecentActivitiesCard from "../../Components/home/RecentActivitiesCard";
import UpcomingBirthdaysCard from "../../Components/home/UpcomingBirthdaysCard";
import LeaveLogCard from "../../Components/home/LeaveLogCard";
import UpcomingDeadlinesCard from "../../Components/home/UpcomingDeadlinesCard";
import TimeoffBalanceCard from "../../Components/home/TimeoffBalanceCard";
import TasksAssignedToMeCard from "../../Components/home/TasksAssignedToMeCard";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchCurrentStatus,
  checkInNow,
  checkOutNow
} from "../../slices/attendanceTimer";

import api from "../../axios";
import { toast } from "react-toastify";
import { refreshUserData } from "../../slices/userSlice";

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return { h, m, s };
}

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userInfo } = useSelector((state) => state.user);
  const { checkInn, loading: reduxLoading } = useSelector((state) => state.attendanceTimer);

  const userId = userInfo?._id || userInfo?.id;

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [cards, setCards] = useState([]);

  // ✅ NEW: Local Log (same as sidebar)
  const [localLog, setLocalLog] = useState(null);

  const activeLog = localLog || checkInn?.log;

  // Fetch user
  useEffect(() => {
    if (user?.user?._id) {
      dispatch(refreshUserData(user.user._id));
    }
  }, [dispatch, user]);

  // Fetch attendance
  useEffect(() => {
    if (userId) {
      dispatch(fetchCurrentStatus());
    }
  }, [userId, dispatch]);

  // ✅ Verify session (CRITICAL FIX)
  useEffect(() => {
    const verifySession = async () => {
      if (userId) {
        try {
          const { data } = await api.get(`/timetrackers/my/daily/${userId}`);
          if (data?.log) setLocalLog(data.log);
        } catch (e) {
          console.error("Verification failed", e);
        }
      }
    };
    verifySession();
  }, [userId]);

  // Timer
  useEffect(() => {
    let interval;

    if (activeLog?.checkInTime && !activeLog?.checkOutTime) {
      const start = new Date(activeLog.checkInTime).getTime();

      const update = () => {
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      };

      update();
      interval = setInterval(update, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [activeLog]);

  const { h, m, s } = format(elapsed);

  // ✅ CheckIn
  const handleCheckIn = () => {
    dispatch(checkInNow())
      .unwrap()
      .then((res) => {
        setLocalLog(res.log);
        toast.success("Checked in");
      })
      .catch(async (err) => {
        toast.error(err?.message);

        if (err?.message?.includes("active")) {
          const { data } = await api.get(`/timetrackers/my/daily/${userId}`);
          if (data?.log) setLocalLog(data.log);
        }
      });
  };

  // ✅ CheckOut
  const handleCheckOut = () => {
    dispatch(checkOutNow())
      .unwrap()
      .then((res) => {
        setLocalLog(res.log);
        toast.success("Checked out");
      })
      .catch(err => toast.error(err?.message));
  };

  // ✅ Button State
  const getButtonState = () => {
    if (!activeLog) {
      return {
        text: "Check In",
        onClick: handleCheckIn,
        className: "bg-emerald-500 hover:bg-emerald-600"
      };
    }

    if (activeLog.checkInTime && !activeLog.checkOutTime) {
      return {
        text: "Check Out",
        onClick: handleCheckOut,
        className: "bg-red-500 hover:bg-red-600"
      };
    }

    return {
      text: "Done",
      className: "bg-slate-400",
      disabled: true
    };
  };

  const buttonState = getButtonState();

  // Dashboard cards
  useEffect(() => {
    const fetchCards = async () => {
      try {
        if (!userId) return;
        setLoading(true);
        const res = await api.get(`/users/${userId}/dashboard-cards`);
        setCards(res.data);
      } catch (err) {
        toast.error("Failed to load cards");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [userId]);

  const addCard = async (type) => {
    try {
      const res = await api.post(`/users/${userId}/dashboard-cards/add`, { type });
      setCards(res.data);
    } catch {
      toast.error("Failed");
    }
  };

  const removeCard = async (id) => {
    try {
      await api.delete(`/users/${userId}/dashboard-cards/${id}`);
      setCards(cards.filter(c => c.id !== id));
    } catch {
      toast.error("Failed");
    }
  };
  const profileImage =
  userInfo?.avatar ||
  user?.user?.avatar ||
  "https://ui-avatars.com/api/?name=" + (userInfo?.name || "User");

const userName =
  userInfo?.name ||
  user?.user?.name ||
  "User";
  const renderCard = (card) => {
    const onDelete = () => removeCard(card.id);

    switch (card.type) {
      case "feeds": return <FeedsCard key={card.id} onDelete={onDelete} />;
      case "attendance": return <AttendanceCard key={card.id} onDelete={onDelete} />;
      case "holidays": return <HolidaysCard key={card.id} onDelete={onDelete} />;
      case "todo": return <ToDoCard key={card.id} onDelete={onDelete} userId={userId} />;
      case "notes": return <NotesCard key={card.id} onDelete={onDelete} />;
      case "recent activities": return <RecentActivitiesCard key={card.id} onDelete={onDelete} />;
      case "birthdays": return <UpcomingBirthdaysCard key={card.id} onDelete={onDelete} />;
      case "leavelog": return <LeaveLogCard key={card.id} onDelete={onDelete} />;
      case "upcomingDeadlines": return <UpcomingDeadlinesCard key={card.id} onDelete={onDelete} />;
      case "timeoffBalance": return <TimeoffBalanceCard key={card.id} onDelete={onDelete} />;
      case "tasksAssignedToMe": return <TasksAssignedToMeCard key={card.id} onDelete={onDelete} />;
      default: return null;
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="w-full p-2">

     {/* Header Card */}
<div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

    {/* ✅ LEFT: GREETING (RESTORED PROPERLY) */}
    <div className="flex items-center gap-3 min-w-0">
    {profileImage ? (
  <img
    src={profileImage}
    alt={userName}
    className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-md"
  />
) : (
  <div className="h-11 w-11 rounded-full bg-[#E0E5EA] text-slate-700 flex items-center justify-center text-sm font-bold border-2 border-white shadow-md">
    {userName.charAt(0).toUpperCase()}
  </div>
)}

      <div className="truncate">
        <h2 className="text-base font-bold text-slate-800 truncate uppercase tracking-tight">
          Hey, {userInfo?.name || "User"}!
        </h2>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
          Have a great day
        </p>
      </div>
    </div>

    {/* ✅ RIGHT: TIMER + MOBILE BUTTON */}
    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">

      {/* TIMER (YOUR ORIGINAL STYLE) */}
      <div className="flex items-center gap-1.5">
        <div className="bg-[#E0E5EA] text-slate-800 px-3 py-2 rounded-xl font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {h}
        </div>
        <div className="text-sm font-bold text-slate-800">:</div>
        <div className="bg-[#E0E5EA] text-slate-800 px-3 py-2 rounded-xl font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {m}
        </div>
        <div className="text-sm font-bold text-slate-800">:</div>
        <div className="bg-[#E0E5EA] text-slate-800 px-3 py-2 rounded-xl font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {s}
        </div>
      </div>

      {/* ✅ CHECK-IN BUTTON (ONLY MOBILE) */}
      <button
        onClick={buttonState.onClick}
        disabled={buttonState.disabled || reduxLoading}
        className={`sm:hidden hide-on-mobile-device text-white text-[10px] font-bold px-3 py-2 rounded-full shadow-md transition-all active:scale-95
        ${buttonState.className} disabled:opacity-50`}
      >
        {buttonState.text}
      </button>


    </div>
  </div>
</div>
      {/* ADD CARD */}
      <div className="mb-3 text-end">
        <AddCardMenu onAdd={addCard} />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(renderCard)}
      </div>

    </div>
  );
};

export default Home;