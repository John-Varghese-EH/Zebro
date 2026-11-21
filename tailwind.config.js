/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        navy: {
          950: 'rgb(var(--navy-950-rgb) / <alpha-value>)',
          900: 'rgb(var(--navy-900-rgb) / <alpha-value>)',
          800: 'rgb(var(--navy-800-rgb) / <alpha-value>)',
        },
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        chalk: {
          DEFAULT: 'rgb(var(--chalk-rgb) / <alpha-value>)',
          dim: 'rgb(var(--chalk-dim-rgb) / <alpha-value>)',
          faint: 'rgb(var(--chalk-faint-rgb) / <alpha-value>)',
        },
        sky: {
          DEFAULT: 'rgb(var(--sky-rgb) / <alpha-value>)',
          deep: 'rgb(var(--sky-deep-rgb) / <alpha-value>)',
        },
        alert: {
          DEFAULT: 'rgb(var(--alert-rgb) / <alpha-value>)',
          deep: 'rgb(var(--alert-deep-rgb) / <alpha-value>)',
        },
        ok: {
          DEFAULT: 'rgb(var(--ok-rgb) / <alpha-value>)',
          deep: 'rgb(var(--ok-deep-rgb) / <alpha-value>)',
        },
        saffron: {
          DEFAULT: 'rgb(var(--saffron-rgb) / <alpha-value>)',
          deep: 'rgb(var(--saffron-deep-rgb) / <alpha-value>)',
        },
        film: {
          50: 'rgb(var(--film-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--film-100-rgb) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        rule: 'rgb(var(--rule-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        condensed: ['"IBM Plex Sans Condensed"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        control: 'var(--radius-control)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
