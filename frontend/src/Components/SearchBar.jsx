import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ placeholder = "Search Logs", onChange }) => {
 return (
 <div className="flex items-center border rounded-md px-3 py-2 bg-surface shadow-sm w-full max-w-xs">
 <FiSearch className="text-muted mr-2" />
 <input
 type="text"
 placeholder={placeholder}
 onChange={onChange}
 className="outline-none w-full text-sm text-main placeholder-gray-400 bg-transparent"
 />
 </div>
 );
};

export default SearchBar;
