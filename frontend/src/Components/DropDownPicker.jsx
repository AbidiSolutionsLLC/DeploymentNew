import { useState } from "react";

export const DropDownPicker = ({  options = [] }) => {
  const [selected, setSelected] = useState("");

  return (
    <div className="w-64 my-4 mb-8">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <option disabled value="">-- Select --</option>
        {options.map((option, index) => (
          <option key={index}>{option}</option>
        ))}
      </select>
    </div>
  );
};
