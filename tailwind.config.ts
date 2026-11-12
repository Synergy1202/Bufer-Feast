import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌟 NEW DARK THEME PALETTE
        background: "#0a0a0a",
        foreground: "#ffffff",
        primary: "#FF5500", // Vibrant Orange
        "primary-foreground": "#ffffff",
        accent: "#FF6B00", // Lighter Orange
        secondary: "#1a1a1a",
        muted: "#2a2a2a",
        "muted-foreground": "#a0a0a0",
        border: "#333333",
        card: "#111111",
        "card-foreground": "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "Arial", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;