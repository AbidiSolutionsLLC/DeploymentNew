import { useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import useVariant from "./useVariant";

/**
 * PROTOTYPE — floating bottom bar that cycles the Project Portal design
 * variants (0 Current → A → B → C, wrapping). Updates `?variant=` via
 * router.replace so a variant is shareable/reload-stable.
 * Hidden in production builds so a stray merge can't ship the bar.
 *
 * Keyboard: ← / → cycle variants (ignored while typing in inputs/textareas).
 */
export default function PrototypeSwitcher() {
  const { meta, step } = useVariant();
  const enabled = import.meta.env.DEV;

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, step]);

  if (!enabled) return null;

  return (
    <div
      className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1 sm:gap-2 rounded-full bg-slate-900/95 dark:bg-slate-950/95 text-white px-2 sm:px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-amber-400/50 backdrop-blur"
      title="Prototype variant switcher (← / → keys)"
    >
      <button
        onClick={() => step(-1)}
        aria-label="Previous variant"
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <ChevronLeftIcon className="h-5 w-5 text-amber-300" />
      </button>

      <div className="flex flex-col items-center leading-none px-1 min-w-[128px] sm:min-w-[168px] text-center select-none">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
          Prototype
        </span>
        <span className="mt-0.5 text-xs sm:text-sm font-bold">
          {meta.code} · {meta.name}
        </span>
      </div>

      <button
        onClick={() => step(1)}
        aria-label="Next variant"
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <ChevronRightIcon className="h-5 w-5 text-amber-300" />
      </button>
    </div>
  );
}
