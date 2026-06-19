// Components/LineChartCard.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const dummyData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "Tasks Completed",
      data: [12, 19, 8, 14],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      tension: 0.4,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: { display: true },
  },
  scales: {
    y: { beginAtZero: true },
  },
};

export default function LineChartCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-2">Weekly Task Progress</h2>
      <Line data={dummyData} options={options} />
    </div>
  );
}
