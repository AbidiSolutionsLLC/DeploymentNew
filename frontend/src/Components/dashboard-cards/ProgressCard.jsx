// Components/ProgressCard.jsx
import React from "react";

const dummyData = {
  title: "Milestone 1",
  progress: 45, // percent
};

export default function ProgressCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <h3 className="text-lg font-semibold mb-3">{dummyData.title}</h3>
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="absolute top-0 left-0 w-full h-full">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#10b981"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${
              2 * Math.PI * 40 * (1 - dummyData.progress / 100)
            }`}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-green-600">
          {dummyData.progress}%
        </div>
      </div>
      <p className="text-sm text-gray-500">Milestone progress</p>
    </div>
  );
}
