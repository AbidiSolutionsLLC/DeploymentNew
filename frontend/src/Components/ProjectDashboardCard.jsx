import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ProjectDashboardCards = ({ donutData, barData }) => {

  const defaultDonutData = {
    labels: ["Completed", "Remaining"],
    datasets: [{
      data: [0, 100],
      backgroundColor: ["#93C5FD", "#E5E7EB"],
      hoverOffset: 4,
    }]
  };

  const defaultBarData = {
    labels: ["Software", "IT", "Sales", "HR"],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: "#BFDBFE",
      borderRadius: 4,
      barThickness: 30,
    }]
  };

  const safeDonutData = donutData || defaultDonutData;
  const safeBarData = barData || defaultBarData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Project Status - Donut Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col w-full">
        <h3 className="text-sm font-semibold mb-4">Project Status</h3>
        <div className="p-6 flex justify-center">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52">
            <Doughnut
              data={safeDonutData}
              options={{
                cutout: '70%',
                plugins: {
                  tooltip: { enabled: false },
                  legend: { display: false },
                }
              }}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold text-xl">
              {safeDonutData.datasets[0].data[0]}%
            </div>
          </div>
        </div>
      </div>

      {/* Project By Group - Bar Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col w-full">
        <h3 className="text-sm font-semibold mb-4">Project By Group</h3>
        <div className="p-4 w-full h-48">
          <Bar
            data={safeBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { display: false }, ticks: { stepSize: 10 } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardCards;