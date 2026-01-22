import React, { useState } from 'react';

const StatusDropDown = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['Approved',  'Rejected']; // Customize as needed

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleStatusChange = (newStatus) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const statusColor = {
    Approve: 'bg-completed ',
    // Pending: 'bg-slate-500 text-white',
    Reject: 'bg-red-500 text-white',
  };

  return (
    <div className="flex relative text-left">
      <div
        onClick={(e)=>{e.stopPropagation();
            toggleDropdown()}}
        className={`cursor-pointer px-3 py-1 w-full h-fit rounded-sm text-center ${statusColor[status] || 'bg-slate-500 text-white'}`}
      >
        {status}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full  bg-white border border-gray-300 rounded shadow-lg">
          {statuses.map((s) => (
            <div
              key={s}
              onClick={(e) =>{e.stopPropagation();
                 handleStatusChange(s)}
                }
              className="px-3 py-2 w-max hover:bg-gray-100 cursor-pointer"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropDown;
