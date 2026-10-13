import React from "react";
import { motion as Motion } from "framer-motion";
import "../../styles/adminPortal.css";

const EASE = [0.16, 1, 0.3, 1];

/**
 * Universal admin tab bar with the animated sliding pill, per-tab count
 * badges and a right-aligned action slot — shared by every portal screen.
 *
 * tabs: [{ key, title, icon, hint?, badge? }]
 *   - hint   → native tooltip on the tab button
 *   - badge  → number rendered in the gold pill (hidden when <= 0)
 * right  → node rendered on the right (refresh buttons, range labels…)
 */
export default function PortalTabBar({
  tabs = [],
  activeKey,
  onChange,
  right = null,
  idPrefix = "tab",
  panelId = "tabpanel",
  ariaLabel = "Sections",
  layoutId = "portal-tab-pill",
  delay = 0.08,
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="lm-frame glass-card !px-3 !py-2.5 flex flex-col lg:flex-row lg:items-center gap-3"
    >
      <div
        className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              id={`${idPrefix}-${index}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId}
              title={item.hint}
              className={`lm-tab group flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-accent ${
                isActive
                  ? "is-active"
                  : "text-muted hover:text-heading hover:bg-card-hover"
              }`}
              onClick={() => onChange(item.key)}
            >
              {isActive && (
                <Motion.span
                  layoutId={layoutId}
                  className="lm-tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon
                  size={15}
                  className={isActive ? "text-brand-text" : "opacity-70 group-hover:opacity-100"}
                />
                {item.title}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="lm-badge" aria-label={`${item.badge} ${item.title}`}>
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {right && <div className="flex items-center gap-3 lg:ml-auto">{right}</div>}
    </Motion.div>
  );
}
