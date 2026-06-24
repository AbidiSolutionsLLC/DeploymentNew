/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand-primary)',
        'brand-primary': 'var(--color-brand-primary)',
        'brand-sec': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        // Always-legible brand text for body copy/icons/tags.
        // In light mode it is a readable dark gold; in dark mode a bright gold.
        'brand-text': 'var(--color-brand-text)',
        app: 'var(--color-bg-app)',
        surface: 'var(--color-bg-primary)',
        card: 'var(--color-bg-secondary)',
        'card-hover': 'var(--color-bg-hover)',
        main: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        heading: 'var(--color-text-heading)',
        border: 'var(--color-border-primary)',
        'border-subtle': 'var(--color-border-secondary)',
        'border-accent': 'var(--color-border-accent)',
        // Text that sits on the brand gold — readable in BOTH themes
        // (dark gold text in light mode, dark text on bright gold in dark mode).
        'on-brand': 'var(--color-text-on-brand)',
        // Semantic status tokens — readable in BOTH themes.
        // Foreground / background / border for soft status badges.
        success: 'var(--status-fg)',
        'success-bg': 'var(--status-bg)',
        'success-border': 'var(--status-border)',
        warning: 'var(--status-warning-fg)',
        'warning-bg': 'var(--status-warning-bg)',
        'warning-border': 'var(--status-warning-border)',
        danger: 'var(--status-danger-fg)',
        error: 'var(--status-danger-fg)',
        'danger-bg': 'var(--status-danger-bg)',
        'danger-border': 'var(--status-danger-border)',
        'error-bg': 'var(--status-danger-bg)',
        'error-border': 'var(--status-danger-border)',
        info: 'var(--status-info-fg)',
        'info-bg': 'var(--status-info-bg)',
        'info-border': 'var(--status-info-border)',
        // Neutral status — subtle slate/gray, theme-aware.
        neutral: 'var(--color-text-tertiary)',
        'neutral-bg': 'var(--color-bg-tertiary)',
        'neutral-border': 'var(--color-border-secondary)',
        amber: {
          50: 'color-mix(in srgb, var(--color-brand-secondary) 25%, transparent)',
          100: 'var(--color-brand-secondary)',
          200: 'color-mix(in srgb, var(--color-brand-secondary) 85%, black)',
          300: 'color-mix(in srgb, var(--color-brand-primary) 70%, white)',
          400: 'color-mix(in srgb, var(--color-brand-primary) 85%, white)',
          500: 'var(--color-brand-primary)',
          600: 'var(--color-brand-accent)',
          700: 'color-mix(in srgb, var(--color-brand-accent) 85%, black)',
          800: 'color-mix(in srgb, var(--color-brand-accent) 70%, black)',
          900: 'color-mix(in srgb, var(--color-brand-accent) 55%, black)',
        }
      },
    },
  },
  plugins: [],
}
