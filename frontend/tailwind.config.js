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
