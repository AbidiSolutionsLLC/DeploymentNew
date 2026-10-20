export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  id,
  size = "md",
  ariaLabel,
  label,
}) {
  const dims = size === "sm"
    ? { width: 34, height: 18, knob: 14, travel: 19, offset: 2 }
    : { width: 40, height: 22, knob: 16, travel: 21, offset: 3 };

  const handleToggle = () => {
    if (!disabled && typeof onChange === "function") {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel || label || "Toggle"}
      disabled={disabled}
      onClick={handleToggle}
      className="relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        width: dims.width,
        height: dims.height,
        backgroundColor: checked ? "var(--color-brand-primary)" : "rgba(120,120,120,0.35)",
        boxShadow: checked ? "0 0 0 3px rgba(212,175,55,0.18)" : "none",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
        style={{
          width: dims.knob,
          height: dims.knob,
          transform: checked
            ? `translateX(${dims.travel}px)`
            : `translateX(${dims.offset}px)`,
        }}
      />
    </button>
  );
}
