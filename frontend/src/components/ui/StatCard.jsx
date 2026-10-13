import React, { useEffect, useRef, useState } from "react";
import "../../styles/adminPortal.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animated count-up for numeric KPIs (falls back to the raw value otherwise). */
function useCountUp(target, duration = 750) {
  const isNumber = typeof target === "number" && Number.isFinite(target);
  const [value, setValue] = useState(isNumber && !prefersReducedMotion() ? 0 : target);
  const frame = useRef(null);

  useEffect(() => {
    if (!isNumber || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, isNumber]);

  return value;
}

/* Accent pairs matching the Admin Dashboard KPI cards, keyed by the colour
   token found in the `tone` prop (e.g. "text-emerald-600 dark:…"). */
const PALETTES = {
  emerald: { accent: "#10B981", grad: "linear-gradient(135deg, #34D399 0%, #059669 100%)" },
  green: { accent: "#10B981", grad: "linear-gradient(135deg, #34D399 0%, #059669 100%)" },
  amber: { accent: "#F59E0B", grad: "linear-gradient(135deg, #FBBF24 0%, #F97316 100%)" },
  yellow: { accent: "#EAB308", grad: "linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)" },
  orange: { accent: "#F97316", grad: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)" },
  rose: { accent: "#F43F5E", grad: "linear-gradient(135deg, #FB7185 0%, #E11D48 100%)" },
  red: { accent: "#F43F5E", grad: "linear-gradient(135deg, #FB7185 0%, #E11D48 100%)" },
  pink: { accent: "#EC4899", grad: "linear-gradient(135deg, #F472B6 0%, #DB2777 100%)" },
  sky: { accent: "#0EA5E9", grad: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)" },
  blue: { accent: "#3B82F6", grad: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)" },
  indigo: { accent: "#6366F1", grad: "linear-gradient(135deg, #818CF8 0%, #7C3AED 100%)" },
  violet: { accent: "#8B5CF6", grad: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)" },
  purple: { accent: "#A855F7", grad: "linear-gradient(135deg, #C084FC 0%, #9333EA 100%)" },
  teal: { accent: "#14B8A6", grad: "linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)" },
  cyan: { accent: "#06B6D4", grad: "linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)" },
};

/* Neutral slate pair used when `tone` carries no colour token (e.g.
   tone="text-main"). Deliberately NOT gold/amber — every KPI row has a
   gold "amber" card already, and two identical golden cards side by
   side read as a mistake. */
const DEFAULT_PALETTE = {
  accent: "#64748B",
  grad: "linear-gradient(135deg, #94A3B8 0%, #475569 100%)",
};

const pickPalette = (tone) => {
  const match = /text-(emerald|green|amber|yellow|orange|rose|red|pink|sky|blue|indigo|violet|purple|teal|cyan)-/.exec(
    tone || ""
  );
  return (match && PALETTES[match[1]]) || DEFAULT_PALETTE;
};

/**
 * KPI stat card used across every admin list page (leave, attendance…).
 * Renders the exact same shell as the Admin Dashboard KPI cards:
 *   lm-card · lm-card-lift · lm-kpi-icon · lm-kpi-value · lm-kpi-bar
 * Accent/gradient are derived from `tone` (or passed explicitly via
 * `accent` / `grad`).
 */
export default function StatCard({
  title,
  value,
  sub,
  icon,
  tone = "text-main",
  accent,
  grad,
}) {
  const Icon = icon;
  const animated = useCountUp(value);
  const palette =
    accent && grad ? { accent, grad } : pickPalette(tone);

  return (
    <div
      className="lm-card lm-card-lift"
      style={{ "--lm-accent": palette.accent, "--lm-grad": palette.grad }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">
              {title}
            </p>
            <h3 className="lm-kpi-value mt-2.5">{animated}</h3>
            {sub && (
              <p className="mt-2 text-xs font-medium text-muted leading-snug">{sub}</p>
            )}
          </div>

          <span className="lm-kpi-icon">
            <span className="lm-glow" aria-hidden="true" />
            {Icon ? <Icon size={18} /> : null}
          </span>
        </div>
      </div>

      <span className="lm-kpi-bar" aria-hidden />
    </div>
  );
}
