import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
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
    // Raise warning threshold to avoid noise; we handle chunking below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunking: keep vendor libs separate so they can be cached
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-vendor";
          }
          if (id.includes("node_modules/firebase")) {
            return "firebase-vendor";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide-vendor";
          }
          if (id.includes("node_modules/recharts")) {
            return "recharts-vendor";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack-vendor";
          }
        },
        // Add content hash to all chunks for cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
