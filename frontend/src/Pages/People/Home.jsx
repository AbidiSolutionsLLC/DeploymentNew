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
import { fetchCurrentStatus } from "../../slices/attendanceTimer";
import api from "../../axios";
import { toast } from "react-toastify";

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return { h, m, s };
}

const Home = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.user);
  const { checkInn } = useSelector((state) => state.attendanceTimer);

  const profileImage = userInfo?.user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e";
  const getSafeName = (data) => {
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && data.name) return data.name;
    return "User";
  };

  const firstName = getSafeName(userInfo?.user?.name);
  const userId = userInfo?.user?._id || userInfo?.user?.id;

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [cards, setCards] = useState([]);

  const [time, setTime] = useState({
    hours: "00",
    minutes: "00",
    period: "AM",
  });

  // Fetch current attendance status on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchCurrentStatus());
    }
  }, [userId, dispatch]);

  // Calculate elapsed time from check-in
  useEffect(() => {
    let interval;

    if (checkInn?.log?.checkInTime && !checkInn?.log?.checkOutTime) {
      const startTime = new Date(checkInn.log.checkInTime).getTime();

      const updateElapsed = () => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        setElapsed(elapsedSeconds);
      };

      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkInn]);

  const { h, m, s } = format(elapsed);

  // Fetch user's dashboard cards
  useEffect(() => {
    const fetchDashboardCards = async () => {
      try {
        if (!userId) return;

        setLoading(true);
        const response = await api.get(`/users/${userId}/dashboard-cards`);
        setCards(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard cards:", error);
        toast.error("Failed to load dashboard cards");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardCards();
  }, [userId]);

  const addCard = async (type) => {
    try {
      if (cards.some(c => c.type === type)) {
        toast.warning("This card is already added");
        return;
      }

      const response = await api.post(`/users/${userId}/dashboard-cards/add`, { type });
      setCards(response.data);
      toast.success("Card added successfully");
    } catch (error) {
      console.error("Failed to add card:", error);
      toast.error(error.response?.data?.message || "Failed to add card");
    }
  };

  const removeCard = async (cardId) => {
    try {
      await api.delete(`/users/${userId}/dashboard-cards/${cardId}`);
      setCards(cards.filter(c => c.id !== cardId));
      toast.success("Card removed successfully");
    } catch (error) {
      console.error("Failed to remove card:", error);
      toast.error("Failed to remove card");
    }
  };

  const renderCard = (card) => {
    const { id, type } = card;
    const onDelete = () => removeCard(id);

    switch (type) {
      case "feeds":
        return <FeedsCard key={id} onDelete={onDelete} />;

      case "attendance": {
        const sampleData = [
          { day: "Mon", hours: 6 },
          { day: "Tue", hours: 8 },
          { day: "Wed", hours: 4 },
          { day: "Thu", hours: 2 },
          { day: "Fri", hours: 7 },
          { day: "Sat", hours: 0 },
          { day: "Sun", hours: 5 },
        ];
        return (
          <AttendanceCard key={id} weeklyData={sampleData} onDelete={onDelete} />
        );
      }

      case "holidays":
        return <HolidaysCard key={id} onDelete={onDelete} />;

      case "todo":
        return <ToDoCard key={id} onDelete={onDelete} />;

      case "notes":
        return <NotesCard key={id} onDelete={onDelete} />;

      case "recent activities":
        return <RecentActivitiesCard key={id} onDelete={onDelete} />;

      case "birthdays":
        return <UpcomingBirthdaysCard key={id} onDelete={onDelete} />;

      case "leavelog":
        return <LeaveLogCard key={id} onDelete={onDelete} />;

      case "upcomingDeadlines":
        return <UpcomingDeadlinesCard key={id} onDelete={onDelete} />;

      case "timeoffBalance":
        return <TimeoffBalanceCard key={id} onDelete={onDelete} />;

      case "tasksAssignedToMe":
        return <TasksAssignedToMeCard key={id} onDelete={onDelete} />;

      default:
        return null;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const period = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;
      setTime({ hours: hours.toString().padStart(2, "0"), minutes, period });
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent p-2">
      {/* Header Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Greeting Section */}
          <div className="flex items-center gap-3 min-w-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={firstName}
                className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#E0E5EA] text-slate-700 flex items-center justify-center text-sm font-bold border-2 border-white shadow-md">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="truncate">
              <h2 className="text-base font-bold text-slate-800 truncate uppercase tracking-tight">
                Hey, {firstName}!
              </h2>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Have a great day</p>
            </div>
          </div>

          {/* Timer Display */}
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
        </div>
      </div>

      {/* Add Card Menu */}
      <div className="mb-4 text-end">
        <AddCardMenu onAdd={addCard} />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.length > 0 ? (
          cards.map(renderCard)
        ) : (
          <div className="col-span-full">
            <div className="bg-transparent backdrop-blur-sm text-center">
              <p className="text-slate-500 text-sm font-medium">No cards added yet. Click "More" to add cards to your dashboard.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;