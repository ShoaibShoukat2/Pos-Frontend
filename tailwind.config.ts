import type { Config } from "tailwindcss";

// ─── Design token mapping ────────────────────────────────────────────────────
//
// Old warm palette (ink/paper/copper) is REMAPPED to the new
// White + Indigo + Slate scheme. Every page that uses e.g.
// "text-ink-950" or "bg-paper-50" will now render in slate/white/indigo
// without touching individual files.
//
// Receipt slip still works because its ink/paper values are used for
// black-text-on-white-paper which maps correctly to slate-900 on white.
// ─────────────────────────────────────────────────────────────────────────────

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── ink → slate (dark text / dark bg) ──────────────────────────────
        ink: {
          950: "#0f172a",   // was #14110e → slate-900
          900: "#1e293b",   // was #1c1814 → slate-800
          800: "#334155",   // was #2a241e → slate-700
          700: "#475569",   // was #3d342c → slate-600
        },

        // ── paper → white / light-slate (page bg / card borders) ───────────
        paper: {
          50:  "#f8fafc",   // was #fbf7f0 → slate-50
          100: "#f1f5f9",   // was #f4eee4 → slate-100
          200: "#e2e8f0",   // was #e8dfd0 → slate-200
        },

        // ── copper → indigo (accent / active states) ────────────────────────
        copper: {
          400: "#818cf8",   // was #e8a04a → indigo-400
          500: "#6366f1",   // was #d4892a → indigo-500  (primary accent)
          600: "#4f46e5",   // was #b56e16 → indigo-600
        },

        // ── New semantic aliases (for new code) ─────────────────────────────
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#312e81",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },

      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:    ["var(--font-outfit)", "system-ui", "sans-serif"],
      },

      boxShadow: {
        card:         "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px -4px rgba(15,23,42,0.10)",
        "card-hover": "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px -4px rgba(15,23,42,0.14)",
        "ring-brand": "0 0 0 3px rgba(99,102,241,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
