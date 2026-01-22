// text.jsx
import React from 'react';

const TextCard = () => {
  return (
    <div className="max-w-sm mx-auto mt-10 p-6 rounded-2xl shadow-lg bg-secondary text-text">
      <h2 className="text-xl font-semibold">Welcome to Our App</h2>
      <p className="mt-2">Choose a theme and see the app update live.</p>
      <button className="mt-4 px-4 py-2 rounded-xl bg-primary text-white hover:bg-secondary">
        Get Started
      </button>
    </div>
  );
};

export default TextCard;
