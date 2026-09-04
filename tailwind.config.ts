import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1A2B",
          800: "#132238",
          700: "#182C48",
          600: "#203759",
        },
        brass: {
          DEFAULT: "#B08D57",
          light: "#D4B483",
          dark: "#8A6A3C",
        },
        slate: {
          50: "#EDEFF3",
          200: "#C7CDD8",
          400: "#8592A6",
          600: "#546076",
        },
        signal: {
          green: "#4C9A6A",
          red: "#C0564B",
          amber: "#C89B3C",
        },
      },
      fontFamily: {
        // Self-hosted-free stacks (no external font fetch required at build time).
        // Distinctive editorial serif for headings, clean system sans for body/UI.
        display: [
          '"Iowan Old Style"', '"Palatino Linotype"', "Palatino", '"URW Palladio L"',
          "Georgia", "serif",
        ],
        body: [
          "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto",
          '"Helvetica Neue"', "Arial", "sans-serif",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
