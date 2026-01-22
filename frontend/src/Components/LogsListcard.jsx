import React from 'react';

const LogListCard = ({ data }) => {
  return (
    <div className="space-y-4 p-4 bg-white min-h-full">
      {data.map((entry, index) => (
        <div
          key={index}
          className="bg-blue-100 text-gray-800 rounded-md px-4 py-2 shadow-sm"
        >
          <span className="font-semibold">{entry.title}</span> {entry.log}
        </div>
      ))}
    </div>
  );
};

export default LogListCard;
