import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
    hmr: false,
  },
  // Force Vite to pre-bundle ALL dependencies so mobile/tunnel gets fewer requests
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@clerk/clerk-react",
      "firebase/app",
      "firebase/firestore",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "lucide-react",
    ],
    force: false,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
  },
}));
