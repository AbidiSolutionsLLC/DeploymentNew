import React from 'react';

const AttendanceCard = ({ title, value, badgeColor, icon }) => {
    return (
        <div className="relative bg-white rounded-2xl shadow-md px-4 py-6  flex items-center justify-between w-78">
            {/* Badge */}
            <div className={`absolute -top-4 left-4 ${badgeColor} text-white p-4 rounded-lg`}>
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

export default AttendanceCard;
