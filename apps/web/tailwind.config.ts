import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#11151C",
        "surface-raised": "#151A22",
        border: "#232A36",
        primary: "#8B5CF6",
        secondary: "#22D3EE",
        muted: "#8B93A7",
        success: "#34D399",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
    },
  },
  plugins: [],
};

export default config;
