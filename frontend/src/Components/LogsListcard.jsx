import React from 'react';

const LogListCard = ({ data }) => {
 return (
 <div className="space-y-4 p-4 bg-surface min-h-full">
 {data.map((entry, index) => (
 <div
 key={index}
 className="bg-amber-100 text-main rounded-md px-4 py-2 shadow-sm"
 >
 <span className="font-semibold">{entry.title}</span> {entry.log}
 </div>
 ))}
 </div>
 );
};

export default LogListCard;
