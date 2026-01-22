import React, { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiBarChart2, FiMoreVertical, FiTrash2 } from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarCard = ({ onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dummy data inside component
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Hours Logged",
        data: [8, 6, 7, 5, 9],
        backgroundColor: "#6366f1", // Tailwind Indigo-500
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="relative bg-background rounded-xl shadow-md p-4 pt-10 overflow-visible">
      {/* Icon top left */}
      <div className="absolute -top-4 left-4 bg-indigo-200 text-indigo-800 w-10 h-10 flex items-center justify-center rounded-md shadow z-99">
        <FiBarChart2 className="text-xl" />
      </div>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-lg text-text font-semibold">Weekly Hours</h2>
          <p className="text-cardDescription text-sm font-medium">
            Hours logged per day this week
          </p>
        </div>
      </div>
      {/* Bar Chart */}
      <div className="h-56 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default BarCard;
