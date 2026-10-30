import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Legacy ink/paper/copper — kept for receipt slip + admin ──
        ink: {
          950: "#14110e",
          900: "#1c1814",
          800: "#2a241e",
          700: "#3d342c",
        },
        paper: {
          50: "#fbf7f0",
          100: "#f4eee4",
          200: "#e8dfd0",
        },
        copper: {
          400: "#e8a04a",
          500: "#d4892a",
          600: "#b56e16",
        },
        // ── New UI palette: White + Indigo + Slate ──
        brand: {
          // Indigo shades
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          400: "#818cf8",
          500: "#6366f1",   // primary accent
          600: "#4f46e5",   // hover
          700: "#4338ca",   // active / pressed
          900: "#312e81",   // dark indigo
        },
        surface: {
          // Slate-based surfaces
          0:   "#ffffff",   // pure white
          50:  "#f8fafc",   // page bg
          100: "#f1f5f9",   // subtle bg
          200: "#e2e8f0",   // borders
          300: "#cbd5e1",   // stronger border
          400: "#94a3b8",   // muted text
          500: "#64748b",   // secondary text
          700: "#334155",   // body text
          800: "#1e293b",   // heading text
          900: "#0f172a",   // near-black
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:    ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:  "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px -4px rgba(15,23,42,0.10)",
        "card-hover": "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px -4px rgba(15,23,42,0.14)",
        "ring-brand": "0 0 0 3px rgba(99,102,241,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
