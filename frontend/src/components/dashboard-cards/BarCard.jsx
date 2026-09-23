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
  <div className="bg-surface border border-border-subtle rounded-xl shadow-sm p-5 flex flex-col h-full w-full">
 {/* Icon top left */}
 
 {/* Header */}
 <div className="flex justify-between items-start mb-2">
 <div>
 <h2 className="text-lg text-heading font-semibold">Weekly Hours</h2>
 <p className="text-muted text-sm font-medium">
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


