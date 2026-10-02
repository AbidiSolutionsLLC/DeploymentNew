/** Project Portal — section header for panels (title + micro subtitle + optional action). */
export default function PanelHead({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-sm font-black text-heading uppercase tracking-wider truncate">{title}</h3>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
