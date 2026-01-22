import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Coming Soon!</h1>
      <p className="text-lg text-gray-600 mb-8">
        We are working hard to bring you the best project management experience.
      </p>
      <button 
        onClick={() => navigate(-1)}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Go Back
      </button>
    </div>
  );
};

export default ComingSoon;