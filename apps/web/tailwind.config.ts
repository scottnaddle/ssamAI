import type { Config } from "tailwindcss";

/**
 * Tailwind tokens mirror the wireframe color palette (ssamAI_wireframe_v2.jsx).
 * Single source of truth — components reference these tokens, never raw hex.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FBF8F3",            // app background (cream)
        sidebar: "#FFFDF9",       // nav surface
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#3D6B4F",     // sage green
          light: "#EAF2EC",
          mid: "#5A8F6E",
        },
        accent: {
          DEFAULT: "#D97B3A",     // warm orange
          light: "#FDF0E6",
        },
        text: {
          DEFAULT: "#2C2C2C",
          mid: "#5C5C5C",
          light: "#9A9A9A",
        },
        border: "#E8E2D9",
        tag: {
          blue: "#E8F0FE",
          green: "#E6F4EA",
          orange: "#FEF3E8",
          purple: "#F3E8FD",
        },
        userBubble: "#EAF2EC",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Apple SD Gothic Neo",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        ssamAI: "14px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
