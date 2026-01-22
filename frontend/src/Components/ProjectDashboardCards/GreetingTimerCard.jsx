import React, { useEffect, useState } from "react";
import { CardBody } from "@material-tailwind/react";
import { useTimeLog } from "../../Pages/People/TimeLogContext";
import { useSelector } from "react-redux";

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return { h, m, s };
}

const GreetingTimerCard = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const firstName = userInfo?.name || "User";
  const { elapsed } = useTimeLog();
  const { h, m, s } = format(elapsed);

  const [time, setTime] = useState({
    hours: "00",
    minutes: "00",
    period: "AM",
  });

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

  return (
    <CardBody className="bg-background rounded-lg border-0 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 md:p-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm sm:text-base md:text-xl font-bold">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div className="truncate">
          <h2 className="text-lg sm:text-xl text-heading font-semibold truncate">
            Hey, {firstName}!
          </h2>
          <p className="text-description text-sm">Have a great day</p>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 sm:py-2 rounded font-semibold text-base sm:text-lg">
            {h}
          </div>
          <div className="text-base sm:text-lg font-bold">:</div>
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 sm:py-2 rounded font-semibold text-base sm:text-lg">
            {m}
          </div>
          <div className="text-base sm:text-lg font-bold">:</div>
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 sm:py-2 rounded font-semibold text-base sm:text-lg">
            {s}
          </div>
        </div>
      </div>
    </CardBody>
  );
};

export default GreetingTimerCard;
