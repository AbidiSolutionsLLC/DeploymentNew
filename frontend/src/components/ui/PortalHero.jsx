import React from "react";
import { motion as Motion } from "framer-motion";
import "../../styles/adminPortal.css";

const EASE = [0.16, 1, 0.3, 1];

/**
 * Universal animated page hero shared by every admin portal screen.
 *
 * chips: [{ id?, icon?, value?, label, pulse? }]
 *   - icon renders a small leading glyph, value renders bold (<b>) text
 *   - pulse renders the animated gold dot instead of an icon
 * emblem: optional react-icon component rendered in the rotating badge
 * accent: hex colour for the emblem ring / glass disc / glow, so every
 *         page can carry its own emblem colour instead of all being gold.
 */
export default function PortalHero({
  title,
  description,
  emblem: Emblem,
  label,
}) {
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

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 px-5 py-5 sm:px-7 sm:py-6">
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
            className="lm-emblem hidden sm:grid"
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
