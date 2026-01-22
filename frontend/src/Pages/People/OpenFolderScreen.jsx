import React, { useState } from "react";
import { FiUpload,  FiArrowLeft } from "react-icons/fi";

const OpenFolderScreen = ({ folder, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles((prev) => [...prev, file]);
    }
  };

  const filteredFiles = uploadedFiles.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="min-h-screen bg-primary p-2 sm:p-4 mx-2 my-4 sm:m-6 rounded-lg shadow-md">
      {/* Back button and folder title */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft className="mr-1" />
        </button>
        <h2 className="text-lg font-medium text-white">
          {folder?.name ? capitalize(folder.name) : "Folder"}
        </h2>
      </div>

      {/* Top bar: show entries / search / upload */}
      <div className="flex flex-col mb-5 bg-white rounded-lg px-3 py-3 sm:px-6 md:px-8 md:py-4">
        {/* Controls layout - stacks on mobile, flex on larger screens */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full space-y-4 lg:space-y-0">
          {/* Entries dropdown section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-xs sm:text-sm text-heading whitespace-nowrap">
                Show
              </label>
              <select className="text-xs sm:text-sm px-2 py-1 text-heading bg-secondary rounded-md shadow-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-xs sm:text-sm text-heading">entries</span>
            </div>
          </div>

          {/* Search input and Upload button */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
            <div className="flex-grow sm:w-64">
              <input
                type="text"
                placeholder="Search files..."
                className="border-0 px-3 py-2 rounded-md shadow-sm w-full text-xs sm:text-sm bg-secondary text-description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="fileInput"
                className="flex items-center justify-center gap-2 bg-[#86B2AA] hover:bg-[#99c7be] text-white px-3 sm:px-4 py-2 rounded-md cursor-pointer text-xs sm:text-sm whitespace-nowrap"
              >
                <FiUpload size={16} /> Upload File
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Files table with responsive design */}
      <div className="bg-white rounded-xl shadow p-2 sm:p-4 w-full">
        {filteredFiles.length > 0 ? (
          <>
            {/* Regular table for medium+ screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm text-left border-separate border-spacing-0">
                <thead className="bg-gray-100">
                  <tr>
                    {["File Name", "Size (KB)", "Type"].map((h) => (
                      <th
                        key={h}
                        className="p-2 sm:p-3 font-medium text-gray-700 border-r last:border-none border-gray-300 "
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3">{file.name}</td>
                      <td className="p-2 sm:p-3">
                        {(file.size / 1024).toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-3">{file.type || "Unknown"}</td>
                      <td className="p-2 sm:p-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout for small screens */}
            <div className="md:hidden space-y-3">
              {filteredFiles.map((file, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="font-medium truncate mr-2">{file.name}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex flex-col space-y-1">
                    <div>Size: {(file.size / 1024).toFixed(2)} KB</div>
                    <div>Type: {file.type || "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4 p-4 rounded-full bg-gray-100">
              <FiUpload size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No files uploaded
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              Upload files to this folder to see them here
            </p>

            <input
              id="emptyStateFileInput"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenFolderScreen;
