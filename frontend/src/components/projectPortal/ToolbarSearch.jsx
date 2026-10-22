import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * Project Portal — controlled search input for toolbars.
 * Filtering happens in the page (client-side over the full list).
 */
export default function ToolbarSearch({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="glass-input !pl-9 w-full"
      />
    </div>
  );
}
