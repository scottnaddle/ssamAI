/**
 * Design tokens — single source of truth. Mirror of tailwind.config.ts.
 * Use these for inline styles or where Tailwind classes aren't ergonomic.
 */
export const colors = {
  bg: "#FBF8F3",
  sidebar: "#FFFDF9",
  surface: "#FFFFFF",
  primary: {
    DEFAULT: "#3D6B4F",
    light: "#EAF2EC",
    mid: "#5A8F6E",
  },
  accent: {
    DEFAULT: "#D97B3A",
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
} as const;

export const avatarPalette = [
  "#D97B3A",
  "#3D6B4F",
  "#4A7CBF",
  "#8B5E9E",
  "#3D7A6B",
  "#B85C8A",
] as const;
