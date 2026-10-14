/**
 * Project Portal — empty state.
 * Every data list must render one; copy says what belongs there + how to create it.
 */
export default function EmptyState({ title = "Nothing here yet", hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-border-accent flex items-center justify-center mb-3">
        <span className="text-brand-text font-black text-lg">K</span>
      </div>
      <p className="text-sm font-bold text-heading uppercase tracking-wide">{title}</p>
      {hint && <p className="text-xs text-muted mt-1 max-w-[260px]">{hint}</p>}
    </div>
  );
}
