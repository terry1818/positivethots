import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "swipe-left": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-150%) rotate(-25deg)", opacity: "0" },
        },
        "swipe-right": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(150%) rotate(25deg)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "xp-float": {
          "0%": { opacity: "1", transform: "translate(-50%, 0) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -80px) scale(1.2)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(400px) rotate(720deg)", opacity: "0" },
        },
        "blob-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(30px, -20px) scale(1.05)" },
          "50%": { transform: "translate(-20px, 20px) scale(0.95)" },
          "75%": { transform: "translate(20px, 10px) scale(1.02)" },
        },
        "emoji-burst": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "50%": { opacity: "1", transform: "translateY(-60px) scale(1.3)" },
          "100%": { opacity: "0", transform: "translateY(-120px) scale(0.8)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translate(-50%, 20px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        "pulse-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 0 transparent)" },
          "50%": { filter: "drop-shadow(0 0 12px hsl(270 60% 50% / 0.5))" },
        },
        "chip-select": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1.02)" },
        },
        "stagger-fade": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "swipe-left": "swipe-left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "swipe-right": "swipe-right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "fade-in": "fade-in 0.3s ease-out",
        "xp-float": "xp-float 1.5s ease-out forwards",
        "confetti-fall": "confetti-fall 2s ease-in forwards",
        "blob-float": "blob-float 18s ease-in-out infinite",
        "emoji-burst": "emoji-burst 1s ease-out forwards",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "chip-select": "chip-select 0.25s ease-out",
        "stagger-1": "stagger-fade 0.4s ease-out 0.1s both",
        "stagger-2": "stagger-fade 0.4s ease-out 0.2s both",
        "stagger-3": "stagger-fade 0.4s ease-out 0.3s both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
