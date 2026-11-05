import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backed by CSS variables (see globals.css) so the palette can flip
        // between dark (default, original design) and light themes at runtime.
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
        },
        // Fixed dark navy, independent of theme — used for text that sits on
        // top of the brass accent color (e.g. primary buttons) in both themes.
        midnight: "#0E1A2B",
        brass: {
          DEFAULT: "#B08D57",
          light: "rgb(var(--brass-light) / <alpha-value>)",
          dark: "#8A6A3C",
        },
        slate: {
          50: "rgb(var(--slate-50) / <alpha-value>)",
          200: "rgb(var(--slate-200) / <alpha-value>)",
          400: "rgb(var(--slate-400) / <alpha-value>)",
          600: "rgb(var(--slate-600) / <alpha-value>)",
        },
        hairline: "rgb(var(--hairline) / <alpha-value>)",
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
