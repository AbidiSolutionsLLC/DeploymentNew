import React, { useState } from "react";
import { FaSortDown, FaPlus } from "react-icons/fa";
import CalendarNavigator from "./CalendarNavigator";
import SearchBar from "./SearchBar";

const ActivityLogsTable = ({ users, openModal }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 3;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      {/* Top Bar: Sort By & New Project */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        {/* Search Bar */}
        <div className="w-full sm:w-auto">
          <SearchBar />
        </div>

        {/* Calendar Navigator - centered on small screens */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-start">
          <CalendarNavigator
            onPrev={() => console.log("Previous")}
            onNext={() => console.log("Next")}
            onToday={() => console.log("Today")}
          />
        </div>

        {/* Sort Button */}
        <div className="w-full sm:w-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#86B2AA] text-white text-xs md:text-sm px-4 py-2 rounded-md hover:brightness-110">
            Sort <FaSortDown className="text-xs" />
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-gray-100">
            <tr>
              {["TImeStamp", "Category", "Logs", "Status", "Date"].map(
                (header, index) => (
                  <th
                    key={index}
                    className={`p-3 font-medium text-gray-700 border-r last:border-none border-gray-300`}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0
              ? currentItems.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.timestamp}</td>
                    <td className="p-3">{user.category}</td>
                    <td className="p-3">{user.logs}</td>
                    <td className="p-3">{user.status}</td>
                    <td className="p-3">{user.date}</td>
                  </tr>
                ))
              : [...Array(8)].map((_, index) => (
                  <tr key={index} className="border-b">
                    {[...Array(7)].map((__, colIndex) => (
                      <td key={colIndex} className="p-3">
                        <div className="h-4 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsTable;
