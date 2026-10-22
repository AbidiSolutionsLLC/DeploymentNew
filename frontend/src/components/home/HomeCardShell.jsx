import React from "react";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import "../../styles/adminPortal.css";

/**
 * Shared shell for People Portal dashboard cards.
 * Matches the admin portal lm-card language (accent hairline, icon chip,
 * lift hover) while keeping the existing delete-menu interaction.
 *
 * accent — hex colour driving the hairline + icon chip (admin KPI palette)
 * title  — uppercase card title
 * sub    — optional muted subtitle under the title
 * menuRef / menuOpen / onToggleMenu / onDelete — existing card menu wiring
 */
export default function HomeCardShell({
  title,
  sub,
  icon: Icon,
  accent = "#F59E0B",
  onDelete,
  menuRef,
  menuOpen,
  onToggleMenu,
  className = "",
  headerExtra,
  children,
  dense = false,
}) {
  return (
    <div
      className={`lm-card h-full w-full flex flex-col ${className}`}
      style={{ "--lm-accent": accent }}
    >
      <div
        className={`lm-card-head ${dense ? "!py-2.5 !px-3.5" : "!py-3 !px-4"}`}
        style={{ zIndex: menuOpen ? 10 : 1 }}
      >
        {Icon && (
          <span className="lm-ico-emblem-square !w-8 !h-8">
            <span className="lm-glow" aria-hidden="true" />
            <Icon size={14} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="lm-card-title !text-[11px] truncate">{title}</h3>
          {sub && <p className="lm-card-sub truncate">{sub}</p>}
        </div>
        {headerExtra}
        {onDelete && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={onToggleMenu}
              className="p-1.5 rounded-lg hover:bg-card-hover transition text-muted hover:text-main"
              aria-label="Card options"
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-surface shadow-lg border border-border-subtle rounded-xl z-99 overflow-visible py-1">
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onToggleMenu?.();
                  }}
                  className="flex items-center w-full px-3 py-2 text-[10px] text-danger hover:bg-danger-bg font-semibold"
                >
                  <FiTrash2 className="w-3 h-3 mr-2" />
                  Delete Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className={`${dense ? "px-3 pb-3 pt-2.5" : "p-4 pt-3"} flex-1 min-h-0 flex flex-col`}
      >
        {children}
      </div>
    </div>
  );
}
