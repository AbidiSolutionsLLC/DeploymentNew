import React from 'react';

const ProjectCard = ({ title, value, badgeColor, icon }) => {
    return (
        <div className="relative bg-white rounded-2xl shadow-md px-4 py-6 mb-8  flex items-center justify-between w-78">
            {/* Badge */}
            <div className={`absolute -top-6 left-4 ${badgeColor} text-white p-4 rounded-lg`}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex justify-between w-full items-center">
                <div className="text-center w-1/2 mx-2">
                    <p className="text-sm text-gray-800 whitespace-nowrap">{title}</p>
                </div>

                {/* Divider */}
                <div className="w-px h-14 bg-gray-300 mx-2"></div>

                <div className="text-center w-1/2">
                    <p className="text-sm text-gray-800 whitespace-nowrap"> Available : <span className="font-semibold">{value}</span> </p>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;

// import React from "react";

// const ProjectCard = ({ title, value, icon, badgeColor }) => {
//   return (
//     <div className="w-full p-4 sm:p-5 bg-white rounded-lg shadow flex items-center justify-between">
//       {/* Left: Icon + Title */}
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-full ${badgeColor}`}>
//           {icon}
//         </div>
//         <div className="text-sm sm:text-base font-semibold text-gray-700">
//           {title}
//         </div>
//       </div>

//       {/* Optional Divider */}
//       <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>

//       {/* Right: Value */}
//       <div className="text-lg font-bold text-gray-900">{value}</div>
//     </div>
//   );
// };

// export default ProjectCard;

