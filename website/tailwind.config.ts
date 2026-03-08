import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      colors: {
        cream: "#f5f2ed",
        "cream-dark": "#eae5dd",
        lime: "#FF8A4C",
        "lime-bright": "#FF7A5C",
        "brand-orange": "#FF6B00",
        "brand-orange-light": "#FF9F43",
        "brand-red": "#FF3800",
        "brand-yellow": "#FFD54F",
        "maze-black": "#212121",
        "maze-gray": "#757575",
        "maze-blue": "#4a90d9",
        "maze-purple": "#9c6ade",
        "maze-orange": "#e8a838",
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF9F43 0%, #FF6B00 50%, #FF3800 100%)',
        'gradient-brand-radial': 'radial-gradient(circle at center, #FF9F43 0%, #FF6B00 50%, #FF3800 100%)',
      },
      boxShadow: {
        'brand-glow': '0 0 40px -10px rgba(255, 107, 0, 0.4)',
        'premium': '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      animation: {
        "scroll-left": "scroll-left 30s linear infinite",
        "scroll-left-slow": "scroll-left 45s linear infinite",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
        "float-1": "float-1 6s ease-in-out infinite",
        "float-2": "float-2 7s ease-in-out infinite",
        "float-3": "float-3 5s ease-in-out infinite",
        "gradient": "gradient 3s ease infinite",
        "flash": "flash 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        "gradient": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scroll-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
        "float-1": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(10px, -15px) rotate(2deg)" },
          "66%": { transform: "translate(-5px, 10px) rotate(-1deg)" },
        },
        "float-2": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(-12px, 8px) rotate(-2deg)" },
          "66%": { transform: "translate(8px, -12px) rotate(1deg)" },
        },
        "float-3": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(8px, 12px) rotate(1deg)" },
          "66%": { transform: "translate(-10px, -8px) rotate(-2deg)" },
        },
        "flash": {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 2px #fbbf24)" },
          "50%": { opacity: "0.6", filter: "drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 16px #f59e0b)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
