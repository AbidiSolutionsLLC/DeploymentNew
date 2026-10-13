/** Project Portal — progress bar. Always pair with a numeric % label. */
export default function Progress({ value = 0, className = "", trackClassName = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`w-full h-1.5 rounded-full bg-border-subtle overflow-hidden ${trackClassName} ${className}`}>
      <div
        className="h-full rounded-full bg-amber-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
