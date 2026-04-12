import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          void: "#0a0c0f",
          steel: "#12161c",
          panel: "#1a1f28",
          rail: "#2a3140",
          wire: "#4a5568",
          amber: "#f59e0b",
          amberDim: "#b45309",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        display: ["var(--font-mono-industrial)", "ui-monospace", "monospace"],
        body: ["var(--font-sans-industrial)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(245,158,11,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,158,11,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
