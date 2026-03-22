import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller, faster bundles
    target: "es2020",
    // Aggressive chunk splitting for faster native loads
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify with esbuild (fastest)
    minify: "esbuild",
  },
}));
