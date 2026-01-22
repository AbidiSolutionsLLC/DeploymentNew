import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import LogListCard from './LogsListcard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminDashboardCards = ({ donutData, barData, logs }) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col w-full">
        <h3 className="text-sm font-semibold mb-4">Activity Logs</h3>
        <div className="relative overflow-y-auto w-full h-40">
           {/* Pass the prop data instead of the variable */}
           <LogListCard data={logs || []} /> 
        </div>
      </div>

      {/* Project By Group - Bar Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col w-full">
        <h3 className="text-sm font-semibold mb-4">Project By Group</h3>
        <div className="p-4 w-full h-48">
          <Bar
            data={barData}
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
  )
}

export default AdminDashboardCards;
