import React, { useState, useEffect, useCallback } from "react";
import FeedsCard from "../../components/home/FeedsCard";
import AttendanceCard from "../../components/home/AttendanceCard";
import HolidaysCard from "../../components/home/HolidaysCard";
import ToDoCard from "../../components/home/TodoCard";
import NotesCard from "../../components/home/NotesCard";
import AddCardMenu from "../../components/home/AddCardMenu";
import UpcomingBirthdaysCard from "../../components/home/UpcomingBirthdaysCard";
import LeaveLogCard from "../../components/home/LeaveLogCard";
import TimeoffBalanceCard from "../../components/home/TimeoffBalanceCard";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchCurrentStatus,
  checkInNow,
  checkOutNow,
} from "../../slices/attendanceTimer";

import api from "../../axios";
import { toast } from "react-toastify";
import { refreshUserData } from "../../slices/userSlice";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import GlassButton from "../../components/ui/GlassButton";
import Loader from "../../components/ui/Loader";
import WhatsNewModal from "../../components/WhatsNewModal";
import {
  FaClock,
  FaCalendarCheck,
  FaPlayCircle,
  FaStopCircle,
  FaCheckCircle,
  FaBolt,
  FaUser,
} from "react-icons/fa";
import { HomeIcon } from "@heroicons/react/20/solid";

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
  const { checkInn, loading: reduxLoading } = useSelector(
    (state) => state.attendanceTimer
  );

  const userId = userInfo?._id || userInfo?.id;

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [cards, setCards] = useState([]);
  const [localLog, setLocalLog] = useState(null);

  const filterHiddenCards = useCallback(
    (list) =>
      (Array.isArray(list) ? list : []).filter(
        (c) =>
          !["upcomingDeadlines", "tasksAssignedToMe", "recent activities"].includes(
            c.type
          )
      ),
    []
  );

  const activeLog = localLog || checkInn?.log;

  useEffect(() => {
    const userIdToFetch =
      user?.data?.user?._id || user?.user?._id || user?._id || user?.id;
    if (userIdToFetch) {
      dispatch(refreshUserData(userIdToFetch));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (userId) {
      dispatch(fetchCurrentStatus());
    }
  }, [userId, dispatch]);

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

  const handleCheckOut = () => {
    dispatch(checkOutNow())
      .unwrap()
      .then((res) => {
        setLocalLog(res.log);
        toast.success("Checked out");
      })
      .catch((err) => toast.error(err?.message));
  };

  const getButtonState = () => {
    if (!activeLog) {
      return {
        text: "Check In",
        onClick: handleCheckIn,
        variant: "primary",
        icon: FaPlayCircle,
      };
    }

    if (activeLog.checkInTime && !activeLog.checkOutTime) {
      return {
        text: "Check Out",
        onClick: handleCheckOut,
        variant: "danger",
        icon: FaStopCircle,
      };
    }

    return {
      text: "Done",
      variant: "secondary",
      icon: FaCheckCircle,
      disabled: true,
    };
  };

  const buttonState = getButtonState();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        if (!userId) return;
        setLoading(true);
        const res = await api.get(`/users/${userId}/dashboard-cards`);
        setCards(filterHiddenCards(res.data?.data || res.data || []));
      } catch {
        toast.error("Failed to load cards");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [userId, filterHiddenCards]);

  const addCard = async (type) => {
    if (cards.some((c) => c.type === type)) {
      toast.info("Card is already added");
      return;
    }
    try {
      const res = await api.post(`/users/${userId}/dashboard-cards/add`, { type });
      setCards(filterHiddenCards(res.data?.data || res.data || []));
    } catch {
      toast.error("Failed");
    }
  };

  const removeCard = async (id) => {
    try {
      await api.delete(`/users/${userId}/dashboard-cards/${id}`);
      setCards(cards.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed");
    }
  };

  const profileImage =
    userInfo?.avatar ||
    user?.data?.user?.avatar ||
    user?.user?.avatar ||
    user?.avatar ||
    "https://ui-avatars.com/api/?name=" +
      (userInfo?.name ||
        user?.data?.user?.name ||
        user?.user?.name ||
        user?.name ||
        "User");

  const userName =
    userInfo?.name ||
    user?.data?.user?.name ||
    user?.user?.name ||
    user?.name ||
    "User";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const isWorking = Boolean(activeLog?.checkInTime && !activeLog?.checkOutTime);
  const isDone = Boolean(activeLog?.checkInTime && activeLog?.checkOutTime);

  const checkInTimeLabel = activeLog?.checkInTime
    ? new Date(activeLog.checkInTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const renderCard = (card) => {
    const onDelete = () => removeCard(card.id);

    switch (card.type) {
      case "feeds":
        return <FeedsCard key={card.id} onDelete={onDelete} />;
      case "attendance":
        return <AttendanceCard key={card.id} onDelete={onDelete} />;
      case "holidays":
        return <HolidaysCard key={card.id} onDelete={onDelete} />;
      case "todo":
        return <ToDoCard key={card.id} onDelete={onDelete} userId={userId} />;
      case "notes":
        return <NotesCard key={card.id} onDelete={onDelete} userId={userId} />;
      case "birthdays":
        return <UpcomingBirthdaysCard key={card.id} onDelete={onDelete} />;
      case "leavelog":
        return <LeaveLogCard key={card.id} onDelete={onDelete} />;
      case "timeoffBalance":
        return (
          <TimeoffBalanceCard key={card.id} onDelete={onDelete} userId={userId} />
        );
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );

  return (
    <>
    <PageContainer isCard={false}>
      <div className="lm-plain-cards flex flex-col gap-4 w-full">
        {/* ============ HERO (Admin Leave Management style) ============ */}
        <PortalHero
            label="People portal home"
          title={`${greeting}, ${userName}!`}
          description="Your personal workspace — track time, manage cards and stay on top of your day."
          emblem={HomeIcon}
          chips={[
            {
              icon: FaUser,
              value: new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
              label: "",
            },
            {
              icon: isWorking ? FaStopCircle : isDone ? FaCheckCircle : FaClock,
              value: isWorking ? "Working" : isDone ? "Done" : "Not started",
              label: "Checkin",
            },
            {
              icon: FaClock,
              value: `${h}:${m}:${s}`,
              label: "Elapsed",
            },
          ]}
/>

        {/* ============ DASHBOARD CARDS ============ */}
        <div className="flex flex-col gap-4 w-full">
          <div className="glass-card relative z-50 !px-4 !py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1 h-4 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-heading tracking-tight leading-snug">
                  Dashboard
                </h2>
                <p className="text-xs font-medium text-muted mt-0.5 truncate">
                  {cards.length} card{cards.length === 1 ? "" : "s"} · customise your home view
                </p>
              </div>
            </div>
            <AddCardMenu onAdd={addCard} currentCards={cards} />
          </div>

          {cards.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-4">
                <FaBolt size={22} />
              </div>
              <p className="text-sm font-bold text-heading mb-1">
                Your dashboard is empty
              </p>
              <p className="text-xs text-muted mb-4">
                Add cards to personalise your people portal home.
              </p>
              <AddCardMenu onAdd={addCard} currentCards={cards} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(renderCard)}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
    <WhatsNewModal />
    </>
  );
};

export default Home;
