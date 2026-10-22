import React from "react";
import { motion as Motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { pageIcon } from "../../config/pageIcons";
import "../../styles/adminPortal.css";

const EASE = [0.16, 1, 0.3, 1];

/**
 * Universal animated page hero shared by every admin portal screen.
 *
 * title / description: heading copy.
 * emblem: optional override for the animated badge icon. When omitted, the
 *         emblem is resolved from the current route via the global
 *         PAGE_ICONS map, guaranteeing the hero icon always matches the
 *         left-nav icon for that page.
 * label: accessible label (defaults to title).
 */
export default function PortalHero({
  title,
  description,
  emblem,
  label,
  compact = false,
}) {
  const { pathname } = useLocation();
  const Emblem = emblem || pageIcon(pathname);
  return (
    <Motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="lm-hero glass-card !p-0"
      aria-label={label || title}
    >
      <span className="lm-orb lm-orb-1" aria-hidden="true" />
      <span className="lm-orb lm-orb-2" aria-hidden="true" />
      <span className="lm-dots" aria-hidden="true" />

      <div
        className={`relative z-10 flex flex-col sm:flex-row items-start sm:items-center ${
          compact
            ? "gap-4 px-5 py-4 sm:px-6 sm:py-4"
            : "gap-5 px-5 py-5 sm:px-7 sm:py-6"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="lm-title-wrap">
            <h1 className="lm-title">{title}</h1>
          </div>

          {description && (
            <p className="text-muted text-xs sm:text-sm font-medium mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {Emblem && (
          <div
            className={`lm-emblem hidden sm:grid${compact ? " lm-emblem-compact" : ""}`}
            style={{ "--lm-accent": "#D4AF37" }}
            aria-hidden="true"
          >
            <span className="lm-glow" />
            <span className="lm-emblem-core">
              <Emblem size={22} />
            </span>
          </div>
        )}
      </div>
    </Motion.section>
  );
}
