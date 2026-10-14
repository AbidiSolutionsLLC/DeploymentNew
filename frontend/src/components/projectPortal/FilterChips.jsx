/**
 * Project Portal — horizontally scrollable filter chips (never wraps).
 * options: [{ value, label, count? }]
 */
export default function FilterChips({ value, onChange, options = [], className = "" }) {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5 ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`shrink-0 px-3.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
              active
                ? "bg-brand text-on-brand border-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                : "bg-card text-muted border-border-subtle hover:border-border-accent hover:text-brand-text"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && <span className="ml-1 tabular-nums opacity-70">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
