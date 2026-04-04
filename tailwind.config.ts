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
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
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
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
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
        "shimmer-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right-msg": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "hsl(270 60% 50% / 0.3)", boxShadow: "0 0 0 0 hsl(270 60% 50% / 0.1)" },
          "50%": { borderColor: "hsl(270 60% 50% / 0.8)", boxShadow: "0 0 20px 0 hsl(270 60% 50% / 0.2)" },
        },
        "peek-unblur": {
          "0%, 100%": { filter: "blur(20px)" },
          "50%": { filter: "blur(16px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" },
        },
        "glow-ring": {
          "0%, 100%": { boxShadow: "0 0 20px 4px hsl(270 60% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 40px 8px hsl(270 60% 50% / 0.6)" },
        },
        "typing-wave": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" },
        },
        "tap-bounce": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.92)" },
          "100%": { transform: "scale(1)" },
        },
        "confetti-heart": {
          "0%": { opacity: "1", transform: "translateY(-20px) rotate(0deg) scale(0.8)" },
          "100%": { opacity: "0", transform: "translateY(400px) rotate(720deg) scale(0.4)" },
        },
        "mascot-entrance": {
          "0%": { opacity: "0", transform: "scale(0) rotate(-15deg)" },
          "60%": { opacity: "1", transform: "scale(1.15) rotate(5deg)" },
          "80%": { transform: "scale(0.95) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "swipe-fly-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-120%) scale(1.05)", opacity: "0" },
        },
        "card-enter": {
          "0%": { transform: "scale(0.95)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "match-slide-left": {
          "0%": { transform: "translateX(-120%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "match-slide-right": {
          "0%": { transform: "translateX(120%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "badge-unlock": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "tab-bounce": {
          "0%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-3px)" },
          "100%": { transform: "translateY(0)" },
        },
        "msg-send": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "page-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "confetti-particle": {
          "0%": { opacity: "1", transform: "translateY(0) rotate(0deg)" },
          "70%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(80vh) translateX(var(--drift-x, 0px)) rotate(720deg)" },
        },
        "sparkle-rise": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.5)" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-100vh) scale(1.2)" },
        },
        "mascot-empathetic": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(-5deg)" },
        },
        "mascot-celebrate": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.15) rotate(5deg) translateY(-10px)" },
          "75%": { transform: "scale(1.15) rotate(-5deg) translateY(-10px)" },
        },
        "mascot-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "75%": { transform: "translateX(3px)" },
        },
        "mascot-bounce-loop": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "mascot-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(15deg)" },
          "75%": { transform: "rotate(-15deg)" },
        },
        "mascot-sleep": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.8" },
          "50%": { transform: "translateY(2px)", opacity: "0.9" },
        },
        "mascot-surprise": {
          "0%": { transform: "scale(0.9)" },
          "40%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "mascot-love": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "streak-gentle-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "streak-fast-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "streak-rapid-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        "streak-frantic": {
          "0%, 100%": { transform: "scale(1) translateX(0)" },
          "25%": { transform: "scale(1.15) translateX(-2px)" },
          "50%": { transform: "scale(1.2) translateX(0)" },
          "75%": { transform: "scale(1.15) translateX(2px)" },
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
        "stagger-fade": "stagger-fade 0.4s ease-out both",
        "shimmer-sweep": "shimmer-sweep 2s ease-in-out infinite",
        "slide-in-left": "slide-in-left 0.3s ease-out both",
        "slide-in-right-msg": "slide-in-right-msg 0.3s ease-out both",
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        "peek-unblur": "peek-unblur 3s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out",
        "glow-ring": "glow-ring 2s ease-in-out infinite",
        "typing-wave": "typing-wave 1.4s ease-in-out infinite",
        "tap-bounce": "tap-bounce 0.2s ease-out",
        "confetti-heart": "confetti-heart 2.5s ease-in forwards",
        "screen-flash": "screen-flash 0.4s ease-out forwards",
        "shake-wrong": "shake-wrong 0.4s ease-out",
        "ripple-complete": "ripple-complete 0.6s ease-out forwards",
        "heartbeat": "heartbeat 1.2s ease-in-out infinite",
        "fire-trail": "fire-trail 1s linear infinite",
        "crown-spin": "crown-spin 0.8s ease-out",
        "streak-glow": "streak-glow 2s ease-in-out infinite",
        "banner-slide": "banner-slide 2.5s ease-in-out forwards",
        "mascot-entrance": "mascot-entrance 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "float-gentle": "float-gentle 3s ease-in-out infinite",
        "swipe-fly-up": "swipe-fly-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "card-enter": "card-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "match-slide-left": "match-slide-left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "match-slide-right": "match-slide-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
        "badge-unlock": "badge-unlock 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "tab-bounce": "tab-bounce 0.25s ease-out",
        "msg-send": "msg-send 0.25s ease-out both",
        "page-fade": "page-fade 0.2s ease-out both",
        "confetti-particle": "confetti-particle 2s ease-in forwards",
        "sparkle-rise": "sparkle-rise 3s ease-out forwards",
        "mascot-empathetic": "mascot-empathetic 2s ease-in-out infinite",
        "mascot-celebrate": "mascot-celebrate 0.6s ease-in-out infinite",
        "mascot-shake": "mascot-shake 0.2s ease-in-out 3",
        "mascot-bounce": "mascot-bounce-loop 0.4s ease-in-out infinite",
        "mascot-wave": "mascot-wave 0.6s ease-in-out",
        "mascot-sleep": "mascot-sleep 3s ease-in-out infinite",
        "mascot-surprise": "mascot-surprise 0.4s ease-out",
        "mascot-love": "mascot-love 1s ease-in-out infinite",
        "streak-gentle-pulse": "streak-gentle-pulse 3s ease-in-out infinite",
        "streak-fast-pulse": "streak-fast-pulse 1.5s ease-in-out infinite",
        "streak-rapid-pulse": "streak-rapid-pulse 0.8s ease-in-out infinite",
        "streak-frantic": "streak-frantic 0.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
