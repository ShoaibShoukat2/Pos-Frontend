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

        // ── copper → royal purple (legacy accent classes) ─────────────
        copper: {
          300: "#d9ceee",
          400: "#5b35a8",
          500: "#3d2278",
          600: "#2a1458",
          700: "#1b0d3d",
        },

        // ── Brand tokens used by dashboards and shared buttons ────────
        brand: {
          50:  "#f6f3fb",
          100: "#ece6f7",
          200: "#d9ceee",
          300: "#c4b5e0",
          400: "#5b35a8",
          500: "#3d2278",
          600: "#2a1458",
          700: "#1b0d3d",
          900: "#1b0d3d",
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
        royal: {
          50:  "#f6f3fb",
          100: "#ece6f7",
          200: "#d9ceee",
          700: "#5b35a8",
          800: "#3d2278",
          900: "#2a1458",
          950: "#1b0d3d",
        },
        gold: {
          300: "#f6d56a",
          400: "#f0c14b",
          500: "#e2ae22",
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
