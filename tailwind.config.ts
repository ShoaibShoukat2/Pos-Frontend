import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(28,24,20,0.06), 0 12px 32px -18px rgba(28,24,20,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
