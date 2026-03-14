/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // Autodesk Yellow scale — base: #FFD200 (hsl 49 100% 50%)
        accent: {
          DEFAULT: "hsl(var(--ring))",
          50:  "hsl(49, 100%, 97%)",
          100: "hsl(49, 100%, 93%)",
          200: "hsl(49, 100%, 83%)",
          300: "hsl(49, 100%, 70%)",
          400: "hsl(49, 100%, 60%)",
          500: "hsl(49, 100%, 50%)",  // #FFD200
          600: "hsl(43,  96%, 38%)",
          700: "hsl(40,  90%, 28%)",
          800: "hsl(40,  85%, 22%)",
          900: "hsl(38,  80%, 15%)",
          950: "hsl(36,  80%,  9%)",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised:  "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          muted:   "hsl(var(--ink-muted))",
          faint:   "hsl(var(--ink-faint))",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
        },
      },
      gridTemplateColumns: {
        "12": "repeat(12, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
