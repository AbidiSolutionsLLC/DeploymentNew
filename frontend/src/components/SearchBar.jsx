import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ placeholder = "Search Logs", onChange }) => {
 return (
 <div className="relative flex items-center w-full max-w-xs group"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="w-4 h-4 text-muted group-focus-within:text-brand-primary transition-colors" /></div><input type="text" placeholder={placeholder} onChange={onChange} className="glass-input pl-9 w-full" /></div>
 );
};

export default SearchBar;

