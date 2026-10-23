import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FiChevronDown,
  FiSearch,
  FiX,
  FiCheck,
  FiUserPlus,
  FiUsers,
  FiPlus,
} from "react-icons/fi";

/**
 * Helper to extract initials from a full name.
 */
function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar badge component with image error fallback.
 */
function UserAvatarBadge({ name, src, size = "sm" }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
  }[size] || "w-6 h-6 text-[10px]";

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setImgFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-border-accent flex-shrink-0`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-brand-text border border-amber-200/80 dark:from-amber-900/40 dark:to-amber-800/40 dark:border-amber-700/60 dark:text-amber-300 flex items-center justify-center font-bold tracking-wide flex-shrink-0 select-none`}
    >
      {getInitials(name)}
    </span>
  );
}

/**
 * ModernMultiSelect — an industry-standard multi-user / multi-item selection component.
 *
 * Requirements met:
 * 1. Inside the field, it ONLY displays the items/members that have been selected/added as chips.
 * 2. When the dropdown opens, it displays the UNADDED members ready to be assigned.
 * 3. Has real-time search by name, email, or role.
 * 4. Shows avatars, full names, and email/role subtitles for each user.
 * 5. Uses createPortal to document.body so the dropdown is never clipped by modal overflow.
 * 6. Responsive, accessible (keyboard Escape, click outside, clear all, add all).
 * 7. Supports dark/light mode with CSS variables & design tokens.
 */
export default function ModernMultiSelect({
  label,
  name = "team",
  value = [],
  onChange,
  users = [],
  options = [],
  placeholder = "Select team members to assign...",
  searchPlaceholder = "Search people by name or email...",
  required = false,
  error = null,
  disabled = false,
  className = "",
  helperText = "",
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  // Normalize selected IDs into an array of strings
  const selectedIds = useMemo(() => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item) return "";
        if (typeof item === "object") {
          return String(item._id || item.id || item.value || "");
        }
        return String(item);
      })
      .filter(Boolean);
  }, [value]);

  // Normalize all available items from `users` or `options`
  const allItems = useMemo(() => {
    if (Array.isArray(users) && users.length > 0) {
      return users.map((u) => {
        const idVal = String(u._id || u.id || "");
        const fullName =
          u.name ||
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.email ||
          "Unknown User";
        return {
          id: idVal,
          value: idVal,
          label: fullName,
          name: fullName,
          email: u.email || "",
          subtitle: u.email || u.role || u.department?.name || "",
          avatar: u.avatar || u.profilePhoto || null,
          role: u.role || "",
          raw: u,
        };
      });
    }

    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => {
        const idVal = String(opt.value ?? opt.id ?? opt._id ?? "");
        return {
          id: idVal,
          value: idVal,
          label: opt.label || opt.name || opt.title || idVal,
          name: opt.label || opt.name || opt.title || idVal,
          email: opt.email || "",
          subtitle: opt.subtitle || opt.description || opt.email || "",
          avatar: opt.avatar || null,
          role: opt.role || "",
          raw: opt,
        };
      });
    }

    return [];
  }, [users, options]);

  // Items that have been added (selected)
  const addedItems = useMemo(() => {
    const idMap = new Map(allItems.map((item) => [item.id, item]));
    return selectedIds.map((id) => {
      if (idMap.has(id)) return idMap.get(id);
      // Fallback for an ID that might not be loaded yet in users array
      return {
        id,
        value: id,
        label: `User (${id.slice(-4)})`,
        name: `User (${id.slice(-4)})`,
        subtitle: "",
        avatar: null,
      };
    });
  }, [selectedIds, allItems]);

  // Items that have NOT yet been added (unadded)
  const unaddedItems = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return allItems.filter((item) => !selectedSet.has(item.id));
  }, [allItems, selectedIds]);

  // Filter unadded items by search query
  const filteredUnadded = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return unaddedItems;
    return unaddedItems.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchEmail = item.email.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchRole = item.role.toLowerCase().includes(q);
      return matchName || matchEmail || matchSubtitle || matchRole;
    });
  }, [unaddedItems, searchQuery]);

  // Filter already-added items by search query (for the collapsible added list)
  const filteredAdded = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return addedItems;
    return addedItems.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchEmail = item.email.toLowerCase().includes(q);
      return matchName || matchEmail;
    });
  }, [addedItems, searchQuery]);

  // Dispatch change
  const triggerChange = useCallback(
    (newSelectedIds) => {
      if (disabled || !onChange) return;
      // Pass both standard event interface and direct value
      onChange({
        target: {
          name,
          value: newSelectedIds,
        },
      });
    },
    [disabled, name, onChange]
  );

  const handleAdd = (idToAdd) => {
    if (disabled) return;
    const strId = String(idToAdd);
    if (!selectedIds.includes(strId)) {
      triggerChange([...selectedIds, strId]);
    }
  };

  const handleRemove = (idToRemove) => {
    if (disabled) return;
    const strId = String(idToRemove);
    triggerChange(selectedIds.filter((id) => id !== strId));
  };

  const handleAddAll = () => {
    if (disabled) return;
    const allIds = Array.from(new Set([...selectedIds, ...filteredUnadded.map((i) => i.id)]));
    triggerChange(allIds);
  };

  const handleClearAll = () => {
    if (disabled) return;
    triggerChange([]);
  };

  // Compute position for the dropdown portal
  const updatePosition = useCallback(() => {
    if (!isOpen || disabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownPosition({
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? window.innerHeight - rect.top + 6 : undefined,
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      placeAbove,
    });
  }, [isOpen, disabled]);

  useEffect(() => {
    if (!isOpen || disabled) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, disabled, updatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation: Escape closes dropdown
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  // Render the portal dropdown
  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    return (
      <div
        ref={dropdownRef}
        data-modern-multiselect-dropdown="true"
        onKeyDown={handleKeyDown}
        className="fixed z-[99999] rounded-xl shadow-2xl overflow-hidden animate-fadeIn text-left flex flex-col
          bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 max-h-[380px]"
        style={{
          ...(dropdownPosition.top !== undefined ? { top: `${dropdownPosition.top}px` } : {}),
          ...(dropdownPosition.bottom !== undefined ? { bottom: `${dropdownPosition.bottom}px` } : {}),
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="p-3 border-b border-border-subtle dark:border-slate-800 bg-surface/50">
          <div className="relative flex items-center">
            <FiSearch className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-border-subtle dark:border-slate-700 bg-white dark:bg-slate-800 text-heading placeholder-muted outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-muted hover:text-heading p-0.5 rounded"
                title="Clear search"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span>
              {filteredUnadded.length > 0
                ? `${filteredUnadded.length} unassigned ${filteredUnadded.length === 1 ? "person" : "people"}`
                : "No unassigned people"}
            </span>
            {filteredUnadded.length > 1 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-black cursor-pointer"
              >
                <FiPlus className="w-3 h-3" /> Add all
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list of unadded items */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-1.5 space-y-1">
          {filteredUnadded.length > 0 ? (
            filteredUnadded.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleAdd(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleAdd(item.id);
                  }
                }}
                className="group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all hover:bg-amber-500/[0.08] dark:hover:bg-white/[0.05] focus:outline-none focus:bg-amber-500/[0.08]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <UserAvatarBadge name={item.name} src={item.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-heading truncate group-hover:text-brand-text transition-colors">
                      {item.name}
                    </p>
                    {item.subtitle && (
                      <p className="text-[10px] text-muted truncate">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                  <FiPlus className="w-3 h-3" /> Add
                </span>
              </div>
            ))
          ) : unaddedItems.length === 0 ? (
            <div className="py-6 px-4 text-center">
              <div className="w-9 h-9 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <FiCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-heading">All users assigned</p>
              <p className="text-[11px] text-muted mt-0.5">
                Every member in the portal has been added to this project.
              </p>
            </div>
          ) : (
            <div className="py-6 px-4 text-center text-muted">
              <p className="text-xs font-semibold">No matching users</p>
              <p className="text-[11px] mt-0.5">No unassigned people match "{searchQuery}"</p>
            </div>
          )}

          {/* Already added section in dropdown for transparency and easy removal */}
          {filteredAdded.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border-subtle dark:border-slate-800">
              <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-muted">
                Already Assigned ({filteredAdded.length})
              </p>
              {filteredAdded.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-surface/40 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 opacity-80">
                    <UserAvatarBadge name={item.name} src={item.avatar} size="xs" />
                    <span className="text-xs text-heading truncate font-medium">{item.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    title={`Remove ${item.name}`}
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-2.5 px-3 border-t border-border-subtle dark:border-slate-800 bg-surface/50 flex items-center justify-between">
          <div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
              >
                Clear all ({selectedIds.length})
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-brand text-on-brand shadow-sm hover:brightness-105 cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
        {/* Label and counter */}
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={id || name}
              className="block text-[10px] font-black text-muted uppercase tracking-widest"
            >
              {label} {required && <span className="text-danger">*</span>}
            </label>
            {addedItems.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {addedItems.length} assigned
              </span>
            )}
          </div>
        )}

        {/* The Trigger Box */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
              e.preventDefault();
              if (!disabled) setIsOpen(true);
            }
          }}
          className={`min-h-[46px] w-full rounded-lg px-3 py-2 text-left transition-all shadow-sm flex items-center justify-between gap-2 cursor-pointer
            bg-white dark:bg-slate-800
            ${
              disabled
                ? "border-border-subtle opacity-60 cursor-not-allowed bg-muted/10"
                : isOpen
                ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20"
                : error
                ? "border-red-400 dark:border-red-500"
                : "border-border-subtle hover:border-border-accent"
            }
            border
          `}
        >
          {/* Selected Chips container */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            {addedItems.length > 0 ? (
              <>
                {addedItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-xs font-semibold
                      bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/60 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UserAvatarBadge name={item.name} src={item.avatar} size="xs" />
                    <span className="truncate max-w-[130px]">{item.name}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="p-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/80 text-amber-700 dark:text-amber-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title={`Remove ${item.name}`}
                      aria-label={`Remove ${item.name}`}
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {!disabled && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                    <FiPlus className="w-3 h-3" /> Add more
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-muted flex items-center gap-2 select-none">
                <FiUserPlus className="w-4 h-4 opacity-50 shrink-0" />
                <span className="truncate">{placeholder}</span>
              </span>
            )}
          </div>

          {/* Right Chevron */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 text-muted">
            <FiChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-amber-500" : ""
              }`}
            />
          </div>
        </div>

        {/* Error or Helper text */}
        {error ? (
          <p className="text-danger text-xs mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[10px] text-muted mt-1">{helperText}</p>
        ) : null}
      </div>

      {/* Portal Dropdown */}
      {typeof document !== "undefined" && createPortal(renderDropdown(), document.body)}
    </>
  );
}
