import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", "html"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        mut: "var(--mut)",
        dim: "var(--dim)",
        line: "var(--line)",
        surface: "var(--surface)",
        "surface-solid": "var(--surface-solid)",
        "surface-2": "var(--surface-2)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        em: "var(--em)",
        am: "var(--am)",
        rd: "var(--rd)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
