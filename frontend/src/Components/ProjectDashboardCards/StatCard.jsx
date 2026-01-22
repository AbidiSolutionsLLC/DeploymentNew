// Components/StatCard.jsx
import React from "react";
import { HiTrendingUp } from "react-icons/hi";

const dummyData = {
  title: "Project Completion",
  value: "76%",
  trend: "+6% from last week",
};

export default function StatCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{dummyData.title}</h3>
        <p className="text-2xl font-semibold text-gray-800">{dummyData.value}</p>
        <p className="text-sm text-green-500 flex items-center gap-1">
          <HiTrendingUp /> {dummyData.trend}
        </p>
      </div>
    </div>
  );
}
