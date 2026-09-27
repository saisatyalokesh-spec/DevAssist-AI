import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070B18",
          900: "#0B0F24",
          800: "#111632",
          700: "#171D3E",
          600: "#232B54",
        },
        accent: {
          purple: "#7C5CFF",
          blue: "#4C6FFF",
          light: "#A78BFA",
        },
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0B0F24 0%, #171D3E 45%, #2A2166 100%)",
        "accent-gradient": "linear-gradient(135deg, #4C6FFF 0%, #7C5CFF 100%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)",
        "card-lg": "0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
