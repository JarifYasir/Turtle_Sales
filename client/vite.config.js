import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    // Suppress React warnings in development
    __DEV__: JSON.stringify(true),
  },
  server: {
    port: process.env.VITE_PORT || 5173,
    host: process.env.VITE_HOST || "0.0.0.0", // This allows external connections
    hmr: {
      port: process.env.VITE_HMR_PORT || 5173,
      // Use same host as page URL - fixes WebSocket connection issues
      // When false, Vite automatically uses the current page's host for WebSocket connections
      host: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["framer-motion", "react-toastify"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "@tanstack/react-query",
      "react-hook-form",
      "yup",
    ],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
