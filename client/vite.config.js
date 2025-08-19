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
    port: 5173,
    host: "0.0.0.0", // This allows external connections
    hmr: {
      port: 5173,
      host: "0.0.0.0", // Make sure HMR also accepts external connections
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
