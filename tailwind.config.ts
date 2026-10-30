import type { Config } from "tailwindcss";

/**
 * Color palette — White + Indigo + Slate
 *
 * All old `copper` classes are remapped to indigo so existing pages
 * automatically use the new scheme without editing every file.
 * The `ink` family maps to slate (dark text/bg).
 * The `paper` family maps to slate-light (page bg, borders).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── ink → slate-dark ─────────────────────────────────────────
        ink: {
          950: "#0f172a",   // slate-900
          900: "#1e293b",   // slate-800
          800: "#334155",   // slate-700
          700: "#475569",   // slate-600
        },

        // ── paper → slate-light (bg / border) ────────────────────────
        paper: {
          50:  "#f8fafc",   // slate-50
          100: "#f1f5f9",   // slate-100
          200: "#e2e8f0",   // slate-200
        },

        // ── copper → indigo (ALL accent / active states) ─────────────
        // Any page using bg-copper-500, text-copper-600 etc. now renders indigo.
        copper: {
          300: "#a5b4fc",   // indigo-300
          400: "#818cf8",   // indigo-400
          500: "#6366f1",   // indigo-500
          600: "#4f46e5",   // indigo-600
          700: "#4338ca",   // indigo-700
        },

        // ── New semantic tokens (for new code) ────────────────────────
        brand: {
          50:  "#eef2ff",   // indigo-50
          100: "#e0e7ff",   // indigo-100
          200: "#c7d2fe",   // indigo-200
          300: "#a5b4fc",   // indigo-300
          400: "#818cf8",   // indigo-400
          500: "#6366f1",   // indigo-500
          600: "#4f46e5",   // indigo-600
          700: "#4338ca",   // indigo-700
          900: "#312e81",   // indigo-900
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8fafc",   // slate-50
          100: "#f1f5f9",   // slate-100
          200: "#e2e8f0",   // slate-200
          300: "#cbd5e1",   // slate-300
          400: "#94a3b8",   // slate-400
          500: "#64748b",   // slate-500
          700: "#334155",   // slate-700
          800: "#1e293b",   // slate-800
          900: "#0f172a",   // slate-900
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
